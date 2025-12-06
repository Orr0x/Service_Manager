'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Calendar, MapPin, User, Clock, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { api } from '@/trpc/react'

interface JobPreviewModalProps {
    isOpen: boolean
    onClose: () => void
    jobId: string | null
}

export function JobPreviewModal({ isOpen, onClose, jobId }: JobPreviewModalProps) {
    const [selectedWorkers, setSelectedWorkers] = useState<string[]>([])
    const [startTime, setStartTime] = useState<string>('')
    const [endTime, setEndTime] = useState<string>('')
    const [error, setError] = useState<string | null>(null)
    const utils = api.useUtils()

    const { data: job, isLoading } = api.jobs.getById.useQuery(jobId!, {
        enabled: !!jobId
    })

    const { data: workers } = api.workers.getAll.useQuery()
    const { data: contractors } = api.contractors.getAll.useQuery()

    const updateAssignments = api.jobs.updateAssignments.useMutation()
    const updateJob = api.jobs.update.useMutation()

    useEffect(() => {
        if (job) {
            if (job.job_assignments) {
                const currentIds = job.job_assignments.map((a: any) =>
                    a.worker_id || a.contractor_id
                ).filter(Boolean)
                setSelectedWorkers(currentIds)
            }
            if (job.start_time) setStartTime(new Date(job.start_time).toISOString().slice(0, 16))
            if (job.end_time) setEndTime(new Date(job.end_time).toISOString().slice(0, 16))
        }
    }, [job])

    useEffect(() => {
        if (isOpen) {
            setError(null)
        }
    }, [isOpen])

    const handleSave = async () => {
        if (!jobId) return
        setError(null)

        const assignments = selectedWorkers.map(id => {
            const isWorker = workers?.some(w => w.id === id)
            return {
                workerId: isWorker ? id : undefined,
                contractorId: !isWorker ? id : undefined
            }
        })

        try {
            await Promise.all([
                updateAssignments.mutateAsync({
                    jobId,
                    assignments
                }),
                updateJob.mutateAsync({
                    id: jobId,
                    startTime: startTime ? new Date(startTime).toISOString() : undefined,
                    endTime: endTime ? new Date(endTime).toISOString() : undefined,
                })
            ])

            utils.jobs.getAll.invalidate()
            utils.jobs.getById.invalidate(jobId)
            onClose()
        } catch (error: any) {
            // Only log unexpected errors to console (suppress expected CONFLICT errors)
            // TRPCClientError usually exposes 'shape' or 'data'. We can check message or code.
            // Using a safe check preventing crash if properties missing.
            const isConflict = error?.data?.code === 'CONFLICT' || error?.message?.includes('unavailable');

            if (!isConflict) {
                console.error('Failed to save changes:', error)
            }
            // If conflict, give specific instruction; otherwise generic error
            const errorMessage = isConflict
                ? 'One or more workers are unavailable. Please assign a different worker.'
                : (error.message || 'Failed to save changes. Please try again.')

            setError(errorMessage)
        }
    }

    const toggleWorker = (id: string) => {
        setSelectedWorkers(prev =>
            prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
        )
    }

    if (!jobId) return null

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <X className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                {isLoading ? (
                                    <div className="animate-pulse space-y-4">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                ) : job ? (
                                    <div>
                                        <div className="mb-4">
                                            <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                                                {job.title}
                                            </Dialog.Title>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {job.customers?.business_name || job.customers?.contact_name}
                                            </p>
                                        </div>

                                        {error && (
                                            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                                                <div className="flex">
                                                    <div className="flex-shrink-0">
                                                        <X className="h-5 w-5 text-red-400" aria-hidden="true" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm text-red-700">{error}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                                {job.job_sites?.name || 'No Site'}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Start Time</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={startTime}
                                                        onChange={(e) => setStartTime(e.target.value)}
                                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[var(--primary-color)] sm:text-sm sm:leading-6"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">End Time</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={endTime}
                                                        onChange={(e) => setEndTime(e.target.value)}
                                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[var(--primary-color)] sm:text-sm sm:leading-6"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t pt-4">
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">Assignments</h4>
                                            <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-2 bg-gray-50">
                                                {workers?.map(worker => (
                                                    <div key={worker.id} className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedWorkers.includes(worker.id)}
                                                            onChange={() => toggleWorker(worker.id)}
                                                            className="h-4 w-4 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                                                        />
                                                        <label className="ml-3 text-sm text-gray-700">
                                                            {worker.first_name} {worker.last_name} <span className="text-xs text-gray-400">(Worker)</span>
                                                        </label>
                                                    </div>
                                                ))}
                                                {contractors?.map(contractor => (
                                                    <div key={contractor.id} className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedWorkers.includes(contractor.id)}
                                                            onChange={() => toggleWorker(contractor.id)}
                                                            className="h-4 w-4 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                                                        />
                                                        <label className="ml-3 text-sm text-gray-700">
                                                            {contractor.company_name} <span className="text-xs text-gray-400">(Contractor)</span>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                                            <button
                                                type="button"
                                                className="inline-flex w-full justify-center rounded-md bg-[var(--primary-color)] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                                                onClick={handleSave}
                                                disabled={updateAssignments.isPending || updateJob.isPending}
                                            >
                                                {updateAssignments.isPending || updateJob.isPending ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            <Link
                                                href={`/dashboard/jobs/${job.id}`}
                                                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                                            >
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                View Full Details
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div>Job not found</div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}

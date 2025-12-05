'use client'

import { api } from '@/trpc/react'
import { format } from 'date-fns'
import { Calendar, MapPin, User, Clock, CheckSquare, ArrowLeft, Edit } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { NotesSection } from '@/components/notes-section'
import { AttachmentsSection } from '@/components/attachments-section'
import { useState } from 'react'

export function JobDetail({ id }: { id: string }) {
    const router = useRouter()
    const utils = api.useUtils()
    const { data: job, isLoading } = api.jobs.getById.useQuery(id)

    const updateChecklist = api.jobs.updateChecklistProgress.useMutation({
        onSuccess: () => {
            utils.jobs.getById.invalidate(id)
        }
    })

    const toggleChecklistItem = (checklistId: string, items: any[], itemIndex: number) => {
        const newItems = [...items]
        newItems[itemIndex].isCompleted = !newItems[itemIndex].isCompleted
        updateChecklist.mutate({
            jobChecklistId: checklistId,
            items: newItems
        })
    }

    if (isLoading) {
        return <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-100 rounded w-1/3"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
        </div>
    }

    if (!job) {
        return <div>Job not found</div>
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6">
                <Link href="/dashboard/jobs" className="text-sm text-gray-500 hover:text-gray-700 flex items-center mb-4">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Jobs
                </Link>
                <div className="md:flex md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                            {job.title}
                        </h2>
                        <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                <User className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                                {job.customers?.business_name || job.customers?.contact_name}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                <MapPin className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                                {job.job_sites?.name || 'No Site'}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                <Calendar className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                                {job.start_time ? format(new Date(job.start_time), 'MMM d, yyyy h:mm a') : 'Unscheduled'}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${job.status === 'completed' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                            job.status === 'in_progress' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                job.status === 'scheduled' ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' :
                                    'bg-gray-50 text-gray-600 ring-gray-500/10'
                            }`}>
                            {job.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <Link
                            href={`/dashboard/jobs/${id}/edit`}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            <Edit className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                            Edit
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                        <h3 className="text-base font-semibold leading-7 text-gray-900">Description</h3>
                        <p className="mt-2 text-sm leading-6 text-gray-600">
                            {job.description || 'No description provided.'}
                        </p>
                    </div>

                    {/* Checklists */}
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                        <h3 className="text-base font-semibold leading-7 text-gray-900 flex items-center">
                            <CheckSquare className="h-5 w-5 mr-2 text-gray-400" />
                            Checklists
                        </h3>
                        <div className="mt-4">
                            {job.job_checklists && job.job_checklists.length > 0 ? (
                                <div className="space-y-6">
                                    {job.job_checklists.map((cl: any) => {
                                        const items = typeof cl.items === 'string' ? JSON.parse(cl.items) : cl.items || []
                                        return (
                                            <div key={cl.id}>
                                                <h4 className="text-sm font-medium text-gray-900 mb-2">{cl.checklists?.name}</h4>
                                                <ul className="space-y-2">
                                                    {Array.isArray(items) && items.map((item: any, index: number) => (
                                                        <li key={index} className="flex items-start">
                                                            <div className="flex h-6 items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={item.isCompleted}
                                                                    onChange={() => toggleChecklistItem(cl.id, items, index)}
                                                                    className="h-4 w-4 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                                                                />
                                                            </div>
                                                            <div className="ml-3 text-sm leading-6">
                                                                <label className={`font-medium ${item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                                                    {item.text}
                                                                </label>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No checklists attached.</p>
                            )}
                        </div>
                    </div>

                    {/* Attachments */}
                    <AttachmentsSection entityType="job" entityId={id} />

                    {/* Notes */}
                    <NotesSection entityType="job" entityId={id} />
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Assignments */}
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                        <h3 className="text-base font-semibold leading-7 text-gray-900">Assignments</h3>
                        <ul className="mt-4 divide-y divide-gray-100">
                            {job.job_assignments && job.job_assignments.length > 0 ? (
                                job.job_assignments.map((assignment: any) => (
                                    <li key={assignment.id} className="flex items-center justify-between py-2">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                                                {(assignment.workers?.first_name?.[0] || assignment.contractors?.company_name?.[0] || '?').toUpperCase()}
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {assignment.workers
                                                        ? `${assignment.workers.first_name} ${assignment.workers.last_name}`
                                                        : assignment.contractors?.company_name}
                                                </p>
                                                <p className="text-xs text-gray-500 capitalize">{assignment.status}</p>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">No workers assigned.</p>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}

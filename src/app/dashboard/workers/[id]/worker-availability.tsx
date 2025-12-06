'use client'

import { useState } from 'react'
import { api } from '@/trpc/react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react'

interface WorkerAvailabilityProps {
    workerId: string
}

export function WorkerAvailability({ workerId }: WorkerAvailabilityProps) {
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [reason, setReason] = useState('')

    const { data: unavailability, refetch } = api.workers.getUnavailability.useQuery({ workerId })

    const addUnavailability = api.workers.addUnavailability.useMutation({
        onSuccess: () => {
            setStartDate('')
            setEndDate('')
            setReason('')
            refetch()
        },
    })

    const removeUnavailability = api.workers.removeUnavailability.useMutation({
        onSuccess: () => {
            refetch()
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!startDate || !endDate) return

        addUnavailability.mutate({
            workerId,
            startDate,
            endDate,
            reason,
        })
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-base font-semibold leading-6 text-gray-900">Blocked Days</h3>
                <p className="mt-1 text-sm text-gray-500">Manage days when this worker is unavailable for scheduling.</p>
            </div>

            {/* Add New Block */}
            <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-4 items-end">
                    <div className="sm:col-span-1">
                        <label htmlFor="startDate" className="block text-sm font-medium leading-6 text-gray-900">
                            Start Date
                        </label>
                        <div className="mt-1">
                            <input
                                type="date"
                                name="startDate"
                                id="startDate"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>
                    <div className="sm:col-span-1">
                        <label htmlFor="endDate" className="block text-sm font-medium leading-6 text-gray-900">
                            End Date
                        </label>
                        <div className="mt-1">
                            <input
                                type="date"
                                name="endDate"
                                id="endDate"
                                required
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>
                    <div className="sm:col-span-1">
                        <label htmlFor="reason" className="block text-sm font-medium leading-6 text-gray-900">
                            Reason
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="reason"
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g. Vacation"
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={addUnavailability.isPending}
                            className="w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        >
                            {addUnavailability.isPending ? 'Adding...' : 'Block Dates'}
                        </button>
                    </div>
                </div>
            </form>

            {/* List */}
            <div className="overflow-hidden bg-white shadow ring-1 ring-black ring-opacity-5 sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-100">
                    {unavailability?.length === 0 && (
                        <li className="px-4 py-4 sm:px-6 text-center text-gray-500 text-sm">
                            No blocked days found.
                        </li>
                    )}
                    {unavailability?.map((item) => (
                        <li key={item.id} className="flex gap-x-6 justify-between px-4 py-5 hover:bg-gray-50 sm:px-6">
                            <div className="flex min-w-0 gap-x-4">
                                <div className="min-w-0 flex-auto">
                                    <p className="text-sm font-semibold leading-6 text-gray-900">
                                        {format(new Date(item.start_date), 'MMM d, yyyy')} - {format(new Date(item.end_date), 'MMM d, yyyy')}
                                    </p>
                                    {item.reason && (
                                        <p className="mt-1 truncate text-xs leading-5 text-gray-500">{item.reason}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-x-4">
                                <button
                                    onClick={() => removeUnavailability.mutate({ id: item.id })}
                                    disabled={removeUnavailability.isPending}
                                    className="text-red-600 hover:text-red-900"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

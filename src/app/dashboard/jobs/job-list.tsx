'use client'

import { api } from '@/trpc/react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Calendar, MapPin, User, Clock, Plus } from 'lucide-react'

export function JobList() {
    const { data: jobs, isLoading } = api.jobs.getAll.useQuery({})

    if (isLoading) {
        return <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
            ))}
        </div>
    }

    if (!jobs || jobs.length === 0) {
        return (
            <div className="text-center py-12">
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No jobs</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new job.</p>
                <div className="mt-6">
                    <Link
                        href="/dashboard/jobs/new"
                        className="inline-flex items-center rounded-md bg-[var(--primary-color)] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        New Job
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <ul role="list" className="divide-y divide-gray-100">
            {jobs.map((job) => (
                <li key={job.id} className="relative flex justify-between gap-x-6 py-5 hover:bg-gray-50 px-4 rounded-md transition-colors">
                    <div className="flex min-w-0 gap-x-4">
                        <div className="min-w-0 flex-auto">
                            <p className="text-sm font-semibold leading-6 text-gray-900">
                                <Link href={`/dashboard/jobs/${job.id}`}>
                                    <span className="absolute inset-x-0 -top-px bottom-0" />
                                    {job.title}
                                </Link>
                            </p>
                            <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                <p className="truncate">
                                    {job.customers?.business_name || job.customers?.contact_name}
                                </p>
                                <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                                    <circle cx={1} cy={1} r={1} />
                                </svg>
                                <p className="whitespace-nowrap flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {job.job_sites?.name || 'No Site'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-x-4">
                        <div className="hidden sm:flex sm:flex-col sm:items-end">
                            <p className="text-sm leading-6 text-gray-900 flex items-center">
                                <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                                {job.start_time ? format(new Date(job.start_time), 'MMM d, yyyy') : 'Unscheduled'}
                            </p>
                            <div className="mt-1 flex items-center gap-x-1.5">
                                <div className={`flex-none rounded-full p-1 ${job.status === 'completed' ? 'text-green-400 bg-green-400/10' :
                                    job.status === 'in_progress' ? 'text-blue-400 bg-blue-400/10' :
                                        job.status === 'scheduled' ? 'text-yellow-400 bg-yellow-400/10' :
                                            'text-gray-400 bg-gray-400/10'
                                    }`}>
                                    <div className="h-1.5 w-1.5 rounded-full bg-current" />
                                </div>
                                <p className="text-xs leading-5 text-gray-500 capitalize">{job.status.replace('_', ' ')}</p>
                            </div>
                        </div>
                        <div className="h-5 w-5 flex-none text-gray-400" aria-hidden="true">
                            <Clock className="h-5 w-5" />
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    )
}



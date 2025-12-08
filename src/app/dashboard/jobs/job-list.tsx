'use client'

import { api } from '@/trpc/react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Calendar, MapPin, User, Clock, Plus, Briefcase } from 'lucide-react'
import { useState } from 'react'
import { ViewToggle } from '@/components/common/view-toggle'
import { cn } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'

export function JobList() {
    const [view, setView] = useState<'list' | 'grid'>('list')
    const searchParams = useSearchParams()
    const search = searchParams.get('search') || undefined

    const { data: jobs, isLoading } = api.jobs.getAll.useQuery({ search })

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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-4 sm:px-6 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                <h3 className="text-base font-semibold leading-6 text-gray-900">All Jobs</h3>
                <ViewToggle view={view} setView={setView} />
            </div>

            {view === 'list' ? (
                <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
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
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {jobs.map((job) => (
                        <div key={job.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-1 flex-col p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${job.status === 'completed' ? 'bg-green-100 text-green-600' :
                                            job.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                                                job.status === 'scheduled' ? 'bg-yellow-100 text-yellow-600' :
                                                    'bg-gray-100 text-gray-600'
                                            }`}>
                                            <Briefcase className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold leading-relaxed text-gray-900">
                                                <Link href={`/dashboard/jobs/${job.id}`}>
                                                    <span className="absolute inset-0" />
                                                    {job.title}
                                                </Link>
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <div className={`flex-none rounded-full p-1 ${job.status === 'completed' ? 'text-green-400 bg-green-400/10' :
                                                    job.status === 'in_progress' ? 'text-blue-400 bg-blue-400/10' :
                                                        job.status === 'scheduled' ? 'text-yellow-400 bg-yellow-400/10' :
                                                            'text-gray-400 bg-gray-400/10'
                                                    }`}>
                                                    <div className="h-1.5 w-1.5 rounded-full bg-current" />
                                                </div>
                                                <p className="text-xs font-medium text-gray-500 capitalize">{job.status.replace('_', ' ')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-col gap-2">
                                    <dl className="flex flex-col gap-1">
                                        <dt className="sr-only">Customer</dt>
                                        <dd className="text-sm text-gray-500 flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-400 shrink-0" />
                                            <span className="truncate">{job.customers?.business_name || job.customers?.contact_name}</span>
                                        </dd>
                                        <dt className="sr-only">Location</dt>
                                        <dd className="text-sm text-gray-500 flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                                            <span className="truncate">{job.job_sites?.name || 'No Site'}</span>
                                        </dd>
                                        <dt className="sr-only">Start Time</dt>
                                        <dd className="text-sm text-gray-500 flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                                            <span className="truncate">{job.start_time ? format(new Date(job.start_time), 'MMM d, yyyy') : 'Unscheduled'}</span>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}



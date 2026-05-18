'use client'

import { api } from '@/trpc/react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Calendar, MapPin, User, Clock, Plus, Briefcase } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useMobileDefaultView } from '@/hooks/use-mobile-default-view'
import { ViewToggle } from '@/components/common/view-toggle'
import { useSearchParams } from 'next/navigation'
import { DataViewControls } from '@/components/common/data-view-controls'
import { compareValues, groupRows, includesSearch } from '@/lib/data-view'

export function JobList() {
    const [view, setView] = useMobileDefaultView()
    const searchParams = useSearchParams()
    const search = searchParams.get('search') || undefined
    const dashboardFilter = searchParams.get('dashboard') || 'all'
    const dashboardRange = searchParams.get('range') || 'all'
    const dashboardStartDate = searchParams.get('startDate')
    const dashboardEndDate = searchParams.get('endDate')
    const [refineSearch, setRefineSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [sortBy, setSortBy] = useState('start_time')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
    const [groupBy, setGroupBy] = useState('none')

    const { data: jobs, isLoading } = api.jobs.getAll.useQuery({ search })

    const visibleJobs = useMemo(() => {
        return [...(jobs || [])]
            .filter((job) => matchesDashboardJobFilter(job, dashboardFilter))
            .filter((job) => isWithinDashboardRange(job, dashboardFilter, dashboardRange, dashboardStartDate, dashboardEndDate))
            .filter((job) => statusFilter === 'all' || job.status === statusFilter)
            .filter((job) => includesSearch([
                job.title,
                job.description,
                job.status,
                job.customers?.business_name,
                job.customers?.contact_name,
                job.job_sites?.name,
                job.job_sites?.address,
            ], refineSearch))
            .sort((a, b) => compareValues(getJobSortValue(a, sortBy), getJobSortValue(b, sortBy), sortDirection))
    }, [jobs, refineSearch, sortBy, sortDirection, statusFilter, dashboardFilter, dashboardRange, dashboardStartDate, dashboardEndDate])

    const groupedJobs = useMemo(() => groupRows(visibleJobs, groupBy, getJobGroup), [visibleJobs, groupBy])

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
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-4 shadow-sm ring-1 ring-gray-900/5 sm:px-6 sm:rounded-xl">
                <div>
                    <h3 className="text-base font-semibold leading-6 text-gray-900">{getDashboardFilterLabel(dashboardFilter)} ({visibleJobs.length})</h3>
                    {dashboardFilter !== 'all' && (
                        <Link href="/dashboard/jobs" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                            Clear dashboard filter
                        </Link>
                    )}
                </div>
                <ViewToggle view={view} setView={setView} />
            </div>

            <DataViewControls
                search={refineSearch}
                onSearchChange={setRefineSearch}
                searchPlaceholder="Refine jobs by title, customer, site, or status..."
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOptions={[
                    { value: 'start_time', label: 'Start date' },
                    { value: 'title', label: 'Title' },
                    { value: 'customer', label: 'Customer' },
                    { value: 'site', label: 'Job site' },
                    { value: 'status', label: 'Status' },
                ]}
                sortDirection={sortDirection}
                onSortDirectionChange={setSortDirection}
                groupBy={groupBy}
                onGroupByChange={setGroupBy}
                groupOptions={[
                    { value: 'none', label: 'No grouping' },
                    { value: 'status', label: 'Status' },
                    { value: 'date', label: 'Date' },
                    { value: 'customer', label: 'Customer' },
                    { value: 'site', label: 'Job site' },
                ]}
                filters={[
                    {
                        id: 'status',
                        label: 'Status',
                        value: statusFilter,
                        onChange: setStatusFilter,
                        options: [
                            { value: 'all', label: 'All statuses' },
                            { value: 'draft', label: 'Draft' },
                            { value: 'pending', label: 'Pending' },
                            { value: 'scheduled', label: 'Scheduled' },
                            { value: 'in_progress', label: 'In progress' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'cancelled', label: 'Cancelled' },
                        ],
                    },
                ]}
                onReset={() => {
                    setRefineSearch('')
                    setStatusFilter('all')
                    setSortBy('start_time')
                    setSortDirection('desc')
                    setGroupBy('none')
                }}
            />

            {visibleJobs.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                    No jobs match the current filters.
                </div>
            )}

            {view === 'list' ? (
                <div className="space-y-4">
                    {groupedJobs.map((group) => (
                        <div key={group.key} className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                            {groupBy !== 'none' && <GroupHeader label={group.label} count={group.rows.length} />}
                            <ul role="list" className="divide-y divide-gray-100">
                                {group.rows.map((job) => (
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
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {groupedJobs.map((group) => (
                        <section key={group.key} className="space-y-3">
                            {groupBy !== 'none' && <GroupHeader label={group.label} count={group.rows.length} />}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {group.rows.map((job) => (
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
                        </section>
                    ))}
                </div>
            )}
        </div>
    )
}

function getJobSortValue(job: any, sortBy: string) {
    switch (sortBy) {
        case 'title':
            return job.title
        case 'customer':
            return job.customers?.business_name || job.customers?.contact_name
        case 'site':
            return job.job_sites?.name
        case 'status':
            return job.status
        case 'start_time':
        default:
            return job.start_time
    }
}

function matchesDashboardJobFilter(job: any, filter: string) {
    switch (filter) {
        case 'unscheduled':
            return isUnscheduledJob(job)
        case 'scheduled':
            return job.status === 'scheduled'
        case 'in_progress':
            return job.status === 'in_progress'
        case 'completed':
            return job.status === 'completed'
        default:
            return true
    }
}

function isUnscheduledJob(job: any) {
    return !job.start_time || job.status === 'draft' || job.status === 'pending'
}

function isWithinDashboardRange(job: any, filter: string, range: string, startDate?: string | null, endDate?: string | null) {
    if (range === 'all') return true

    const { start, end } = getDashboardRangeDates(range, startDate, endDate)
    if (!start && !end) return true

    const value = filter === 'completed'
        ? job.actual_end_time || job.end_time || job.updated_at || job.start_time
        : job.start_time || job.created_at

    if (!value) return false

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return false
    if (start && date < start) return false
    if (end && date > end) return false

    return true
}

function getDashboardRangeDates(range: string, customStartDate?: string | null, customEndDate?: string | null) {
    const now = new Date()
    let start: Date | null = null
    let end: Date | null = null

    if (range === 'today') {
        start = new Date(now)
        start.setHours(0, 0, 0, 0)
        end = new Date(now)
        end.setHours(23, 59, 59, 999)
    } else if (range === 'week') {
        const day = now.getDay() || 7
        start = new Date(now)
        start.setDate(now.getDate() - day + 1)
        start.setHours(0, 0, 0, 0)
        end = new Date(start)
        end.setDate(start.getDate() + 6)
        end.setHours(23, 59, 59, 999)
    } else if (range === 'month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    } else if (range === 'year') {
        start = new Date(now.getFullYear(), 0, 1)
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
    } else if (range === 'custom') {
        start = customStartDate ? new Date(customStartDate) : null
        if (start) start.setHours(0, 0, 0, 0)
        end = customEndDate ? new Date(customEndDate) : null
        if (end) end.setHours(23, 59, 59, 999)
    }

    return { start, end }
}

function getDashboardFilterLabel(filter: string) {
    switch (filter) {
        case 'unscheduled':
            return 'Unscheduled Jobs'
        case 'scheduled':
            return 'Scheduled Jobs'
        case 'in_progress':
            return 'In Progress Jobs'
        case 'completed':
            return 'Completed Jobs'
        default:
            return 'All Jobs'
    }
}

function getJobGroup(job: any, groupBy: string) {
    switch (groupBy) {
        case 'status':
            return { key: job.status || 'unknown', label: formatLabel(job.status || 'Unknown') }
        case 'date': {
            const label = job.start_time ? format(new Date(job.start_time), 'dd MMM yyyy') : 'Unscheduled'
            return { key: label, label }
        }
        case 'customer': {
            const label = job.customers?.business_name || job.customers?.contact_name || 'No customer'
            return { key: label, label }
        }
        case 'site': {
            const label = job.job_sites?.name || 'No site'
            return { key: label, label }
        }
        default:
            return { key: 'all', label: 'All jobs' }
    }
}

function GroupHeader({ label, count }: { label: string; count: number }) {
    return (
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2 text-sm">
            <h4 className="font-semibold text-gray-900">{label}</h4>
            <span className="text-xs font-medium text-gray-500">{count} jobs</span>
        </div>
    )
}

function formatLabel(value: string) {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

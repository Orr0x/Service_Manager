'use client'

import { Building2, Calendar, CheckCircle2, Clock, PlayCircle, User, Users, Briefcase, Receipt, FileCheck, Plus } from 'lucide-react'
import { api } from '@/trpc/react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useMemo, useState, type ComponentType } from 'react'

type DashboardRange = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom'

type Activity = {
    id: string
    entity_type: string
    action_type: string
    created_at: string | number | Date
    actor?: {
        first_name?: string | null
        last_name?: string | null
    } | null
    details?: {
        title?: string | null
        name?: string | null
        status?: string | null
    } | null
}

type DashboardCardFilter = 'unscheduled' | 'scheduled' | 'in_progress' | 'completed'

function DashboardSummaryCard({
    title,
    count,
    isLoading,
    icon: Icon,
    iconClassName,
    caption,
    href,
    actionLabel = 'Open jobs',
}: {
    title: string
    count?: number
    isLoading: boolean
    icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
    iconClassName: string
    caption: string
    href: string
    actionLabel?: string
}) {
    return (
        <Link href={href} className="block overflow-hidden rounded-lg bg-white shadow transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="p-4 sm:p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <Icon className={`h-6 w-6 ${iconClassName}`} aria-hidden />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="truncate text-sm font-medium text-gray-500">{title}</dt>
                            <dd>
                                <div className="text-lg font-medium text-gray-900">
                                    {isLoading ? '...' : count ?? 0}
                                </div>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-500">{caption}</span>
                    <span className="font-semibold text-blue-600">{actionLabel}</span>
                </div>
            </div>
        </Link>
    )
}

function ActivityItem({ activity }: { activity: Activity }) {
    let icon = User
    let color = 'text-gray-500'

    switch (activity.entity_type) {
        case 'job':
            icon = Briefcase
            color = 'text-blue-600'
            break
        case 'worker':
            icon = User
            color = 'text-green-600'
            break
        case 'invoice':
            icon = Receipt
            color = 'text-amber-600'
            break
        case 'quote':
            icon = FileCheck
            color = 'text-purple-600'
            break
        case 'site':
            icon = Briefcase // Building2 ideally
            color = 'text-indigo-600'
            break
        case 'customer':
            icon = User
            color = 'text-cyan-600'
            break
    }

    const Icon = icon

    return (
        <li className="relative flex gap-x-4">
            <div className="absolute left-0 top-0 flex w-6 justify-center -bottom-6">
                <div className="w-px bg-gray-200"></div>
            </div>
            <div className={`relative flex h-6 w-6 flex-none items-center justify-center bg-white`}>
                <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div className="flex-auto py-0.5 text-xs leading-5 text-gray-500">
                <span className="font-medium text-gray-900">
                    {activity.actor?.first_name ? `${activity.actor.first_name} ${activity.actor.last_name || ''}`.trim() : 'System'}
                </span>
                {' '}
                <span className={color}>{activity.action_type}</span>
                {' '}
                a
                {' '}
                <span className="font-medium text-gray-900 capitalize">{activity.entity_type.replace('_', ' ')}</span>
                {activity.details?.title && `: ${activity.details.title}`}
                {activity.details?.name && `: ${activity.details.name}`}
                {activity.details?.status && ` to ${activity.details.status}`}
                <span className="whitespace-nowrap ml-2 text-gray-400">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </span>
            </div>
        </li>
    )
}

export default function DashboardPage() {
    const [range, setRange] = useState<DashboardRange>('all')
    const [customStartDate, setCustomStartDate] = useState('')
    const [customEndDate, setCustomEndDate] = useState('')
    const dashboardInput = useMemo(() => ({
        range,
        startDate: range === 'custom' ? customStartDate || undefined : undefined,
        endDate: range === 'custom' ? customEndDate || undefined : undefined,
    }), [range, customStartDate, customEndDate])
    const { data: stats, isLoading: statsLoading } = api.dashboard.getStats.useQuery(dashboardInput, {
        refetchInterval: 10000,
        refetchOnWindowFocus: true,
    })
    const { data: recentActivity, isLoading: activityLoading } = api.activity.getRecent.useQuery({
        limit: 10,
        range,
        startDate: range === 'custom' ? customStartDate || undefined : undefined,
        endDate: range === 'custom' ? customEndDate || undefined : undefined,
    }, {
        refetchInterval: 10000,
        refetchOnWindowFocus: true,
    })

    const tabs: { name: string; value: DashboardRange }[] = [
        { name: 'Today', value: 'today' },
        { name: 'Week', value: 'week' },
        { name: 'Month', value: 'month' },
        { name: 'Year', value: 'year' },
        { name: 'All', value: 'all' },
        { name: 'Custom', value: 'custom' },
    ]
    const getJobsHref = (filter: DashboardCardFilter) => {
        const params = getRangeParams()
        params.set('dashboard', filter)

        return `/dashboard/jobs?${params.toString()}`
    }
    const getRangeParams = () => {
        const params = new URLSearchParams({ range })
        if (range === 'custom') {
            if (customStartDate) params.set('startDate', customStartDate)
            if (customEndDate) params.set('endDate', customEndDate)
        }

        return params
    }
    const getWorkersHref = () => {
        const params = getRangeParams()
        params.set('dashboard', 'scheduled')
        return `/dashboard/workers?${params.toString()}`
    }
    const getJobSitesHref = () => {
        const params = getRangeParams()
        params.set('dashboard', 'range')
        return `/dashboard/job-sites?${params.toString()}`
    }

    return (
        <div className="space-y-5 sm:space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                    Cleaning Services Dashboard
                </h1>
                <div className="flex w-full overflow-x-auto rounded-lg bg-gray-100 p-1 sm:w-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setRange(tab.value)}
                            className={`flex-1 whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-md transition-colors sm:flex-none ${range === tab.value
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>
            </div>

            {range === 'custom' && (
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="text-sm">
                            <span className="mb-1 block font-medium text-gray-700">From</span>
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(event) => setCustomStartDate(event.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                            />
                        </label>
                        <label className="text-sm">
                            <span className="mb-1 block font-medium text-gray-700">To</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(event) => setCustomEndDate(event.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                            />
                        </label>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-6">
                <DashboardSummaryCard
                    title="Unscheduled"
                    count={stats?.jobs.unscheduled}
                    isLoading={statsLoading}
                    icon={Calendar}
                    iconClassName="text-gray-400"
                    caption="Needs scheduling"
                    href={getJobsHref('unscheduled')}
                />
                <DashboardSummaryCard
                    title="Scheduled"
                    count={stats?.jobs.scheduled}
                    isLoading={statsLoading}
                    icon={Clock}
                    iconClassName="text-blue-400"
                    caption="Pending jobs"
                    href={getJobsHref('scheduled')}
                />
                <DashboardSummaryCard
                    title="In Progress"
                    count={stats?.jobs.inProgress}
                    isLoading={statsLoading}
                    icon={PlayCircle}
                    iconClassName="text-orange-400"
                    caption="Currently active"
                    href={getJobsHref('in_progress')}
                />
                <DashboardSummaryCard
                    title="Completed"
                    count={stats?.jobs.completed}
                    isLoading={statsLoading}
                    icon={CheckCircle2}
                    iconClassName="text-green-400"
                    caption="Finished in range"
                    href={getJobsHref('completed')}
                />
                <DashboardSummaryCard
                    title="Scheduled Workers"
                    count={stats?.workers.scheduled}
                    isLoading={statsLoading}
                    icon={Users}
                    iconClassName="text-purple-400"
                    caption="Assigned to scheduled jobs"
                    href={getWorkersHref()}
                    actionLabel="Open workers"
                />
                <DashboardSummaryCard
                    title="Job Sites"
                    count={stats?.jobSites.inRange}
                    isLoading={statsLoading}
                    icon={Building2}
                    iconClassName="text-indigo-400"
                    caption="Used in selected range"
                    href={getJobSitesHref()}
                    actionLabel="Open sites"
                />
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Quick Actions */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">
                            Quick Actions
                        </h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6 flex flex-col gap-4">
                        <Link href="/dashboard/jobs/new" className="w-full">
                            <button className="w-full inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                <Plus className="mr-2 h-4 w-4 text-gray-500" /> Schedule Job
                            </button>
                        </Link>
                        <Link href="/dashboard/jobs" className="w-full">
                            <button className="w-full inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                <Briefcase className="mr-2 h-4 w-4 text-gray-500" /> View All Jobs
                            </button>
                        </Link>
                        <Link href="/dashboard/workers" className="w-full">
                            <button className="w-full inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                <User className="mr-2 h-4 w-4 text-gray-500" /> Manage Workers
                            </button>
                        </Link>
                        <Link href="/dashboard/invoices/new" className="w-full">
                            <button className="w-full inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                <Receipt className="mr-2 h-4 w-4 text-gray-500" /> Create Invoice
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Recent Activity Timeline */}
                <div className="overflow-hidden rounded-lg bg-white shadow lg:col-span-1">
                    <div className="border-b border-gray-200 px-4 py-5 sm:px-6 flex items-center justify-between">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">
                            Recent Activity
                        </h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6 max-h-[400px] overflow-y-auto">
                        {activityLoading ? (
                            <p className="text-sm text-gray-500 text-center">Loading activity...</p>
                        ) : recentActivity && recentActivity.length > 0 ? (
                            <ul role="list" className="space-y-6">
                                {recentActivity.map((activity) => (
                                    <ActivityItem key={activity.id} activity={activity} />
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 text-center">No recent activity.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

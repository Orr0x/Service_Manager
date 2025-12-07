'use client'

import { Calendar, CheckCircle2, Clock, PlayCircle, AlertCircle, User, Briefcase, FileText, Receipt, FileCheck, Plus } from 'lucide-react'
import { api } from '@/trpc/react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'

function ActivityItem({ activity }: { activity: any }) {
    let icon = User
    let color = 'text-gray-500'
    let bgColor = 'bg-gray-50'
    let ringColor = 'ring-gray-500/10'

    switch (activity.entity_type) {
        case 'job':
            icon = Briefcase
            color = 'text-blue-600'
            bgColor = 'bg-blue-50'
            ringColor = 'ring-blue-600/10'
            break
        case 'worker':
            icon = User
            color = 'text-green-600'
            bgColor = 'bg-green-50'
            ringColor = 'ring-green-600/10'
            break
        case 'invoice':
            icon = Receipt
            color = 'text-amber-600'
            bgColor = 'bg-amber-50'
            ringColor = 'ring-amber-600/10'
            break
        case 'quote':
            icon = FileCheck
            color = 'text-purple-600'
            bgColor = 'bg-purple-50'
            ringColor = 'ring-purple-600/10'
            break
        case 'site':
            icon = Briefcase // Building2 ideally
            color = 'text-indigo-600'
            bgColor = 'bg-indigo-50'
            ringColor = 'ring-indigo-600/10'
            break
        case 'customer':
            icon = User
            color = 'text-cyan-600'
            bgColor = 'bg-cyan-50'
            ringColor = 'ring-cyan-600/10'
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
    const [range, setRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('all')
    const { data: stats, isLoading: statsLoading } = api.dashboard.getStats.useQuery({ range })
    const { data: recentActivity, isLoading: activityLoading } = api.activity.getRecent.useQuery({ limit: 10, range })

    const tabs = [
        { name: 'Today', value: 'today' },
        { name: 'Week', value: 'week' },
        { name: 'Month', value: 'month' },
        { name: 'Year', value: 'year' },
        { name: 'All', value: 'all' },
    ]

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Cleaning Services Dashboard
                </h1>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {tabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setRange(tab.value as any)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${range === tab.value
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Jobs */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Calendar className="h-6 w-6 text-gray-400" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="truncate text-sm font-medium text-gray-500">Total Jobs</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900">
                                            {statsLoading ? '...' : stats?.jobs.total}
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm">
                            <span className="text-gray-500">{range === 'today' ? 'Scheduled today' : `In selected range`}</span>
                        </div>
                    </div>
                </div>

                {/* Scheduled */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Clock className="h-6 w-6 text-blue-400" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="truncate text-sm font-medium text-gray-500">Scheduled</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900">
                                            {statsLoading ? '...' : stats?.jobs.scheduled}
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm">
                            <span className="text-gray-500">Pending jobs</span>
                        </div>
                    </div>
                </div>

                {/* In Progress */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <PlayCircle className="h-6 w-6 text-orange-400" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="truncate text-sm font-medium text-gray-500">In Progress</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900">
                                            {statsLoading ? '...' : stats?.jobs.inProgress}
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm">
                            <span className="text-gray-500">Currently active</span>
                        </div>
                    </div>
                </div>

                {/* Completed */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <CheckCircle2 className="h-6 w-6 text-green-400" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="truncate text-sm font-medium text-gray-500">Completed</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900">
                                            {statsLoading ? '...' : stats?.jobs.completed}
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm">
                            <span className="text-gray-500">Finished in range</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
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

                {/* Revenue/Stats Summary */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">
                            Financial Overview
                        </h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Est. Revenue</dt>
                                <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                                    {statsLoading ? '...' : `£${stats?.revenue.toFixed(2)}`}
                                </dd>
                                <p className="mt-1 text-xs text-gray-500">Based on invoices in range</p>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Potential Value</dt>
                                <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                                    {statsLoading ? '...' : `£${stats?.quotesValue.toFixed(2)}`}
                                </dd>
                                <p className="mt-1 text-xs text-gray-500">From quotes in range</p>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Est. Labour Cost</dt>
                                <dd className="mt-1 text-3xl font-semibold tracking-tight text-red-600">
                                    {statsLoading ? '...' : `£${stats?.laborCost.toFixed(2)}`}
                                </dd>
                                <p className="mt-1 text-xs text-gray-500">Based on assigned hours & rates</p>
                            </div>
                        </dl>
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

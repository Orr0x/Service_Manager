'use client'

import { useState } from 'react'
import { CalendarView } from './calendar-view'
import { ListView } from './list-view'
import { KanbanBoard } from './kanban-board'
import { Plus, LayoutGrid, Calendar as CalendarIcon, Briefcase, CheckCircle, PlayCircle, Download, List } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/trpc/react'

export default function SchedulePage() {
    const [viewMode, setViewMode] = useState<'calendar' | 'kanban' | 'list'>('calendar')
    const { data: stats } = api.jobs.getDashboardStats.useQuery()

    return (
        <div id="printable-content" className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
            <div className="space-y-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-2xl font-semibold text-gray-900">Schedule</h1>
                        {/* View Toggles */}
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'calendar'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <CalendarIcon className="w-4 h-4 mr-2" />
                                Calendar
                            </button>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'kanban'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <LayoutGrid className="w-4 h-4 mr-2" />
                                Kanban
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <List className="w-4 h-4 mr-2" />
                                List
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            <Download className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Download
                        </button>
                        <Link
                            href="/dashboard/jobs/new"
                            className="inline-flex items-center rounded-md bg-[var(--primary-color)] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            New Job
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total Jobs */}
                    <div className="overflow-hidden rounded-lg bg-white shadow ring-1 ring-gray-900/5">
                        <div className="p-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Briefcase className="h-6 w-6 text-blue-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500 uppercase">Total Jobs</dt>
                                        <dd>
                                            <div className="text-2xl font-bold text-blue-600">{stats?.total || 0}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scheduled */}
                    <div className="overflow-hidden rounded-lg bg-white shadow ring-1 ring-gray-900/5">
                        <div className="p-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CalendarIcon className="h-6 w-6 text-orange-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500 uppercase">Scheduled</dt>
                                        <dd>
                                            <div className="text-2xl font-bold text-orange-600">{stats?.scheduled || 0}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* In Progress */}
                    <div className="overflow-hidden rounded-lg bg-white shadow ring-1 ring-gray-900/5">
                        <div className="p-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <PlayCircle className="h-6 w-6 text-indigo-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500 uppercase">In Progress</dt>
                                        <dd>
                                            <div className="text-2xl font-bold text-indigo-600">{stats?.inProgress || 0}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Completed */}
                    <div className="overflow-hidden rounded-lg bg-white shadow ring-1 ring-gray-900/5">
                        <div className="p-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CheckCircle className="h-6 w-6 text-green-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500 uppercase">Completed</dt>
                                        <dd>
                                            <div className="text-2xl font-bold text-green-600">{stats?.completed || 0}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-4 overflow-hidden">
                {viewMode === 'calendar' ? (
                    <CalendarView />
                ) : viewMode === 'kanban' ? (
                    <KanbanBoard />
                ) : (
                    <ListView />
                )}
            </div>
        </div>
    )
}

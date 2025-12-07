'use client'

import { useState } from 'react'
import { CalendarView } from './calendar-view'
import { KanbanBoard } from './kanban-board'
import { Plus, LayoutGrid, Calendar as CalendarIcon } from 'lucide-react'
import Link from 'next/link'

export default function SchedulePage() {
    const [viewMode, setViewMode] = useState<'calendar' | 'kanban'>('calendar')

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
            <div className="flex items-center justify-between shrink-0">
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
                    </div>
                </div>

                <Link
                    href="/dashboard/jobs/new"
                    className="inline-flex items-center rounded-md bg-[var(--primary-color)] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    New Job
                </Link>
            </div>

            <div className="flex-1 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-4 overflow-hidden">
                {viewMode === 'calendar' ? (
                    <CalendarView />
                ) : (
                    <KanbanBoard />
                )}
            </div>
        </div>
    )
}

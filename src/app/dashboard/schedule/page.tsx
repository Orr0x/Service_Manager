import { Suspense } from 'react'
import { CalendarView } from './calendar-view'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function SchedulePage() {
    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
            <div className="flex items-center justify-between shrink-0">
                <h1 className="text-2xl font-semibold text-gray-900">Schedule</h1>
                <Link
                    href="/dashboard/jobs/new"
                    className="inline-flex items-center rounded-md bg-[var(--primary-color)] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    New Job
                </Link>
            </div>

            <div className="flex-1 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-4 overflow-hidden">
                <Suspense fallback={<div>Loading schedule...</div>}>
                    <CalendarView />
                </Suspense>
            </div>
        </div>
    )
}

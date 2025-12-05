import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { JobList } from './job-list'

export default function JobsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Jobs</h1>
                <Link
                    href="/dashboard/jobs/new"
                    className="inline-flex items-center rounded-md bg-[var(--primary-color)] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    New Job
                </Link>
            </div>

            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
                <div className="px-4 py-5 sm:p-6">
                    <Suspense fallback={<div>Loading jobs...</div>}>
                        <JobList />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}

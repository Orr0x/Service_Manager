import Link from 'next/link'
import { api, HydrateClient } from '@/trpc/server'
import { Plus, Briefcase, Clock, Calendar, CheckCircle } from 'lucide-react'
import { JobList } from './job-list'
import { SearchInput } from '@/components/common/search-input'

export default async function JobsPage() {
    await api.jobs.getAll.prefetch()
    const stats = await api.jobs.getDashboardStats()

    return (
        <HydrateClient>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Jobs</h1>
                        <p className="mt-2 text-sm text-gray-700">
                            Manage your service jobs, assignments, and schedules
                        </p>
                    </div>
                    <Link
                        href="/dashboard/jobs/new"
                        className="inline-flex items-center rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        New Job
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total Jobs */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Briefcase className="h-6 w-6 text-blue-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">TOTAL JOBS</dt>
                                        <dd>
                                            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* In Progress */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Clock className="h-6 w-6 text-yellow-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">IN PROGRESS</dt>
                                        <dd>
                                            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scheduled */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Calendar className="h-6 w-6 text-purple-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">SCHEDULED</dt>
                                        <dd>
                                            <div className="text-2xl font-bold text-purple-600">{stats.scheduled}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Completed */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CheckCircle className="h-6 w-6 text-green-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">COMPLETED</dt>
                                        <dd>
                                            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <SearchInput placeholder="Search jobs by title or description..." />

                {/* Job List */}
                {/* Job List */}
                <JobList />
            </div>
        </HydrateClient>
    )
}

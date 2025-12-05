import { Calendar, CheckCircle2, Clock, PlayCircle, AlertCircle, User, Briefcase } from 'lucide-react'

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Cleaning Services Dashboard
                </h1>
                <button className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                    Schedule Cleaning
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Jobs Today */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Calendar className="h-6 w-6 text-gray-400" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="truncate text-sm font-medium text-gray-500">Total Jobs Today</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900">0</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm">
                            <a href="#" className="font-medium text-blue-700 hover:text-blue-900">
                                All scheduled jobs for today
                            </a>
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
                                        <div className="text-lg font-medium text-gray-900">0</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm">
                            <span className="text-gray-500">Awaiting start</span>
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
                                        <div className="text-lg font-medium text-gray-900">0</div>
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
                                        <div className="text-lg font-medium text-gray-900">0</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm">
                            <span className="text-gray-500">Finished today</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Schedule */}
            <div className="overflow-hidden rounded-lg bg-white shadow">
                <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                        Today's Cleaning Schedule
                    </h3>
                </div>
                <div className="px-4 py-12 sm:px-6 text-center">
                    <p className="text-sm font-semibold text-gray-900">No cleaning jobs scheduled</p>
                    <p className="mt-1 text-sm text-gray-500">Schedule a new cleaning job to get started</p>
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
                    <div className="px-4 py-5 sm:p-6 flex gap-4">
                        <button className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                            View All Jobs
                        </button>
                        <button className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                            Manage Workers
                        </button>
                    </div>
                </div>

                {/* This Week */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">
                            This Week
                        </h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Jobs Scheduled</dt>
                                <dd className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">0</dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Revenue</dt>
                                <dd className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">£0.00</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Alerts */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">
                            Alerts
                        </h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <p className="text-sm text-gray-500">No alerts</p>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="overflow-hidden rounded-lg bg-white shadow">
                <div className="border-b border-gray-200 px-4 py-5 sm:px-6 flex items-center justify-between">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                        Recent Activity
                    </h3>
                    <div className="flex gap-2">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">ALL</span>
                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">PROPERTY</span>
                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">JOB</span>
                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">WORKER</span>
                    </div>
                </div>
                <div className="px-4 py-5 sm:p-6">
                    <ul role="list" className="space-y-6">
                        {/* Placeholder Activity Items */}
                        <li className="relative flex gap-x-4">
                            <div className="absolute left-0 top-0 flex w-6 justify-center -bottom-6">
                                <div className="w-px bg-gray-200"></div>
                            </div>
                            <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                                <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="flex-auto py-0.5 text-xs leading-5 text-gray-500">
                                <span className="font-medium text-gray-900">John Smith</span> created a new job.
                                <span className="whitespace-nowrap ml-2">4d ago</span>
                            </div>
                        </li>
                        <li className="relative flex gap-x-4">
                            <div className="absolute left-0 top-0 flex w-6 justify-center -bottom-6">
                                <div className="w-px bg-gray-200"></div>
                            </div>
                            <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                                <Briefcase className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="flex-auto py-0.5 text-xs leading-5 text-gray-500">
                                <span className="font-medium text-gray-900">New Job</span> assigned to <span className="font-medium text-gray-900">Maria Garcia</span>.
                                <span className="whitespace-nowrap ml-2">2d ago</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

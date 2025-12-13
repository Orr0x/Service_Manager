'use client';

import { Calendar, Briefcase, Clock, CheckCircle, MapPin, ClipboardList, User, Info, FileText, AlertTriangle, Navigation } from "lucide-react";
import Link from 'next/link';
import { api } from "@/trpc/react";
import { Configurable } from "@/components/ui/configurable";
import { useWorkerAppStore } from "@/lib/store/worker-app";
import { WeatherWidget } from "@/components/weather-widget";
import classNames from "classnames";

export default function WorkerDashboard() {
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    // State
    const { dateFilter, setDateFilter } = useWorkerAppStore();

    // Fetch Data
    const { data: stats, isLoading: statsLoading } = api.worker.getDashboardStats.useQuery();
    const { data: filteredJobs, isLoading: jobsLoading } = api.worker.getAssignedJobs.useQuery({ filter: dateFilter, limit: 10 });
    const { data: nextJobData } = api.worker.getAssignedJobs.useQuery({ filter: 'upcoming', limit: 1 });
    const { data: profile } = api.worker.getProfile.useQuery();

    const firstName = profile?.first_name || 'Worker';
    const nextJob = nextJobData?.[0];

    return (
        <div className="p-4 space-y-6 max-w-lg mx-auto md:max-w-4xl">
            {/* Greeting Section */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Good Evening, {firstName}!</h2>
                <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                    <Calendar className="h-4 w-4" />
                    <span>{currentDate}</span>
                </div>
            </div>

            {/* Conflict Alert */}
            {/* @ts-ignore - stats type inferred */}
            {stats?.conflictCount && stats.conflictCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-bold text-red-900">Action Required: Scheduling Conflicts</h3>
                        <p className="text-sm text-red-700 mt-1">
                            You have {stats.conflictCount} job{stats.conflictCount > 1 ? 's' : ''} assigned on days you have marked as unavailable.
                            {/* @ts-ignore */}
                            {stats.firstConflict && (
                                <span className="block mt-1 font-medium">
                                    Conflict: {stats.firstConflict.jobTitle} on {new Date(stats.firstConflict.date).toLocaleDateString()}
                                </span>
                            )}
                        </p>
                        <p className="text-xs text-red-600 mt-2">Please contact an administrator to resolve this.</p>
                    </div>
                </div>
            )}

            {/* Stats Cards Row */}
            <Configurable configKey="worker.dashboard.stats">
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3 flex flex-col justify-between h-24 relative overflow-hidden">
                        <span className="text-xs font-medium text-blue-600 z-10">Jobs Today</span>
                        <span className="text-2xl font-bold text-gray-900 z-10">
                            {statsLoading ? '-' : stats?.jobsToday}
                        </span>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 rounded-full p-1.5 text-white shadow-sm">
                            <Briefcase className="h-4 w-4" />
                        </div>
                    </div>

                    <WeatherWidget />

                    <div className="bg-emerald-50 rounded-xl p-3 flex flex-col justify-between h-24 relative overflow-hidden">
                        <span className="text-xs font-medium text-emerald-600 z-10">Hours This Week</span>
                        <span className="text-2xl font-bold text-gray-900 z-10">
                            {statsLoading ? '-' : stats?.hoursThisWeek}
                        </span>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-500 rounded-full p-1.5 text-white shadow-sm">
                            <Clock className="h-4 w-4" />
                        </div>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-3 flex flex-col justify-between h-24 relative overflow-hidden">
                        <span className="text-xs font-medium text-purple-600 z-10">Completed</span>
                        <span className="text-2xl font-bold text-gray-900 z-10">
                            {statsLoading ? '-' : stats?.completedCount}
                        </span>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-500 rounded-full p-1.5 text-white shadow-sm">
                            <CheckCircle className="h-4 w-4" />
                        </div>
                    </div>
                </div>
            </Configurable>

            {/* Filtered Jobs */}
            <Configurable configKey="worker.dashboard.todayJobs">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-gray-900 capitalize">
                            {dateFilter === 'today' ? "Today's Jobs" :
                                dateFilter === 'week' ? "This Week's Jobs" :
                                    dateFilter === 'next-week' ? "Next Week's Jobs" :
                                        dateFilter === 'month' ? "This Month's Jobs" : "Next Month's Jobs"}
                        </h3>
                        {/* Filter Controls */}
                        <div className="flex bg-gray-100 p-0.5 rounded-lg overflow-x-auto">
                            {(['today', 'week', 'next-week', 'month', 'next-month'] as const).map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setDateFilter(filter)}
                                    className={classNames(
                                        "px-3 py-1 text-[10px] font-medium rounded-md transition-all whitespace-nowrap",
                                        dateFilter === filter
                                            ? "bg-white text-gray-900 shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    {filter === 'today' ? 'Today' :
                                        filter === 'week' ? 'This Week' :
                                            filter === 'next-week' ? 'Next Week' :
                                                filter === 'month' ? 'This Month' : 'Next Month'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {jobsLoading ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-center h-48 animate-pulse">
                            <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 w-24 bg-gray-200 rounded"></div>
                        </div>
                    ) : filteredJobs && filteredJobs.length > 0 ? (
                        <div className="space-y-3">
                            {filteredJobs.map(job => (
                                <Link key={job.id} href={`/worker/jobs/${job.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:border-indigo-200 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm">
                                                {Array.isArray(job.customers) ? (job.customers[0]?.business_name || job.customers[0]?.contact_name || 'Customer') : (job.customers?.business_name || job.customers?.contact_name || 'Customer')}
                                            </h4>
                                            <p className="text-xs text-gray-500">{job.title}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize 
                                            ${job.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {job.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Clock className="h-3 w-3" />
                                        <span>{job.start_time ? new Date(job.start_time).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBD'}</span>
                                        {/* Added Date to string because list might span multiple days now */}
                                        <span className="text-gray-300">|</span>
                                        <MapPin className="h-3 w-3" />
                                        <span>{Array.isArray(job.job_sites) ? (job.job_sites[0]?.city || 'Location') : (job.job_sites?.city || 'Location')}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-center h-48">
                            <div className="bg-gray-100 p-3 rounded-full mb-3 text-gray-400">
                                <Calendar className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-medium text-gray-900">No jobs scheduled {
                                dateFilter === 'today' ? 'today' :
                                    dateFilter === 'week' ? 'this week' :
                                        dateFilter === 'next-week' ? 'next week' :
                                            dateFilter === 'month' ? 'this month' : 'next month'
                            }</p>
                            <p className="text-xs text-gray-500 mt-1">Enjoy your time off!</p>
                        </div>
                    )}
                </div>
            </Configurable>

            {/* Status Widgets Row */}
            <Configurable configKey="worker.dashboard.widgets">
                <div className="grid grid-cols-2 gap-3">


                    {/* Next Job Widget */}
                    <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3">
                        <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500">
                            <Briefcase className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-900">Next Job</span>
                            {nextJob ? (
                                <Link href={`/worker/jobs/${nextJob.id}`} className="flex flex-col hover:bg-gray-50 rounded p-1 -m-1 transition-colors">
                                    <span className="text-[10px] text-indigo-600 font-medium truncate w-24">
                                        {nextJob.start_time ? new Date(nextJob.start_time).toLocaleDateString() : 'TBD'}
                                    </span>
                                    <span className="text-[9px] text-gray-400 truncate w-24">
                                        {nextJob.start_time ? new Date(nextJob.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}
                                    </span>
                                </Link>
                            ) : (
                                <span className="text-[10px] text-gray-400 font-medium">None upcoming</span>
                            )}
                        </div>
                    </div>
                </div>
            </Configurable>

            {/* Quick Links Grid */}
            <Configurable configKey="worker.dashboard.quickLinks">
                <div className="grid grid-cols-2 gap-3 pb-8">
                    <Link href="/worker/jobs" className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2 hover:bg-gray-50 transition-colors">
                        <div className="text-blue-600">
                            <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">My Jobs</h4>
                            <p className="text-[10px] text-gray-500">View cleaning jobs</p>
                        </div>
                    </Link>

                    <Link href="/worker/reports" className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2 hover:bg-gray-50 transition-colors">
                        <div className="text-orange-500">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">My Reports</h4>
                            <p className="text-[10px] text-gray-500">Maintenance Issues</p>
                        </div>
                    </Link>

                    <Link href="/worker/schedule" className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2 hover:bg-gray-50 transition-colors">
                        <div className="text-green-600">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">My Schedule</h4>
                            <p className="text-[10px] text-gray-500">View all jobs</p>
                        </div>
                    </Link>

                    <Link href="/worker/availability" className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2 hover:bg-gray-50 transition-colors">
                        <div className="text-purple-600">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">Availability</h4>
                            <p className="text-[10px] text-gray-500">Block dates</p>
                        </div>
                    </Link>

                    <Link href="/worker/checklists" className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2 hover:bg-gray-50 transition-colors">
                        <div className="text-teal-600">
                            <ClipboardList className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">My Checklists</h4>
                            <p className="text-[10px] text-gray-500">Reference guides</p>
                        </div>
                    </Link>

                    <Link href="/worker/locations" className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2 hover:bg-gray-50 transition-colors">
                        <div className="text-blue-500">
                            <Navigation className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">My Locations</h4>
                            <p className="text-[10px] text-gray-500">Navigate to jobs</p>
                        </div>
                    </Link>

                    <Link href="/worker/info" className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2 hover:bg-gray-50 transition-colors">
                        <div className="text-indigo-600">
                            <Info className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">Useful Info</h4>
                            <p className="text-[10px] text-gray-500">Safety & guidelines</p>
                        </div>
                    </Link>

                </div>
            </Configurable>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { WorkerCalendar } from '@/components/worker-calendar';
import { api } from '@/trpc/react';
import Link from 'next/link';
import { Calendar as CalendarIcon, List as ListIcon, Clock, MapPin, Search } from 'lucide-react';
import classNames from 'classnames';

export default function WorkerSchedulePage() {
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

    // For List View, we'll fetch "this month's" jobs to include recent past jobs
    const { data: upcomingJobs, isLoading } = api.worker.getAssignedJobs.useQuery(
        { filter: 'month', limit: 50 },
        { enabled: viewMode === 'list' }
    );

    // Fetch unavailability for checking conflicts in list view
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0); // Broad range

    const { data: unavailability } = api.worker.getUnavailability.useQuery(
        { start: startOfMonth, end: endOfNextMonth },
        { enabled: viewMode === 'list' }
    );

    // Helper to check conflict
    const hasConflict = (job: any) => {
        if (!unavailability || !job.start_time || !job.end_time) return false;

        const jobStart = new Date(job.start_time);
        const jobEnd = new Date(job.end_time);

        // Iterate days of job
        for (let d = new Date(jobStart); d <= jobEnd; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            if (unavailability.some(u => u.unavailable_date === dateStr)) {
                return true;
            }
        }
        return false;
    };


    return (
        <div className="p-4 space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>

                {/* View Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-lg self-start sm:self-auto">
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={classNames(
                            "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                            viewMode === 'calendar'
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <CalendarIcon className="h-4 w-4" />
                        Calendar
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={classNames(
                            "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                            viewMode === 'list'
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <ListIcon className="h-4 w-4" />
                        List
                    </button>
                </div>
            </div>

            {viewMode === 'calendar' ? (
                <WorkerCalendar />
            ) : (
                <div className="space-y-4">
                    {/* List View */}
                    {isLoading ? (
                        <div className="space-y-3 animate-pulse">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>
                            ))}
                        </div>
                    ) : upcomingJobs && upcomingJobs.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {upcomingJobs.map(job => {
                                const isConflicting = hasConflict(job);
                                return (
                                    <Link key={job.id} href={`/worker/jobs/${job.id}`} className={classNames(
                                        "block bg-white rounded-xl shadow-sm border p-4 transition-colors",
                                        isConflicting ? "border-red-300 ring-1 ring-red-200 bg-red-50 hover:border-red-400" : "border-gray-100 hover:border-indigo-200"
                                    )}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                                    {isConflicting && <span className="text-red-600 bg-red-100 px-1.5 py-0.5 rounded text-[10px] font-bold">CONFLICT</span>}
                                                    {Array.isArray(job.customers) ? (job.customers[0]?.business_name || job.customers[0]?.contact_name || 'Customer') : (job.customers?.business_name || job.customers?.contact_name || 'Customer')}
                                                </h4>
                                                <p className="text-xs text-gray-500 line-clamp-1">{job.title}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize 
                                                ${job.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                    job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {job.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="space-y-1 mt-3">
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <div className="min-w-[16px]"><Clock className="h-3.5 w-3.5 text-gray-400" /></div>
                                                <span>
                                                    {job.start_time ? new Date(job.start_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBD'}
                                                    {' • '}
                                                    {job.start_time ? new Date(job.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <div className="min-w-[16px]"><MapPin className="h-3.5 w-3.5 text-gray-400" /></div>
                                                <span className="truncate">{Array.isArray(job.job_sites) ? (job.job_sites[0]?.address || 'No Address') : (job.job_sites?.address || 'No Address')}</span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                            <p className="text-gray-500">No upcoming jobs found.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

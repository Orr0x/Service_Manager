'use client';

import { api } from '@/trpc/react';
import Link from 'next/link';
import { Clock, MapPin, Search } from 'lucide-react';
import { useState } from 'react';
import classNames from 'classnames';

export default function JobsPage() {
    const [filter, setFilter] = useState<'upcoming' | 'month' | 'completed'>('month');

    const { data: jobs, isLoading } = api.worker.getAssignedJobs.useQuery({
        filter: filter,
        limit: 50
    });

    return (
        <div className="p-4 space-y-4 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {(['month', 'upcoming', 'completed'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={classNames(
                                "capitalize px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                filter === f
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {f === 'month' ? 'This Month' : f}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>
                    ))}
                </div>
            ) : jobs && jobs.length > 0 ? (
                <div className="space-y-3">
                    {jobs.map(job => (
                        <Link key={job.id} href={`/worker/jobs/${job.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:border-indigo-200 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">
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
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                    <p className="text-gray-500">No jobs found for this period.</p>
                </div>
            )}
        </div>
    );
}

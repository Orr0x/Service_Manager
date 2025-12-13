'use client';

import { ArrowLeft, Clock, MapPin, Search } from "lucide-react";
import Link from 'next/link';
import { api } from "@/trpc/react";
import { format } from 'date-fns';
import { useState } from "react";

export default function CustomerJobsPage() {
    const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

    // In a real app we might have a specific endpoint for "active" vs "past" or filter on client
    // For now reusing getActiveJobs but ideally we'd have getJobs({ status: ... })
    // Let's assume for MVP "Active" is what we have. 
    // We might need to update the router to support filtering if we want "Past" jobs.
    // For now, let's just show Active jobs.

    const { data: jobs, isLoading } = api.customerPortal.getActiveJobs.useQuery({ limit: 50 });

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Page Header */}
            <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center gap-3 sticky top-0 z-10">
                <Link href="/customer" className="p-1 -ml-1 text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-lg font-bold text-gray-900">My Jobs</h1>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white px-4 border-b border-gray-200 flex items-center">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'active' ? 'text-emerald-600 border-emerald-600' : 'text-gray-500 border-transparent hover:text-gray-900'}`}
                >
                    Active
                </button>
                <button
                    onClick={() => setActiveTab('past')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'past' ? 'text-emerald-600 border-emerald-600' : 'text-gray-500 border-transparent hover:text-gray-900'}`}
                >
                    Past
                </button>
            </div>

            <div className="p-4 space-y-4">
                {isLoading && <div className="text-center py-10 text-gray-500">Loading jobs...</div>}

                {!isLoading && jobs?.length === 0 && (
                    <div className="text-center py-10 text-gray-500">No jobs found.</div>
                )}

                {jobs?.map((job) => (
                    <Link key={job.id} href={`/customer/jobs/${job.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-gray-900">{job.title}</h3>
                                <div className="text-sm text-gray-500 mt-1">
                                    {job.start_time ? format(new Date(job.start_time), 'EEE, MMM d, yyyy • h:mm a') : 'Date TBD'}
                                </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize
                                ${job.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                    job.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                                        'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
                                {job.status.replace('_', ' ')}
                            </span>
                        </div>
                        <div className="flex items-start gap-2 text-gray-500 text-sm">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{job.job_sites?.address || 'No location'}, {job.job_sites?.city}</span>
                        </div>
                    </Link>
                ))}

                {activeTab === 'past' && !isLoading && (
                    <div className="text-center py-10 text-gray-400 text-sm">
                        Past jobs history is coming soon.
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import { ArrowLeft, Clock, MapPin, Calendar, CheckCircle } from "lucide-react";
import Link from 'next/link';
import { api } from "@/trpc/react";
import { use } from "react";
import { format } from 'date-fns';

export default function CustomerJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    // We need to implement getJobDetails in customerPortal router
    const { data: job, isLoading, error } = api.customerPortal.getJobDetails.useQuery({ jobId: id });

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading details...</div>;
    if (error || !job) return <div className="p-8 text-center text-red-500">Job not found.</div>;

    const startTime = job.start_time ? new Date(job.start_time) : null;
    const endTime = job.end_time ? new Date(job.end_time) : null;

    return (
        <div className="bg-gray-50 min-h-screen pb-10">
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center gap-3 sticky top-0 z-10">
                <Link href="/customer/jobs" className="p-1 -ml-1 text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-lg font-bold text-gray-900">Job Details</h1>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Status Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div>
                        <div className="text-sm text-gray-500">Status</div>
                        <div className="font-bold text-gray-900 capitalize">{job.status.replace('_', ' ')}</div>
                    </div>
                    <span className={`h-10 w-10 rounded-full flex items-center justify-center
                        ${job.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                        <CheckCircle className="h-5 w-5" />
                    </span>
                </div>

                {/* Job Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-50">
                        <h2 className="font-bold text-gray-900">{job.title}</h2>
                        <p className="text-sm text-gray-500 mt-1">{job.description || 'No additional description.'}</p>
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <div className="text-sm font-medium text-gray-900">Date</div>
                                <div className="text-sm text-gray-600">
                                    {startTime ? format(startTime, 'EEEE, MMMM d, yyyy') : 'TBD'}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <div className="text-sm font-medium text-gray-900">Time</div>
                                <div className="text-sm text-gray-600">
                                    {startTime ? format(startTime, 'h:mm a') : '--:--'} - {endTime ? format(endTime, 'h:mm a') : '--:--'}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <div className="text-sm font-medium text-gray-900">Location</div>
                                <div className="text-sm text-gray-600">
                                    {job.job_sites?.address}, {job.job_sites?.city}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Checklist / Report placeholder */}
                {/* If we had checklists or reports visible content here */}
            </div>
        </div>
    );
}

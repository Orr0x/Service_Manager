'use client'

import { api } from '@/trpc/react'
import { useState } from 'react'
import { JobPreviewModal } from '@/components/job-preview-modal'
import { format } from 'date-fns'
import { Calendar, User, MapPin, Clock } from 'lucide-react'

export function ListView() {
    const { data: jobs, isLoading } = api.jobs.getAll.useQuery({})
    const { data: unavailability } = api.workers.getAllUnavailability.useQuery()
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const handleJobClick = (jobId: string) => {
        setSelectedJobId(jobId)
        setIsModalOpen(true)
    }

    if (isLoading) {
        return <div className="p-4 text-center text-gray-500">Loading jobs...</div>
    }

    if (!jobs || jobs.length === 0) {
        return <div className="p-4 text-center text-gray-500">No jobs found.</div>
    }

    // Build unavailability map for fast lookup
    const unavailabilityMap = new Map<string, Set<string>>();
    if (unavailability) {
        unavailability.forEach(u => {
            if (!unavailabilityMap.has(u.worker_id)) {
                unavailabilityMap.set(u.worker_id, new Set());
            }
            // @ts-ignore
            unavailabilityMap.get(u.worker_id)?.add(u.unavailable_date);
        });
    }

    // Sort by most recent created_at
    const sortedJobs = [...jobs].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return (
        <div className="space-y-4 p-4 h-full overflow-y-auto">
            {sortedJobs.map((job) => {
                const workerNames = job.job_assignments
                    ?.map((a: any) => a.workers?.first_name ? `${a.workers.first_name} ${a.workers.last_name || ''}` : a.contractors?.company_name)
                    .filter(Boolean)
                    .join(', ')

                // Check conflicts
                let hasConflict = false;
                if (job.start_time && job.end_time && job.job_assignments) {
                    const jobStart = new Date(job.start_time);
                    const jobEnd = new Date(job.end_time);
                    // Iterate days of the job
                    for (let d = new Date(jobStart); d <= jobEnd; d.setDate(d.getDate() + 1)) {
                        const dateStr = d.toISOString().split('T')[0];
                        // Check each assigned worker
                        for (const assignment of job.job_assignments as any[]) {
                            if (assignment.worker_id && unavailabilityMap.get(assignment.worker_id)?.has(dateStr)) {
                                hasConflict = true;
                                break;
                            }
                        }
                        if (hasConflict) break;
                    }
                }

                return (
                    <div
                        key={job.id}
                        onClick={() => handleJobClick(job.id)}
                        className={`bg-white border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${hasConflict ? 'border-red-500 bg-red-50' : ''}`}
                    >
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    {hasConflict && <span className="text-red-600 text-sm font-bold bg-red-100 px-2 py-0.5 rounded">CONFLICT</span>}
                                    {job.title}
                                </h3>
                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${job.status === 'completed' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                    job.status === 'in_progress' ? 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' :
                                        'bg-gray-50 text-gray-600 ring-gray-500/10'
                                    }`}>
                                    {job.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    <span>{job.customers?.business_name || job.customers?.contact_name || 'Unknown Customer'}</span>
                                </div>
                                {job.job_sites && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        <span>{job.job_sites.name}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                        {job.start_time ? format(new Date(job.start_time), 'MMM d, yyyy') : 'Unscheduled'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                        {job.start_time && job.end_time
                                            ? `${format(new Date(job.start_time), 'h:mm a')} - ${format(new Date(job.end_time), 'h:mm a')}`
                                            : 'No time set'}
                                    </span>
                                </div>
                            </div>

                            {workerNames && (
                                <div className="text-sm text-gray-600 mt-2">
                                    <span className="font-medium">Assigned:</span> {workerNames}
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}

            <JobPreviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                jobId={selectedJobId}
            />
        </div>
    )
}

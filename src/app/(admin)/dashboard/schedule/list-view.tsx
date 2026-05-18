'use client'

import { api } from '@/trpc/react'
import { useMemo, useState } from 'react'
import { JobPreviewModal } from '@/components/job-preview-modal'
import { format } from 'date-fns'
import { Calendar, User, MapPin, Clock } from 'lucide-react'
import { DataViewControls } from '@/components/common/data-view-controls'
import { compareValues, groupRows, includesSearch } from '@/lib/data-view'

export function ListView() {
    const { data: jobs, isLoading } = api.jobs.getAll.useQuery({})
    const { data: unavailability } = api.workers.getAllUnavailability.useQuery()
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [refineSearch, setRefineSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [sortBy, setSortBy] = useState('start_time')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const [groupBy, setGroupBy] = useState('date')

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

    const unavailabilityMap = useMemo(() => {
        const map = new Map<string, Set<string>>();
        if (!unavailability) return map

        unavailability.forEach(u => {
            if (!map.has(u.worker_id)) {
                map.set(u.worker_id, new Set());
            }
            // @ts-ignore
            map.get(u.worker_id)?.add(u.unavailable_date);
        });

        return map
    }, [unavailability])

    const visibleJobs = useMemo(() => {
        return [...jobs]
            .map((job) => {
                const workerNames = job.job_assignments
                    ?.map((a: any) => a.workers?.first_name ? `${a.workers.first_name} ${a.workers.last_name || ''}` : a.contractors?.company_name)
                    .filter(Boolean)
                    .join(', ')

                return {
                    ...job,
                    workerNames,
                    hasConflict: hasJobConflict(job, unavailabilityMap),
                }
            })
            .filter((job) => statusFilter === 'all' || job.status === statusFilter)
            .filter((job) => includesSearch([
                job.title,
                job.status,
                job.customers?.business_name,
                job.customers?.contact_name,
                job.job_sites?.name,
                job.workerNames,
            ], refineSearch))
            .sort((a, b) => compareValues(getScheduleSortValue(a, sortBy), getScheduleSortValue(b, sortBy), sortDirection))
    }, [jobs, refineSearch, sortBy, sortDirection, statusFilter, unavailabilityMap])

    const groupedJobs = useMemo(() => groupRows(visibleJobs, groupBy, getScheduleGroup), [visibleJobs, groupBy])

    return (
        <div className="space-y-4 p-4 h-full overflow-y-auto">
            <DataViewControls
                search={refineSearch}
                onSearchChange={setRefineSearch}
                searchPlaceholder="Search schedule by job, customer, site, or worker..."
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOptions={[
                    { value: 'start_time', label: 'Start time' },
                    { value: 'title', label: 'Job title' },
                    { value: 'customer', label: 'Customer' },
                    { value: 'site', label: 'Job site' },
                    { value: 'status', label: 'Status' },
                ]}
                sortDirection={sortDirection}
                onSortDirectionChange={setSortDirection}
                groupBy={groupBy}
                onGroupByChange={setGroupBy}
                groupOptions={[
                    { value: 'none', label: 'No grouping' },
                    { value: 'date', label: 'Date' },
                    { value: 'status', label: 'Status' },
                    { value: 'worker', label: 'Worker' },
                    { value: 'site', label: 'Job site' },
                ]}
                filters={[
                    {
                        id: 'status',
                        label: 'Status',
                        value: statusFilter,
                        onChange: setStatusFilter,
                        options: [
                            { value: 'all', label: 'All statuses' },
                            { value: 'draft', label: 'Draft' },
                            { value: 'pending', label: 'Pending' },
                            { value: 'scheduled', label: 'Scheduled' },
                            { value: 'in_progress', label: 'In progress' },
                            { value: 'completed', label: 'Completed' },
                        ],
                    },
                ]}
                onReset={() => {
                    setRefineSearch('')
                    setStatusFilter('all')
                    setSortBy('start_time')
                    setSortDirection('asc')
                    setGroupBy('date')
                }}
            />

            {visibleJobs.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                    No scheduled rows match the current filters.
                </div>
            )}

            {groupedJobs.map((group) => (
                <section key={group.key} className="space-y-3">
                    {groupBy !== 'none' && <GroupHeader label={group.label} count={group.rows.length} />}
                    {group.rows.map((job) => (
                    <div
                        key={job.id}
                        onClick={() => handleJobClick(job.id)}
                        className={`bg-white border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${job.hasConflict ? 'border-red-500 bg-red-50' : ''}`}
                    >
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    {job.hasConflict && <span className="text-red-600 text-sm font-bold bg-red-100 px-2 py-0.5 rounded">CONFLICT</span>}
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

                            {job.workerNames && (
                                <div className="text-sm text-gray-600 mt-2">
                                    <span className="font-medium">Assigned:</span> {job.workerNames}
                                </div>
                            )}
                        </div>
                    </div>
                    ))}
                </section>
            ))}

            <JobPreviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                jobId={selectedJobId}
            />
        </div>
    )
}

function hasJobConflict(job: any, unavailabilityMap: Map<string, Set<string>>) {
    if (!job.start_time || !job.end_time || !job.job_assignments) return false

    const jobStart = new Date(job.start_time)
    const jobEnd = new Date(job.end_time)

    for (let d = new Date(jobStart); d <= jobEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]
        for (const assignment of job.job_assignments as any[]) {
            if (assignment.worker_id && unavailabilityMap.get(assignment.worker_id)?.has(dateStr)) {
                return true
            }
        }
    }

    return false
}

function getScheduleSortValue(job: any, sortBy: string) {
    switch (sortBy) {
        case 'title':
            return job.title
        case 'customer':
            return job.customers?.business_name || job.customers?.contact_name
        case 'site':
            return job.job_sites?.name
        case 'status':
            return job.status
        case 'start_time':
        default:
            return job.start_time
    }
}

function getScheduleGroup(job: any, groupBy: string) {
    switch (groupBy) {
        case 'date': {
            const label = job.start_time ? format(new Date(job.start_time), 'dd MMM yyyy') : 'Unscheduled'
            return { key: label, label }
        }
        case 'status':
            return { key: job.status || 'unknown', label: formatLabel(job.status || 'Unknown') }
        case 'worker': {
            const label = job.workerNames || 'Unassigned'
            return { key: label, label }
        }
        case 'site': {
            const label = job.job_sites?.name || 'No site'
            return { key: label, label }
        }
        default:
            return { key: 'all', label: 'All schedule rows' }
    }
}

function GroupHeader({ label, count }: { label: string; count: number }) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm">
            <h4 className="font-semibold text-gray-900">{label}</h4>
            <span className="text-xs font-medium text-gray-500">{count} jobs</span>
        </div>
    )
}

function formatLabel(value: string) {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

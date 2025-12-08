'use client'

import { api } from '@/trpc/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Phone, Briefcase, DollarSign, User, Pencil, Trash2, FileText, Calendar, MapPin, Truck, Award, Clock } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'
import { WorkerAvailability } from './worker-availability'
import { EntityCalendar } from '@/components/entity-calendar'
import { AttachmentsSection } from '@/components/attachments-section'
import CertificationManager from '@/components/certification/CertificationManager'
import { ActivityFeed } from '@/components/common/activity-feed'
import { Activity } from 'lucide-react'

export function WorkerDetail({ id }: { id: string }) {
    const router = useRouter()
    const { data: worker, isLoading: isLoadingWorker } = api.workers.getById.useQuery({ id })
    const { data: jobs } = api.jobs.getByWorkerId.useQuery({ workerId: id })
    const [activeTab, setActiveTab] = useState('info')

    const deleteWorker = api.workers.delete.useMutation({
        onSuccess: () => {
            router.push('/dashboard/workers')
            router.refresh()
        },
    })

    if (isLoadingWorker) {
        return <div className="p-8 text-center text-gray-500">Loading worker details...</div>
    }

    if (!worker) {
        return <div className="p-8 text-center text-gray-500">Worker not found</div>
    }

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this worker?')) {
            deleteWorker.mutate({ id })
        }
    }

    const skills = (Array.isArray(worker.skills) ? worker.skills : typeof worker.skills === 'string' ? JSON.parse(worker.skills) : []) as string[]

    const tabs = [
        { id: 'overview', name: 'Overview', icon: FileText },
        { id: 'schedule', name: 'Schedule', icon: Calendar },
        { id: 'availability', name: 'Availability', icon: Clock },
        { id: 'jobs', name: `Assigned Jobs (${jobs?.length || 0})`, icon: Briefcase },
        { id: 'certification', name: 'Certification', icon: Award },
        { id: 'activity', name: 'Activity', icon: Activity },
    ]

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <div>
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back
                </button>
            </div>

            {/* Header */}
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                <div className="md:flex md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                            {worker.first_name} {worker.last_name}
                        </h2>
                        <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${worker.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                    worker.status === 'on_leave' ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' :
                                        'bg-gray-50 text-gray-600 ring-gray-500/10'
                                    }`}>
                                    {worker.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                </span>
                                <span className="mx-2 text-gray-300">•</span>
                                <span>{worker.role}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex md:ml-4 md:mt-0 gap-x-3">
                        <button
                            onClick={handleDelete}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50"
                        >
                            <Trash2 className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Delete
                        </button>
                        <Link
                            href={`/dashboard/workers/${id}/edit`}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            <Pencil className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Edit
                        </Link>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-8 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                  ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
                  group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium
                `}
                            >
                                <tab.icon
                                    className={`
                    ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                    -ml-0.5 mr-2 h-5 w-5
                  `}
                                    aria-hidden="true"
                                />
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Main Info Card */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                                <div className="border-b border-gray-900/5 bg-gray-50 px-4 py-3 sm:px-6">
                                    <h3 className="text-base font-semibold leading-7 text-gray-900">Profile Information</h3>
                                </div>
                                <div className="px-4 py-5 sm:p-6">
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                                            <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                {worker.email ? (
                                                    <a href={`mailto:${worker.email}`} className="hover:underline text-blue-600">
                                                        {worker.email}
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">N/A</span>
                                                )}
                                            </dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Phone</dt>
                                            <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                                <Phone className="h-4 w-4 text-gray-400" />
                                                {worker.phone ? (
                                                    <a href={`tel:${worker.phone}`} className="hover:underline text-blue-600">
                                                        {worker.phone}
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">N/A</span>
                                                )}
                                            </dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Role</dt>
                                            <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                                <Briefcase className="h-4 w-4 text-gray-400" />
                                                {worker.role}
                                            </dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Hourly Rate</dt>
                                            <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                                <DollarSign className="h-4 w-4 text-gray-400" />
                                                {worker.hourly_rate ? `£${worker.hourly_rate.toFixed(2)}/hr` : 'N/A'}
                                            </dd>
                                        </div>

                                        {/* New Fields */}
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Area Covered</dt>
                                            <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                                <MapPin className="h-4 w-4 text-gray-400" />
                                                {worker.area_postcode ? (
                                                    <span>{worker.area_postcode} {worker.area_radius ? `(+${worker.area_radius} miles)` : ''}</span>
                                                ) : (
                                                    <span className="text-gray-400">N/A</span>
                                                )}
                                            </dd>
                                        </div>

                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Transport</dt>
                                            <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                                <Truck className="h-4 w-4 text-gray-400" />
                                                {worker.has_own_transport ? 'Has own transport' : 'No own transport'}
                                            </dd>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <dt className="text-sm font-medium text-gray-500">Licenses & Certifications</dt>
                                            <dd className="mt-1 text-sm text-gray-900 flex items-start gap-x-2 whitespace-pre-line">
                                                <Award className="h-4 w-4 text-gray-400 mt-1" />
                                                {worker.licenses || <span className="text-gray-400">None listed</span>}
                                            </dd>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <dt className="text-sm font-medium text-gray-500">Skills</dt>
                                            <dd className="mt-2 flex flex-wrap gap-2">
                                                {skills && skills.length > 0 ? (
                                                    skills.map((skill, index) => (
                                                        <span key={index} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                            {skill}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-500 text-sm">No skills listed.</span>
                                                )}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            {/* Documents Section */}
                            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                                <div className="border-b border-gray-900/5 bg-gray-50 px-4 py-3 sm:px-6">
                                    <h3 className="text-base font-semibold leading-7 text-gray-900">Documents & Photos</h3>
                                </div>
                                <div className="px-4 py-5 sm:p-6 space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium leading-6 text-gray-900 mb-2">Profile Picture</h4>
                                        <AttachmentsSection entityType="worker_profile" entityId={worker.id} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium leading-6 text-gray-900 mb-2">Certifications & Files</h4>
                                        <AttachmentsSection entityType="worker_document" entityId={worker.id} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                                <div className="border-b border-gray-900/5 bg-gray-50 px-4 py-3 sm:px-6">
                                    <h3 className="text-base font-semibold leading-7 text-gray-900">Activity</h3>
                                </div>
                                <div className="px-4 py-5 sm:p-6 text-center text-sm text-gray-500">
                                    Worker added on {new Date(worker.created_at).toLocaleDateString('en-GB')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'schedule' && (
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                        <EntityCalendar entityType="worker" entityId={worker.id} />
                    </div>
                )}

                {activeTab === 'availability' && (
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                        <WorkerAvailability workerId={worker.id} />
                    </div>
                )}

                {activeTab === 'jobs' && (
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                        <ul role="list" className="divide-y divide-gray-100">
                            {jobs?.map((job) => (
                                <li key={job.id} className="flex items-center justify-between gap-x-6 py-5 px-6 hover:bg-gray-50">
                                    <div className="min-w-0">
                                        <div className="flex items-start gap-x-3">
                                            <p className="text-sm font-semibold leading-6 text-gray-900">{job.title}</p>
                                            <p className={`rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${job.status === 'completed' ? 'text-green-700 bg-green-50 ring-green-600/20' :
                                                job.status === 'in_progress' ? 'text-blue-700 bg-blue-50 ring-blue-600/20' :
                                                    'text-yellow-800 bg-yellow-50 ring-yellow-600/20'
                                                }`}>
                                                {job.status.replace('_', ' ').toUpperCase()}
                                            </p>
                                        </div>
                                        <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                            <p className="truncate">
                                                {job.start_time ? format(new Date(job.start_time), 'MMM d, yyyy') : 'Unscheduled'}
                                            </p>
                                            <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                                                <circle cx={1} cy={1} r={1} />
                                            </svg>
                                            <p className="truncate">{job.customers?.business_name || job.customers?.contact_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-none items-center gap-x-4">
                                        <Link
                                            href={`/dashboard/jobs/${job.id}`}
                                            className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block"
                                        >
                                            View job
                                        </Link>
                                    </div>
                                </li>
                            ))}
                            {(!jobs || jobs.length === 0) && (
                                <li className="py-12 text-center text-gray-500">No jobs assigned to this worker.</li>
                            )}
                        </ul>
                    </div>
                )}

                {activeTab === 'certification' && (
                    <div className="space-y-6">
                        <CertificationManager entityType="worker" entityId={worker.id} />
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                        <h3 className="text-base font-semibold leading-6 text-gray-900 mb-6">Recent Activity</h3>
                        <ActivityFeed entityType="worker" entityId={worker.id} limit={20} />
                    </div>
                )}
            </div>
        </div>
    )
}

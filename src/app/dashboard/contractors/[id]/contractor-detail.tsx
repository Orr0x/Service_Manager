'use client'

import { api } from '@/trpc/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Briefcase, MapPin, Calendar, Mail, Phone, User, Pencil, Trash2, FileText, Clock } from 'lucide-react'
import { EntityCalendar } from '@/components/entity-calendar'
import { ContractorAvailability } from './contractor-availability'
import { useState } from 'react'
import { format } from 'date-fns'



export function ContractorDetail({ id }: { id: string }) {
    const router = useRouter()
    const { data: contractor, isLoading: isLoadingContractor } = api.contractors.getById.useQuery({ id })
    const { data: jobs } = api.jobs.getByContractorId.useQuery({ contractorId: id })
    const [activeTab, setActiveTab] = useState('overview')

    const deleteContractor = api.contractors.delete.useMutation({
        onSuccess: () => {
            router.push('/dashboard/contractors')
            router.refresh()
        },
    })

    if (isLoadingContractor) {
        return <div className="p-8 text-center text-gray-500">Loading contractor details...</div>
    }

    if (!contractor) {
        return <div className="p-8 text-center text-gray-500">Contractor not found</div>
    }

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this contractor?')) {
            deleteContractor.mutate({ id })
        }
    }

    // Handle specialties parsing safely
    const specialties = (typeof contractor.specialties === 'string'
        ? JSON.parse(contractor.specialties)
        : Array.isArray(contractor.specialties)
            ? contractor.specialties
            : []) as string[]

    const tabs = [
        { id: 'overview', name: 'Overview', icon: FileText },
        { id: 'schedule', name: 'Schedule', icon: Calendar },
        { id: 'availability', name: 'Availability', icon: Clock },
        { id: 'jobs', name: `Assigned Jobs (${jobs?.length || 0})`, icon: Briefcase },
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
                    <div className="min-w-0 flex-1 flex items-center gap-4">
                        {/* Profile Picture or Placeholder */}
                        {contractor.profile_picture_url ? (
                            <div className="h-16 w-16 flex-shrink-0">
                                <img
                                    className="h-16 w-16 rounded-full object-cover"
                                    src={contractor.profile_picture_url}
                                    alt=""
                                />
                            </div>
                        ) : (
                            <div className="h-16 w-16 flex-shrink-0 rounded-full bg-blue-600 flex items-center justify-center">
                                <span className="text-xl font-bold text-white">
                                    {contractor.company_name.charAt(0)}
                                </span>
                            </div>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                                {contractor.company_name}
                            </h2>
                            <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                                <div className="mt-2 flex items-center text-sm text-gray-500">
                                    <User className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                                    {contractor.contact_name}
                                </div>
                                <div className="mt-2 flex items-center text-sm text-gray-500">
                                    <MapPin className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                                    {contractor.area_postcode ? `${contractor.area_postcode} (+${contractor.area_radius}mi)` : 'No Area Set'}
                                </div>
                                <div className="mt-2 flex items-center text-sm text-gray-500">
                                    <span
                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${contractor.status === 'active'
                                            ? 'bg-green-50 text-green-700 ring-green-600/20'
                                            : 'bg-red-50 text-red-700 ring-red-600/20'
                                            }`}
                                    >
                                        {contractor.status.charAt(0).toUpperCase() + contractor.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-shrink-0 md:ml-4 md:mt-0 gap-x-3">
                        <Link
                            href={`/dashboard/contractors/${id}/edit`}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            <Pencil className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Edit
                        </Link>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                        >
                            <Trash2 className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Delete
                        </button>
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
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Contact Info */}
                        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
                            <div className="px-4 py-5 sm:px-6">
                                <h3 className="text-base font-semibold leading-6 text-gray-900">Contact Information</h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                                <dl className="sm:divide-y sm:divide-gray-200">
                                    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                        <dt className="text-sm font-medium text-gray-500">Email address</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                                            {contractor.email || 'N/A'}
                                        </dd>
                                    </div>
                                    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                        <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                                            {contractor.phone || 'N/A'}
                                        </dd>
                                    </div>
                                    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                        <dt className="text-sm font-medium text-gray-500">Has Transport</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                                            {contractor.has_own_transport ? 'Yes' : 'No'}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {/* Professional Info */}
                        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
                            <div className="px-4 py-5 sm:px-6">
                                <h3 className="text-base font-semibold leading-6 text-gray-900">Professional Details</h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                                <dl className="sm:divide-y sm:divide-gray-200">
                                    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                        <dt className="text-sm font-medium text-gray-500">Specialties</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                                            <div className="flex flex-wrap gap-2">
                                                {specialties.length > 0 ? (
                                                    specialties.map((skill: string) => (
                                                        <span
                                                            key={skill}
                                                            className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-500">No specialties listed</span>
                                                )}
                                            </div>
                                        </dd>
                                    </div>
                                    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                        <dt className="text-sm font-medium text-gray-500">Licenses</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 whitespace-pre-line">
                                            {contractor.licenses || 'None listed'}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {/* Activity */}
                        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5 col-span-1 lg:col-span-2">
                            <div className="border-b border-gray-900/5 bg-gray-50 px-4 py-3 sm:px-6">
                                <h3 className="text-base font-semibold leading-7 text-gray-900">Activity</h3>
                            </div>
                            <div className="px-4 py-5 sm:p-6 text-center text-sm text-gray-500">
                                Contractor added on {new Date(contractor.created_at).toLocaleDateString('en-GB')}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'schedule' && (
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                        <EntityCalendar entityType="contractor" entityId={id} />
                    </div>
                )}

                {activeTab === 'availability' && (
                    <ContractorAvailability contractorId={id} />
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
                                <li className="py-12 text-center text-gray-500">No jobs assigned to this contractor.</li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}

function ArrowLeft(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
        </svg>
    )
}

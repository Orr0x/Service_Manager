'use client'

import { api } from '@/trpc/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Phone, Building2, User, Pencil, Trash2, FileText, Briefcase } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'

export function ContractorDetail({ id }: { id: string }) {
    const router = useRouter()
    const { data: contractor, isLoading: isLoadingContractor } = api.contractors.getById.useQuery({ id })
    const { data: jobs } = api.jobs.getByContractorId.useQuery({ contractorId: id })
    const [activeTab, setActiveTab] = useState('info')

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

    const specialties = (typeof contractor.specialties === 'string' ? JSON.parse(contractor.specialties) : contractor.specialties) as string[]

    const tabs = [
        { id: 'info', name: 'Contractor Info', icon: FileText },
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
                    <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                            {contractor.company_name}
                        </h2>
                        <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${contractor.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                    contractor.status === 'blacklisted' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                        'bg-gray-50 text-gray-600 ring-gray-500/10'
                                    }`}>
                                    {contractor.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                </span>
                                <span className="mx-2 text-gray-300">•</span>
                                <span>{contractor.contact_name}</span>
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
                        <button
                            type="button"
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            <Pencil className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Edit
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
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Main Info Card */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                                <div className="border-b border-gray-900/5 bg-gray-50 px-4 py-3 sm:px-6">
                                    <h3 className="text-base font-semibold leading-7 text-gray-900">Company Information</h3>
                                </div>
                                <div className="px-4 py-5 sm:p-6">
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
                                            <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                                <User className="h-4 w-4 text-gray-400" />
                                                {contractor.contact_name}
                                            </dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                                            <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                {contractor.email ? (
                                                    <a href={`mailto:${contractor.email}`} className="hover:underline text-blue-600">
                                                        {contractor.email}
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
                                                {contractor.phone ? (
                                                    <a href={`tel:${contractor.phone}`} className="hover:underline text-blue-600">
                                                        {contractor.phone}
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">N/A</span>
                                                )}
                                            </dd>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <dt className="text-sm font-medium text-gray-500">Specialties</dt>
                                            <dd className="mt-2 flex flex-wrap gap-2">
                                                {specialties && specialties.length > 0 ? (
                                                    specialties.map((specialty, index) => (
                                                        <span key={index} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                            {specialty}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-500 text-sm">No specialties listed.</span>
                                                )}
                                            </dd>
                                        </div>
                                    </dl>
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
                                    Contractor added on {new Date(contractor.created_at).toLocaleDateString('en-GB')}
                                </div>
                            </div>
                        </div>
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
                                <li className="py-12 text-center text-gray-500">No jobs assigned to this contractor.</li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}

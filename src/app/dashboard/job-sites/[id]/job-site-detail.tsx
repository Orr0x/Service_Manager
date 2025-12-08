'use client'

import { api } from '@/trpc/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
    ArrowLeft,
    MapPin,
    User,
    Building2,
    Edit,
    Trash2,
    Briefcase,
    FileText,
    Receipt,
    File,
    ClipboardList,
    Camera,
    Award,
    Calendar,
    Activity
} from 'lucide-react'

import Link from 'next/link'
import { AttachmentsSection } from '@/components/attachments-section'
import CertificationManager from '@/components/certification/CertificationManager'
import { ActivityFeed } from '@/components/common/activity-feed'

export function JobSiteDetail({ id }: { id: string }) {
    const router = useRouter()
    const { data: jobSite, isLoading: isLoadingSite } = api.jobSites.getById.useQuery({ id })
    const { data: jobs } = api.jobs.getByJobSiteId.useQuery({ jobSiteId: id })
    const { data: contracts } = api.contracts.getByJobSiteId.useQuery({ jobSiteId: id })
    const { data: invoices } = api.invoices.getByJobSiteId.useQuery({ jobSiteId: id })
    const { data: quotes } = api.quotes.getByJobSiteId.useQuery({ jobSiteId: id })
    const { data: workers } = api.workers.getByJobSiteId.useQuery({ jobSiteId: id })
    const { data: contractors } = api.contractors.getByJobSiteId.useQuery({ jobSiteId: id })
    const { data: checklists } = api.checklists.getByJobSiteId.useQuery({ jobSiteId: id })

    const [activeTab, setActiveTab] = useState('info')

    const deleteJobSite = api.jobSites.delete.useMutation({
        onSuccess: () => {
            router.push('/dashboard/job-sites')
            router.refresh()
        },
    })

    if (isLoadingSite) {
        return <div className="p-8 text-center text-gray-500">Loading job site details...</div>
    }

    if (!jobSite) {
        return <div className="p-8 text-center text-gray-500">Job site not found</div>
    }

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this job site?')) {
            deleteJobSite.mutate({ id })
        }
    }

    const assignedStaff = [
        ...(workers?.map(w => ({ ...w, type: 'worker' as const, name: `${w.first_name} ${w.last_name}`, details: w.role })) || []),
        ...(contractors?.map(c => ({ ...c, type: 'contractor' as const, name: c.company_name, details: c.contact_name })) || [])
    ]

    const tabs = [
        { id: 'info', name: 'Site Info', icon: Building2 },
        { id: 'scheduling', name: `Scheduling (${(jobs?.length || 0) + assignedStaff.length})`, icon: Calendar },
        { id: 'financials', name: `Financials (${(contracts?.length || 0) + (invoices?.length || 0) + (quotes?.length || 0)})`, icon: Receipt },
        { id: 'checklists', name: `Checklists (${checklists?.length || 0})`, icon: ClipboardList },
        { id: 'attachments', name: 'Photos & Attachments', icon: Camera },
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
                            {jobSite.name}
                        </h2>
                        <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                <MapPin className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                                {jobSite.address}, {jobSite.city}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${jobSite.is_active ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'}`}>
                                    {jobSite.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex md:ml-4 md:mt-0 gap-x-3">
                        <Link
                            href={`/dashboard/job-sites/${id}/edit`}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            <Edit className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                            Edit
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50"
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
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Site Information */}
                        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                                <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center">
                                    <Building2 className="mr-2 h-5 w-5 text-blue-500" />
                                    Site Details
                                </h3>
                            </div>
                            <div className="px-4 py-5 sm:p-6">
                                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Site Name</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{jobSite.name}</dd>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <dt className="text-sm font-medium text-gray-500">Access Instructions</dt>
                                        <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{jobSite.access_instructions || '-'}</dd>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <dt className="text-sm font-medium text-gray-500">Parking Information</dt>
                                        <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{jobSite.parking_info || '-'}</dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{jobSite.is_active ? 'Active' : 'Inactive'}</dd>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <dt className="text-sm font-medium text-gray-500">Full Address</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {jobSite.address}<br />
                                            {jobSite.city}, {jobSite.state} {jobSite.postal_code}<br />
                                            {jobSite.country}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                                <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center">
                                    <User className="mr-2 h-5 w-5 text-gray-500" />
                                    Customer Information
                                </h3>
                            </div>
                            <div className="px-4 py-5 sm:p-6">
                                {jobSite.customer ? (
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Customer Name</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                <Link href={`/dashboard/customers/${jobSite.customer.id}`} className="text-blue-600 hover:underline">
                                                    {jobSite.customer.business_name || jobSite.customer.contact_name}
                                                </Link>
                                            </dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{jobSite.customer.contact_name}</dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{jobSite.customer.email || '-'}</dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Phone</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{jobSite.customer.phone || '-'}</dd>
                                        </div>
                                    </dl>
                                ) : (
                                    <p className="text-sm text-gray-500">No customer linked.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'scheduling' && (
                    <div className="space-y-6">
                        {/* Scheduled Jobs */}
                        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                                <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center">
                                    <Briefcase className="mr-2 h-5 w-5 text-blue-500" />
                                    Scheduled Jobs
                                </h3>
                            </div>
                            <ul role="list" className="divide-y divide-gray-100">
                                {jobs?.map((job) => (
                                    <li key={job.id} className="flex items-center justify-between gap-x-6 py-5 px-6 hover:bg-gray-50">
                                        <div className="min-w-0">
                                            <div className="flex items-start gap-x-3">
                                                <p className="text-sm font-semibold leading-6 text-gray-900">{job.title}</p>
                                                <p className={`rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${job.status === 'completed' ? 'text-green-700 bg-green-50 ring-green-600/20' : 'text-yellow-800 bg-yellow-50 ring-yellow-600/20'}`}>
                                                    {job.status}
                                                </p>
                                            </div>
                                            <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                                <p className="truncate">
                                                    {job.start_time ? new Date(job.start_time).toLocaleDateString('en-GB') : 'Unscheduled'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-none items-center gap-x-4">
                                            <a href={`/dashboard/jobs/${job.id}`} className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block">
                                                View
                                            </a>
                                        </div>
                                    </li>
                                ))}
                                {(!jobs || jobs.length === 0) && (
                                    <li className="py-6 text-center text-gray-500 text-sm">No scheduled jobs found for this site.</li>
                                )}
                            </ul>
                        </div>

                        {/* Assigned Workers */}
                        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                                <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center">
                                    <User className="mr-2 h-5 w-5 text-blue-500" />
                                    Assigned Workers
                                </h3>
                            </div>
                            <ul role="list" className="divide-y divide-gray-100">
                                {assignedStaff.map((staff) => (
                                    <li key={staff.id} className="flex items-center justify-between gap-x-6 py-5 px-6 hover:bg-gray-50">
                                        <div className="min-w-0">
                                            <div className="flex items-start gap-x-3">
                                                <p className="text-sm font-semibold leading-6 text-gray-900">{staff.name}</p>
                                                <p className={`rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${staff.status === 'active' ? 'text-green-700 bg-green-50 ring-green-600/20' : 'text-gray-600 bg-gray-50 ring-gray-500/10'}`}>
                                                    {staff.status}
                                                </p>
                                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                    {staff.type === 'worker' ? 'Internal' : 'Contractor'}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                                <p className="truncate">{staff.details}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-none items-center gap-x-4">
                                            <a href={`/dashboard/${staff.type === 'worker' ? 'workers' : 'contractors'}/${staff.id}`} className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block">
                                                View
                                            </a>
                                        </div>
                                    </li>
                                ))}
                                {assignedStaff.length === 0 && (
                                    <li className="py-6 text-center text-gray-500 text-sm">No workers or contractors assigned.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                )}

                {activeTab === 'financials' && (
                    <div className="space-y-6">
                        {/* Contracts */}
                        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                                <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center">
                                    <FileText className="mr-2 h-5 w-5 text-blue-500" />
                                    Contracts
                                </h3>
                            </div>
                            <ul role="list" className="divide-y divide-gray-100">
                                {contracts?.map((contract) => (
                                    <li key={contract.id} className="flex items-center justify-between gap-x-6 py-5 px-6 hover:bg-gray-50">
                                        <div className="min-w-0">
                                            <div className="flex items-start gap-x-3">
                                                <p className="text-sm font-semibold leading-6 text-gray-900">{contract.name}</p>
                                                <p className={`rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${contract.status === 'active' ? 'text-green-700 bg-green-50 ring-green-600/20' : 'text-gray-600 bg-gray-50 ring-gray-500/10'}`}>
                                                    {contract.status}
                                                </p>
                                            </div>
                                            <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                                <p className="truncate">{contract.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-none items-center gap-x-4">
                                            <a href={`/dashboard/contracts/${contract.id}`} className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block">
                                                View
                                            </a>
                                        </div>
                                    </li>
                                ))}
                                {(!contracts || contracts.length === 0) && (
                                    <li className="py-6 text-center text-gray-500 text-sm">No contracts found.</li>
                                )}
                            </ul>
                        </div>

                        {/* Invoices */}
                        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                                <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center">
                                    <Receipt className="mr-2 h-5 w-5 text-blue-500" />
                                    Invoices
                                </h3>
                            </div>
                            <ul role="list" className="divide-y divide-gray-100">
                                {invoices?.map((invoice) => (
                                    <li key={invoice.id} className="flex items-center justify-between gap-x-6 py-5 px-6 hover:bg-gray-50">
                                        <div className="min-w-0">
                                            <div className="flex items-start gap-x-3">
                                                <p className="text-sm font-semibold leading-6 text-gray-900">#{invoice.invoice_number}</p>
                                                <p className={`rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${invoice.status === 'paid' ? 'text-green-700 bg-green-50 ring-green-600/20' : 'text-yellow-800 bg-yellow-50 ring-yellow-600/20'}`}>
                                                    {invoice.status}
                                                </p>
                                            </div>
                                            <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                                <p className="truncate">£{invoice.total_amount.toFixed(2)} - Due {new Date(invoice.due_date).toLocaleDateString('en-GB')}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-none items-center gap-x-4">
                                            <a href={`/dashboard/invoices/${invoice.id}`} className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block">
                                                View
                                            </a>
                                        </div>
                                    </li>
                                ))}
                                {(!invoices || invoices.length === 0) && (
                                    <li className="py-6 text-center text-gray-500 text-sm">No invoices found.</li>
                                )}
                            </ul>
                        </div>

                        {/* Quotes */}
                        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                                <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center">
                                    <File className="mr-2 h-5 w-5 text-blue-500" />
                                    Quotes
                                </h3>
                            </div>
                            <ul role="list" className="divide-y divide-gray-100">
                                {quotes?.map((quote) => (
                                    <li key={quote.id} className="flex items-center justify-between gap-x-6 py-5 px-6 hover:bg-gray-50">
                                        <div className="min-w-0">
                                            <div className="flex items-start gap-x-3">
                                                <p className="text-sm font-semibold leading-6 text-gray-900">{quote.title}</p>
                                                <p className={`rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${quote.status === 'accepted' ? 'text-green-700 bg-green-50 ring-green-600/20' : 'text-gray-600 bg-gray-50 ring-gray-500/10'}`}>
                                                    {quote.status}
                                                </p>
                                            </div>
                                            <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                                <p className="truncate">£{quote.total_amount?.toFixed(2) || '0.00'}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-none items-center gap-x-4">
                                            <a href={`/dashboard/quotes/${quote.id}`} className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block">
                                                View
                                            </a>
                                        </div>
                                    </li>
                                ))}
                                {(!quotes || quotes.length === 0) && (
                                    <li className="py-6 text-center text-gray-500 text-sm">No quotes found.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                )}

                {activeTab === 'checklists' && (
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                        <ul role="list" className="divide-y divide-gray-100">
                            {checklists?.map((checklist) => (
                                <li key={checklist.id} className="flex items-center justify-between gap-x-6 py-5 px-6 hover:bg-gray-50">
                                    <div className="min-w-0">
                                        <div className="flex items-start gap-x-3">
                                            <p className="text-sm font-semibold leading-6 text-gray-900">{checklist.checklist?.name || 'Untitled Checklist'}</p>
                                            <p className="text-xs text-gray-500 mt-1">Job: {checklist.job?.title}</p>
                                        </div>
                                        <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                            <p className="truncate">
                                                {checklist.checklist?.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-none items-center gap-x-4">
                                        <a href={`/dashboard/jobs/${checklist.job_id}`} className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block">
                                            View Job
                                        </a>
                                    </div>
                                </li>
                            ))}
                            {(!checklists || checklists.length === 0) && (
                                <li className="py-12 text-center text-gray-500">No checklists found for jobs at this site.</li>
                            )}
                        </ul>
                    </div>
                )}

                {activeTab === 'attachments' && (
                    <AttachmentsSection entityType="job_site" entityId={id} />
                )}

                {activeTab === 'certification' && (
                    <div className="space-y-6">
                        <CertificationManager entityType="job_site" entityId={id} />
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                        <h3 className="text-base font-semibold leading-6 text-gray-900 mb-6">Recent Activity</h3>
                        <ActivityFeed entityType="job_site" entityId={id} limit={20} />
                    </div>
                )}
            </div>
        </div>
    )
}

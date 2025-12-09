'use client'

import { api } from '@/trpc/react'
import { format } from 'date-fns'
import {
    Calendar,
    MapPin,
    User,
    CheckSquare,
    ArrowLeft,
    Edit,
    FileText,
    Paperclip,
    StickyNote,
    Receipt,
    Briefcase,
    Building2,
    File,
    Clock,
    Award,
    Activity,
    Download
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { NotesSection } from '@/components/notes-section'
import { AttachmentsSection } from '@/components/attachments-section'
import CertificationManager from '@/components/certification/CertificationManager'
import { ActivityFeed } from '@/components/common/activity-feed'
import { useState } from 'react'

export function JobDetail({ id }: { id: string }) {
    const router = useRouter()
    const utils = api.useUtils()
    const { data: job, isLoading: isLoadingJob } = api.jobs.getById.useQuery(id)

    const [activeTab, setActiveTab] = useState('overview')
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    const updateChecklist = api.jobs.updateChecklistProgress.useMutation({
        onSuccess: () => {
            utils.jobs.getById.invalidate(id)
        }
    })

    const toggleChecklistItem = (checklistId: string, items: any[], itemIndex: number) => {
        const newItems = [...items]
        newItems[itemIndex].isCompleted = !newItems[itemIndex].isCompleted
        updateChecklist.mutate({
            jobChecklistId: checklistId,
            items: newItems
        })
    }

    const createInvoice = api.invoices.create.useMutation({
        onSuccess: (invoice) => {
            router.push(`/dashboard/invoices/${invoice.id}`)
        }
    })

    const handleCreateInvoice = () => {
        if (!job) return

        createInvoice.mutate({
            customerId: job.customer_id,
            jobSiteId: job.job_site_id || undefined,
            jobId: job.id,
            status: 'draft',
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days due
            totalAmount: 0,
            items: [
                {
                    description: `Service for Job: ${job.title}`,
                    quantity: 1,
                    unitPrice: 0,
                    total: 0
                }
            ]
        })
    }

    if (isLoadingJob) return <div className="p-8 text-center text-gray-500">Loading job details...</div>
    if (!job) return <div className="p-8 text-center text-gray-500">Job not found</div>

    const assignedStaff = [
        ...(job.job_assignments?.filter((a: any) => a.workers).map((a: any) => ({ ...a.workers, type: 'worker' as const, status: a.status })) || []),
        ...(job.job_assignments?.filter((a: any) => a.contractors).map((a: any) => ({ ...a.contractors, type: 'contractor' as const, status: a.status })) || [])
    ]

    const tabs = [
        { id: 'overview', name: 'Overview', icon: Briefcase },
        { id: 'schedule', name: 'Schedule', icon: Clock },
        { id: 'workers', name: `Workers (${assignedStaff.length})`, icon: User },
        { id: 'checklists', name: `Checklists (${job.job_checklists?.length || 0})`, icon: CheckSquare },
        { id: 'attachments', name: 'Attachments', icon: Paperclip },
        { id: 'notes', name: 'Notes', icon: StickyNote },
        { id: 'financials', name: `Financials (${(job.invoices?.length || 0) + (job.customers?.contracts?.length || 0) + (job.customers?.quotes?.length || 0)})`, icon: Receipt },
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
                            {job.title}
                        </h2>
                        <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                <User className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                                {job.customers?.business_name || job.customers?.contact_name}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                <MapPin className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                                {job.job_sites?.name || 'No Site'}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                <Calendar className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                                {job.start_time ? format(new Date(job.start_time), 'MMM d, yyyy h:mm a') : 'Unscheduled'}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex md:ml-4 md:mt-0 gap-x-3">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${job.status === 'completed' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                            job.status === 'in_progress' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                job.status === 'scheduled' ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' :
                                    'bg-gray-50 text-gray-600 ring-gray-500/10'
                            }`}>
                            {job.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <button
                            onClick={handleCreateInvoice}
                            disabled={createInvoice.isPending}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        >
                            <Receipt className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                            {createInvoice.isPending ? 'Creating...' : 'Invoice'}
                        </button>
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            <Download className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Download PDF
                        </button>
                        <Link
                            href={`/dashboard/jobs/${id}/edit`}
                            className="inline-flex items-center rounded-md bg-[var(--primary-color)] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
                        >
                            <Edit className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Edit
                        </Link>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-8 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                  ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
                  group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium whitespace-nowrap
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
            <div id="printable-content" className="space-y-6">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Description */}
                            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6 lg:col-span-2">
                                <h3 className="text-base font-semibold leading-7 text-gray-900 flex items-center">
                                    <FileText className="mr-2 h-5 w-5 text-blue-500" />
                                    Description
                                </h3>
                                <p className="mt-4 text-sm leading-6 text-gray-600 whitespace-pre-wrap">
                                    {job.description || 'No description provided.'}
                                </p>
                            </div>

                            {/* Job Site Details */}
                            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                                <h3 className="text-base font-semibold leading-7 text-gray-900 flex items-center mb-4">
                                    <Building2 className="mr-2 h-5 w-5 text-blue-500" />
                                    Job Site Details
                                </h3>
                                {job.job_sites ? (
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Site Name</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                <Link href={`/dashboard/job-sites/${job.job_sites.id}`} className="text-blue-600 hover:underline">
                                                    {job.job_sites.name}
                                                </Link>
                                            </dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{job.job_sites.is_active ? 'Active' : 'Inactive'}</dd>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <dt className="text-sm font-medium text-gray-500">Address</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {job.job_sites.address}<br />
                                                {job.job_sites.city}, {job.job_sites.state} {job.job_sites.postal_code}<br />
                                                {job.job_sites.country}
                                            </dd>
                                        </div>
                                    </dl>
                                ) : (
                                    <p className="text-sm text-gray-500">No job site linked.</p>
                                )}
                            </div>

                            {/* Customer Information */}
                            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                                <h3 className="text-base font-semibold leading-7 text-gray-900 flex items-center mb-4">
                                    <User className="mr-2 h-5 w-5 text-blue-500" />
                                    Customer Information
                                </h3>
                                {job.customers ? (
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Customer Name</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                <Link href={`/dashboard/customers/${job.customers.id}`} className="text-blue-600 hover:underline">
                                                    {job.customers.business_name || job.customers.contact_name}
                                                </Link>
                                            </dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{job.customers.contact_name}</dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{job.customers.email || '-'}</dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Phone</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{job.customers.phone || '-'}</dd>
                                        </div>
                                    </dl>
                                ) : (
                                    <p className="text-sm text-gray-500">No customer linked.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'schedule' && (
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                        <h3 className="text-base font-semibold leading-7 text-gray-900 mb-4 flex items-center">
                            <Clock className="mr-2 h-5 w-5 text-blue-500" />
                            Schedule Information
                        </h3>
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Start Time</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {job.start_time ? format(new Date(job.start_time), 'MMM d, yyyy h:mm a') : 'Unscheduled'}
                                </dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">End Time</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {job.end_time ? format(new Date(job.end_time), 'MMM d, yyyy h:mm a') : '-'}
                                </dd>
                            </div>
                        </dl>
                    </div>
                )}

                {activeTab === 'workers' && (
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                        <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                            <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center">
                                <User className="mr-2 h-5 w-5 text-blue-500" />
                                Assigned Workers
                            </h3>
                        </div>
                        <ul role="list" className="divide-y divide-gray-100">
                            {assignedStaff.map((worker: any, index: number) => (
                                <li key={`${worker.id}-${index}`} className="flex items-center justify-between gap-x-6 py-5 px-6 hover:bg-gray-50">
                                    <div className="min-w-0">
                                        <div className="flex items-start gap-x-3">
                                            <p className="text-sm font-semibold leading-6 text-gray-900">
                                                {worker.first_name ? `${worker.first_name} ${worker.last_name}` : worker.company_name}
                                            </p>
                                            <p className={`rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${worker.type === 'worker' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : 'bg-purple-50 text-purple-700 ring-purple-600/20'}`}>
                                                {worker.type === 'worker' ? 'Internal Worker' : 'Contractor'}
                                            </p>
                                        </div>
                                        <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                            <p className="truncate">Status: {worker.status}</p>
                                            {worker.email && <p className="truncate">• {worker.email}</p>}
                                        </div>
                                    </div>
                                </li>
                            ))}
                            {assignedStaff.length === 0 && (
                                <li className="py-6 text-center text-gray-500 text-sm">No workers assigned to this job.</li>
                            )}
                        </ul>
                    </div>
                )}

                {activeTab === 'checklists' && (
                    <div className="space-y-6">
                        {job.job_checklists?.map((checklist: any) => (
                            <div key={checklist.id} className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                                <h3 className="text-base font-semibold leading-7 text-gray-900 mb-4 flex items-center">
                                    <CheckSquare className="mr-2 h-5 w-5 text-blue-500" />
                                    {checklist.checklists.name}
                                </h3>
                                <div className="space-y-4">
                                    {checklist.items?.map((item: any, index: number) => (
                                        <div key={index} className="relative flex items-start">
                                            <div className="flex h-6 items-center">
                                                <input
                                                    id={`item-${checklist.id}-${index}`}
                                                    name={`item-${checklist.id}-${index}`}
                                                    type="checkbox"
                                                    checked={item.isCompleted}
                                                    onChange={() => toggleChecklistItem(checklist.id, checklist.items, index)}
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                                />
                                            </div>
                                            <div className="ml-3 text-sm leading-6">
                                                <label htmlFor={`item-${checklist.id}-${index}`} className={`font-medium ${item.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                                    {item.text}
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                    {(!checklist.items || checklist.items.length === 0) && (
                                        <p className="text-sm text-gray-500 italic">No items in this checklist.</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {(!job.job_checklists || job.job_checklists.length === 0) && (
                            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6 text-center text-gray-500">
                                No checklists attached to this job.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'attachments' && (
                    <AttachmentsSection entityType="job" entityId={job.id} />
                )}

                {activeTab === 'notes' && (
                    <NotesSection entityType="job" entityId={job.id} />
                )}

                {activeTab === 'financials' && (
                    <div className="space-y-6">
                        {/* Invoices */}
                        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                                <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center">
                                    <Receipt className="mr-2 h-5 w-5 text-blue-500" />
                                    Invoices
                                </h3>
                            </div>
                            <ul role="list" className="divide-y divide-gray-100">
                                {job.invoices?.map((invoice: any) => (
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
                                {(!job.invoices || job.invoices.length === 0) && (
                                    <li className="py-6 text-center text-gray-500 text-sm">No invoices linked to this job.</li>
                                )}
                            </ul>
                        </div>

                        {/* Contracts */}
                        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                                <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center">
                                    <FileText className="mr-2 h-5 w-5 text-blue-500" />
                                    Contracts
                                </h3>
                            </div>
                            <ul role="list" className="divide-y divide-gray-100">
                                {job.customers?.contracts?.map((contract: any) => (
                                    <li key={contract.id} className="flex items-center justify-between gap-x-6 py-5 px-6 hover:bg-gray-50">
                                        <div className="min-w-0">
                                            <div className="flex items-start gap-x-3">
                                                <p className="text-sm font-semibold leading-6 text-gray-900">{contract.name}</p>
                                                <p className={`rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${contract.status === 'active' ? 'text-green-700 bg-green-50 ring-green-600/20' : 'text-gray-600 bg-gray-50 ring-gray-500/10'}`}>
                                                    {contract.status}
                                                </p>
                                            </div>
                                            <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                                <p className="truncate">
                                                    {new Date(contract.start_date).toLocaleDateString('en-GB')} - {new Date(contract.end_date).toLocaleDateString('en-GB')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-none items-center gap-x-4">
                                            <a href={`/dashboard/contracts/${contract.id}`} className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block">
                                                View
                                            </a>
                                        </div>
                                    </li>
                                ))}
                                {(!job.customers?.contracts || job.customers.contracts.length === 0) && (
                                    <li className="py-6 text-center text-gray-500 text-sm">No contracts found for this customer.</li>
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
                                {job.customers?.quotes?.map((quote: any) => (
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
                                {(!job.customers?.quotes || job.customers.quotes.length === 0) && (
                                    <li className="py-6 text-center text-gray-500 text-sm">No quotes found for this customer.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                )}

                {activeTab === 'certification' && (
                    <div className="space-y-6">
                        <CertificationManager entityType="job" entityId={job.id} />
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                        <h3 className="text-base font-semibold leading-6 text-gray-900 mb-6">Recent Activity</h3>
                        <ActivityFeed entityType="job" entityId={job.id} limit={20} />
                    </div>
                )}
            </div>
        </div>
    )
}

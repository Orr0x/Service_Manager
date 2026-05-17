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
    Download,
    ShieldCheck,
    Image as ImageIcon,
    ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { NotesSection } from '@/components/notes-section'
import { AttachmentsSection } from '@/components/attachments-section'
import CertificationManager from '@/components/certification/CertificationManager'
import { ActivityFeed } from '@/components/common/activity-feed'
import { useState } from 'react'

export function JobDetail({ id }: { id: string }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const utils = api.useUtils()
    const { data: job, isLoading: isLoadingJob } = api.jobs.getById.useQuery(id)

    const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'overview')
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
        { id: 'photos', name: `Photos (${job.job_photos?.length || 0})`, icon: ImageIcon },
        { id: 'attachments', name: 'Attachments', icon: Paperclip },
        { id: 'notes', name: 'Notes', icon: StickyNote },
        { id: 'financials', name: `Financials (${(job.invoices?.length || 0) + (job.customers?.contracts?.length || 0) + (job.customers?.quotes?.length || 0)})`, icon: Receipt },
        { id: 'payroll', name: 'Payroll', icon: ShieldCheck },
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

                {activeTab === 'photos' && (
                    <JobPhotosGallery photos={(job.job_photos || []) as AdminJobPhoto[]} />
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

                {activeTab === 'payroll' && (
                    <PayrollReview
                        key={`${job.id}-${job.payroll_adjusted_at || job.updated_at || ''}`}
                        job={job}
                        onUpdated={() => utils.jobs.getById.invalidate(id)}
                    />
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

type PayrollJob = {
    id: string
    start_time?: string | null
    end_time?: string | null
    actual_start_time?: string | null
    actual_end_time?: string | null
    payable_start_time?: string | null
    payable_end_time?: string | null
    payable_start_source?: PayableTimeSource | null
    payable_end_source?: PayableTimeSource | null
    payable_minutes?: number | null
    start_distance_meters?: number | null
    early_start_authorized?: boolean | null
    late_start_authorized?: boolean | null
    late_finish_authorized?: boolean | null
    location_override_authorized?: boolean | null
    payroll_adjustment_notes?: string | null
    job_assignments?: PayrollAssignment[] | null
}

type PayableTimeSource = 'calculated' | 'scheduled' | 'actual' | 'custom'
type AssignmentPayableTimeSource = 'job' | 'scheduled' | 'actual' | 'custom'

type PayrollAssignment = {
    id: string
    worker_id?: string | null
    actual_start_time?: string | null
    actual_end_time?: string | null
    payable_start_time?: string | null
    payable_end_time?: string | null
    payable_minutes?: number | null
    payable_start_source?: AssignmentPayableTimeSource | null
    payable_end_source?: AssignmentPayableTimeSource | null
    payroll_adjustment_notes?: string | null
    workers?: {
        first_name?: string | null
        last_name?: string | null
        role?: string | null
        hourly_rate?: number | null
    } | null
}

type AdminJobPhoto = {
    id: string
    photo_type: 'before' | 'during' | 'after'
    description?: string | null
    file_name: string
    status: string
    google_drive_web_view_link?: string | null
    last_error?: string | null
    created_at: string
}

function JobPhotosGallery({ photos }: { photos: AdminJobPhoto[] }) {
    const groupedPhotos = photos.reduce<Record<AdminJobPhoto['photo_type'], AdminJobPhoto[]>>((groups, photo) => {
        groups[photo.photo_type].push(photo)
        return groups
    }, { before: [], during: [], after: [] })

    return (
        <div className="space-y-6">
            {(['before', 'during', 'after'] as const).map((photoType) => (
                <div key={photoType} className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                    <h3 className="text-base font-semibold leading-7 text-gray-900 capitalize flex items-center">
                        <ImageIcon className="mr-2 h-5 w-5 text-blue-500" />
                        {photoType} Photos
                    </h3>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {groupedPhotos[photoType].map((photo) => (
                            <div key={photo.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-gray-900">{photo.file_name}</p>
                                        <p className="text-xs text-gray-500">{format(new Date(photo.created_at), 'MMM d, yyyy h:mm a')}</p>
                                    </div>
                                    <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${photo.status === 'stored_in_google_drive'
                                        ? 'bg-green-100 text-green-700'
                                        : photo.status === 'google_drive_failed'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {photo.status.replaceAll('_', ' ')}
                                    </span>
                                </div>
                                {photo.description && <p className="mt-3 text-sm text-gray-700">{photo.description}</p>}
                                {photo.last_error && <p className="mt-3 text-sm text-red-600">{photo.last_error}</p>}
                                {photo.google_drive_web_view_link && (
                                    <a
                                        href={photo.google_drive_web_view_link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-500"
                                    >
                                        Open in Google Drive
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                    {groupedPhotos[photoType].length === 0 && (
                        <p className="mt-4 text-sm text-gray-500">No {photoType} photos uploaded yet.</p>
                    )}
                </div>
            ))}
        </div>
    )
}

function PayrollReview({ job, onUpdated }: { job: PayrollJob; onUpdated: () => void }) {
    const [earlyStartAuthorized, setEarlyStartAuthorized] = useState(job.early_start_authorized ?? false)
    const [lateStartAuthorized, setLateStartAuthorized] = useState(job.late_start_authorized ?? false)
    const [lateFinishAuthorized, setLateFinishAuthorized] = useState(job.late_finish_authorized ?? false)
    const [locationOverrideAuthorized, setLocationOverrideAuthorized] = useState(job.location_override_authorized ?? false)
    const [payableStartSource, setPayableStartSource] = useState<PayableTimeSource>(job.payable_start_source || 'calculated')
    const [payableEndSource, setPayableEndSource] = useState<PayableTimeSource>(job.payable_end_source || 'calculated')
    const [customPayableStart, setCustomPayableStart] = useState(toDateTimeInputValue(job.payable_start_time))
    const [customPayableEnd, setCustomPayableEnd] = useState(toDateTimeInputValue(job.payable_end_time))
    const [payrollNotes, setPayrollNotes] = useState(job.payroll_adjustment_notes || '')

    const updatePayrollAdjustment = api.jobs.updatePayrollAdjustment.useMutation({
        onSuccess: () => {
            onUpdated()
            alert('Payroll adjustment saved.')
        }
    })

    const handlePayrollSave = () => {
        updatePayrollAdjustment.mutate({
            id: job.id,
            earlyStartAuthorized,
            lateStartAuthorized,
            lateFinishAuthorized,
            locationOverrideAuthorized,
            payableStartSource,
            payableEndSource,
            customPayableStart: payableStartSource === 'custom' ? customPayableStart : null,
            customPayableEnd: payableEndSource === 'custom' ? customPayableEnd : null,
            notes: payrollNotes,
        })
    }

    return (
        <div className="space-y-6">
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900 flex items-center">
                            <ShieldCheck className="mr-2 h-5 w-5 text-blue-500" />
                            Attendance & Payroll Review
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">Actual times are kept as evidence. Payable times are recalculated from the authorisations below.</p>
                    </div>
                    <button
                        type="button"
                        onClick={handlePayrollSave}
                        disabled={updatePayrollAdjustment.isPending}
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                    >
                        {updatePayrollAdjustment.isPending ? 'Saving...' : 'Save Review'}
                    </button>
                </div>

                <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <PayrollMetric label="Scheduled Start" value={formatPayrollDateTime(job.start_time)} />
                    <PayrollMetric label="Actual Start" value={formatPayrollDateTime(job.actual_start_time)} />
                    <PayrollMetric label="Scheduled End" value={formatPayrollDateTime(job.end_time)} />
                    <PayrollMetric label="Actual End" value={formatPayrollDateTime(job.actual_end_time)} />
                    <PayrollMetric label="Payable Start" value={formatPayrollDateTime(job.payable_start_time)} />
                    <PayrollMetric label="Payable End" value={formatPayrollDateTime(job.payable_end_time)} />
                    <PayrollMetric label="Payable Duration" value={formatPayrollMinutes(job.payable_minutes)} />
                    <PayrollMetric label="Start Distance" value={typeof job.start_distance_meters === 'number' ? `${Math.round(job.start_distance_meters)}m` : '-'} />
                </dl>
            </div>

            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6 space-y-5">
                <div>
                    <h3 className="text-base font-semibold leading-7 text-gray-900">Authorisations</h3>
                    <p className="mt-1 text-sm text-gray-500">These choices control payable time, not the recorded actual attendance.</p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <PayableSourceControl
                        label="Payable start"
                        source={payableStartSource}
                        onSourceChange={setPayableStartSource}
                        customValue={customPayableStart}
                        onCustomChange={setCustomPayableStart}
                        scheduledLabel={formatPayrollDateTime(job.start_time)}
                        actualLabel={formatPayrollDateTime(job.actual_start_time)}
                    />
                    <PayableSourceControl
                        label="Payable end"
                        source={payableEndSource}
                        onSourceChange={setPayableEndSource}
                        customValue={customPayableEnd}
                        onCustomChange={setCustomPayableEnd}
                        scheduledLabel={formatPayrollDateTime(job.end_time)}
                        actualLabel={formatPayrollDateTime(job.actual_end_time)}
                    />
                    <PayrollToggle
                        label="Pay early start from actual start"
                        checked={earlyStartAuthorized}
                        onChange={setEarlyStartAuthorized}
                    />
                    <PayrollToggle
                        label="Pay late start from scheduled start"
                        checked={lateStartAuthorized}
                        onChange={setLateStartAuthorized}
                    />
                    <PayrollToggle
                        label="Pay late finish through actual finish"
                        checked={lateFinishAuthorized}
                        onChange={setLateFinishAuthorized}
                    />
                    <PayrollToggle
                        label="Authorise location override"
                        checked={locationOverrideAuthorized}
                        onChange={setLocationOverrideAuthorized}
                    />
                </div>

                <label className="block">
                    <span className="block text-sm font-medium text-gray-900">Payroll notes</span>
                    <textarea
                        value={payrollNotes}
                        onChange={(event) => setPayrollNotes(event.target.value)}
                        rows={4}
                        className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        placeholder="Reason for authorisation or adjustment"
                    />
                </label>
            </div>

            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6 space-y-5">
                <div>
                    <h3 className="text-base font-semibold leading-7 text-gray-900">Worker Payroll Overrides</h3>
                    <p className="mt-1 text-sm text-gray-500">Use these when workers on the same job need different payable start or end times.</p>
                </div>

                <div className="space-y-4">
                    {(job.job_assignments || [])
                        .filter((assignment) => assignment.worker_id && assignment.workers)
                        .map((assignment) => (
                            <WorkerPayrollOverride
                                key={assignment.id}
                                job={job}
                                assignment={assignment}
                                onUpdated={onUpdated}
                            />
                        ))}
                    {(job.job_assignments || []).filter((assignment) => assignment.worker_id && assignment.workers).length === 0 && (
                        <p className="rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-500">No workers are assigned to this job yet.</p>
                    )}
                </div>
            </div>
        </div>
    )
}

function formatPayrollDateTime(value?: string | null) {
    return value ? format(new Date(value), 'MMM d, yyyy h:mm a') : '-'
}

function formatPayrollMinutes(value?: number | null) {
    if (!value) return '-'
    const hours = Math.floor(value / 60)
    const minutes = value % 60
    return `${hours}h ${minutes}m`
}

function toDateTimeInputValue(value?: string | null) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return offsetDate.toISOString().slice(0, 16)
}

function PayrollMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <dt className="text-xs font-medium uppercase text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900">{value}</dd>
        </div>
    )
}

function PayableSourceControl({
    label,
    source,
    onSourceChange,
    customValue,
    onCustomChange,
    scheduledLabel,
    actualLabel,
}: {
    label: string
    source: PayableTimeSource
    onSourceChange: (source: PayableTimeSource) => void
    customValue: string
    onCustomChange: (value: string) => void
    scheduledLabel: string
    actualLabel: string
}) {
    return (
        <div className="rounded-lg border border-gray-200 px-4 py-3">
            <label className="block text-sm font-medium text-gray-900">
                {label}
                <select
                    value={source}
                    onChange={(event) => onSourceChange(event.target.value as PayableTimeSource)}
                    className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                    <option value="calculated">Calculated from authorisations</option>
                    <option value="scheduled">Scheduled time ({scheduledLabel})</option>
                    <option value="actual">Actual time ({actualLabel})</option>
                    <option value="custom">Custom date and time</option>
                </select>
            </label>
            {source === 'custom' && (
                <label className="mt-3 block text-sm font-medium text-gray-900">
                    Custom {label.toLowerCase()}
                    <input
                        type="datetime-local"
                        value={customValue}
                        onChange={(event) => onCustomChange(event.target.value)}
                        className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                </label>
            )}
        </div>
    )
}

function WorkerPayrollOverride({
    job,
    assignment,
    onUpdated,
}: {
    job: PayrollJob
    assignment: PayrollAssignment
    onUpdated: () => void
}) {
    const [payableStartSource, setPayableStartSource] = useState<AssignmentPayableTimeSource>(assignment.payable_start_source || 'job')
    const [payableEndSource, setPayableEndSource] = useState<AssignmentPayableTimeSource>(assignment.payable_end_source || 'job')
    const [customPayableStart, setCustomPayableStart] = useState(toDateTimeInputValue(assignment.payable_start_time || job.payable_start_time))
    const [customPayableEnd, setCustomPayableEnd] = useState(toDateTimeInputValue(assignment.payable_end_time || job.payable_end_time))
    const [notes, setNotes] = useState(assignment.payroll_adjustment_notes || '')

    const updateAssignmentPayrollAdjustment = api.jobs.updateAssignmentPayrollAdjustment.useMutation({
        onSuccess: () => {
            onUpdated()
            alert('Worker payroll override saved.')
        }
    })

    const workerName = `${assignment.workers?.first_name || ''} ${assignment.workers?.last_name || ''}`.trim() || 'Worker'

    const handleSave = () => {
        updateAssignmentPayrollAdjustment.mutate({
            jobId: job.id,
            assignmentId: assignment.id,
            payableStartSource,
            payableEndSource,
            customPayableStart: payableStartSource === 'custom' ? customPayableStart : null,
            customPayableEnd: payableEndSource === 'custom' ? customPayableEnd : null,
            notes,
        })
    }

    return (
        <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="font-semibold text-gray-900">{workerName}</p>
                    <p className="text-sm text-gray-500">
                        {assignment.workers?.role || 'Worker'} · {typeof assignment.workers?.hourly_rate === 'number' ? `£${assignment.workers.hourly_rate.toFixed(2)}/hr` : 'No rate set'}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                        Actual: {formatPayrollDateTime(assignment.actual_start_time || job.actual_start_time)} to {formatPayrollDateTime(assignment.actual_end_time || job.actual_end_time)}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                        Payable: {formatPayrollDateTime(assignment.payable_start_time || job.payable_start_time)} to {formatPayrollDateTime(assignment.payable_end_time || job.payable_end_time)}
                        {' '}({formatPayrollMinutes(assignment.payable_minutes ?? job.payable_minutes)})
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={updateAssignmentPayrollAdjustment.isPending}
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                >
                    {updateAssignmentPayrollAdjustment.isPending ? 'Saving...' : 'Save Worker'}
                </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <AssignmentPayableSourceControl
                    label="Worker payable start"
                    source={payableStartSource}
                    onSourceChange={setPayableStartSource}
                    customValue={customPayableStart}
                    onCustomChange={setCustomPayableStart}
                    jobLabel={formatPayrollDateTime(job.payable_start_time)}
                    scheduledLabel={formatPayrollDateTime(job.start_time)}
                    actualLabel={formatPayrollDateTime(assignment.actual_start_time || job.actual_start_time)}
                />
                <AssignmentPayableSourceControl
                    label="Worker payable end"
                    source={payableEndSource}
                    onSourceChange={setPayableEndSource}
                    customValue={customPayableEnd}
                    onCustomChange={setCustomPayableEnd}
                    jobLabel={formatPayrollDateTime(job.payable_end_time)}
                    scheduledLabel={formatPayrollDateTime(job.end_time)}
                    actualLabel={formatPayrollDateTime(assignment.actual_end_time || job.actual_end_time)}
                />
            </div>

            <label className="mt-4 block">
                <span className="block text-sm font-medium text-gray-900">Worker payroll notes</span>
                <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={2}
                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    placeholder="Reason for this worker-specific adjustment"
                />
            </label>
        </div>
    )
}

function AssignmentPayableSourceControl({
    label,
    source,
    onSourceChange,
    customValue,
    onCustomChange,
    jobLabel,
    scheduledLabel,
    actualLabel,
}: {
    label: string
    source: AssignmentPayableTimeSource
    onSourceChange: (source: AssignmentPayableTimeSource) => void
    customValue: string
    onCustomChange: (value: string) => void
    jobLabel: string
    scheduledLabel: string
    actualLabel: string
}) {
    return (
        <div className="rounded-lg border border-gray-200 px-4 py-3">
            <label className="block text-sm font-medium text-gray-900">
                {label}
                <select
                    value={source}
                    onChange={(event) => onSourceChange(event.target.value as AssignmentPayableTimeSource)}
                    className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                    <option value="job">Use job payable time ({jobLabel})</option>
                    <option value="scheduled">Scheduled time ({scheduledLabel})</option>
                    <option value="actual">Actual time ({actualLabel})</option>
                    <option value="custom">Custom date and time</option>
                </select>
            </label>
            {source === 'custom' && (
                <label className="mt-3 block text-sm font-medium text-gray-900">
                    Custom {label.toLowerCase()}
                    <input
                        type="datetime-local"
                        value={customValue}
                        onChange={(event) => onCustomChange(event.target.value)}
                        className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                </label>
            )}
        </div>
    )
}

function PayrollToggle({
    label,
    checked,
    onChange,
}: {
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
}) {
    return (
        <label className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3">
            <span className="text-sm font-medium text-gray-900">{label}</span>
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
            />
        </label>
    )
}

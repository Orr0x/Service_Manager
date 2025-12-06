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
    Briefcase
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { NotesSection } from '@/components/notes-section'
import { AttachmentsSection } from '@/components/attachments-section'
import { useState } from 'react'

export function JobDetail({ id }: { id: string }) {
    const router = useRouter()
    const utils = api.useUtils()
    const { data: job, isLoading: isLoadingJob } = api.jobs.getById.useQuery(id)
    const { data: invoices } = api.invoices.getByJobId.useQuery({ jobId: id })

    const [activeTab, setActiveTab] = useState('info')
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

    const tabs = [
        { id: 'info', name: 'Job Info', icon: Briefcase },
        { id: 'checklists', name: `Checklists (${job.job_checklists?.length || 0})`, icon: CheckSquare },
        { id: 'attachments', name: 'Attachments', icon: Paperclip },
        { id: 'notes', name: 'Notes', icon: StickyNote },
        { id: 'invoices', name: `Invoices (${invoices?.length || 0})`, icon: Receipt },
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
                            onClick={() => setIsEditModalOpen(true)}
                            className="inline-flex items-center rounded-md bg-[var(--primary-color)] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
                        >
                            <Edit className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
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
                        {/* Description */}
                        <div className="lg:col-span-2 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                            <h3 className="text-base font-semibold leading-7 text-gray-900 flex items-center">
                                <FileText className="mr-2 h-5 w-5 text-blue-500" />
                                Description
                            </h3>
                            <p className="mt-4 text-sm leading-6 text-gray-600 whitespace-pre-wrap">
                                {job.description || 'No description provided.'}
                            </p>
                        </div>

                        {/* Assignments Sidebar */}
                        <div className="lg:col-span-1 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                            <h3 className="text-base font-semibold leading-7 text-gray-900">Assignments</h3>
                            <ul className="mt-4 divide-y divide-gray-100">
                                {job.job_assignments && job.job_assignments.length > 0 ? (
                                    job.job_assignments.map((assignment: any) => (
                                        <li key={assignment.id} className="flex items-center justify-between py-2">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                                                    {(assignment.workers?.first_name?.[0] || assignment.contractors?.company_name?.[0] || '?').toUpperCase()}
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {assignment.workers
                                                            ? `${assignment.workers.first_name} ${assignment.workers.last_name}`
                                                            : assignment.contractors?.company_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 capitalize">{assignment.status}</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No workers assigned.</p>
                                )}
                            </ul>
                        </div>
                    </div>
                )}

                {activeTab === 'checklists' && (
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                        <h3 className="text-base font-semibold leading-7 text-gray-900 flex items-center mb-4">
                            <CheckSquare className="h-5 w-5 mr-2 text-blue-500" />
                            Checklists
                        </h3>
                        {job.job_checklists && job.job_checklists.length > 0 ? (
                            <div className="space-y-6">
                                {job.job_checklists.map((cl: any) => {
                                    const items = typeof cl.items === 'string' ? JSON.parse(cl.items) : cl.items || []
                                    return (
                                        <div key={cl.id} className="border rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">{cl.checklists?.name}</h4>
                                            <ul className="space-y-3">
                                                {Array.isArray(items) && items.map((item: any, index: number) => (
                                                    <li key={index} className="flex items-start">
                                                        <div className="flex h-6 items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={item.isCompleted}
                                                                onChange={() => toggleChecklistItem(cl.id, items, index)}
                                                                className="h-4 w-4 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                                                            />
                                                        </div>
                                                        <div className="ml-3 text-sm leading-6">
                                                            <label className={`font-medium ${item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                                                {item.text}
                                                            </label>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No checklists attached.</p>
                        )}
                    </div>
                )}

                {activeTab === 'attachments' && (
                    <AttachmentsSection entityType="job" entityId={id} />
                )}

                {activeTab === 'notes' && (
                    <NotesSection entityType="job" entityId={id} />
                )}

                {activeTab === 'invoices' && (
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
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
                                <li className="py-12 text-center text-gray-500">No invoices linked to this job.</li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}

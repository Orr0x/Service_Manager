'use client'

import { api } from '@/trpc/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckSquare, Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { useState } from 'react'

interface ChecklistItem {
    text: string
    isCompleted: boolean
    description?: string
}

export function ChecklistDetail({ id }: { id: string }) {
    const router = useRouter()
    const utils = api.useUtils()
    const { data: checklist, isLoading: isLoadingChecklist } = api.checklists.getById.useQuery({ id })
    const { data: relatedJobs, isLoading: isLoadingJobs } = api.jobs.getByChecklistId.useQuery({ checklistId: id })

    const [activeTab, setActiveTab] = useState('tasks')

    const updateChecklist = api.checklists.update.useMutation({
        onSuccess: () => {
            utils.checklists.getById.invalidate({ id })
        }
    })

    const deleteChecklist = api.checklists.delete.useMutation({
        onSuccess: () => {
            router.push('/dashboard/checklists')
            router.refresh()
        },
    })

    if (isLoadingChecklist || isLoadingJobs) {
        return <div className="p-8 text-center text-gray-500">Loading checklist details...</div>
    }

    if (!checklist) {
        return <div className="p-8 text-center text-gray-500">Checklist not found</div>
    }

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this checklist?')) {
            deleteChecklist.mutate({ id })
        }
    }

    const items = (typeof checklist.items === 'string' ? JSON.parse(checklist.items) : checklist.items) as ChecklistItem[]

    const toggleItem = (index: number) => {
        const newItems = [...items]
        newItems[index].isCompleted = !newItems[index].isCompleted

        updateChecklist.mutate({
            id,
            items: newItems
        })
    }

    const completedCount = items.filter(i => i.isCompleted).length
    const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0

    // Process related data
    const uniqueJobSites = Array.from(new Map(
        relatedJobs?.filter(job => job.job_sites?.id).map(job => [job.job_sites!.id, job.job_sites])
    ).values())

    const uniqueCustomers = Array.from(new Map(
        relatedJobs?.filter(job => job.customers?.id).map(job => [job.customers!.id, job.customers])
    ).values())

    // Extract contracts and quotes from customers
    const allContracts = relatedJobs?.flatMap(job => job.customers?.contracts || []) || []
    const uniqueContracts = Array.from(new Map(
        allContracts.map(c => [c.id, c])
    ).values())

    const allQuotes = relatedJobs?.flatMap(job => job.customers?.quotes || []) || []
    const uniqueQuotes = Array.from(new Map(
        allQuotes.map(q => [q.id, q])
    ).values())

    // Extract invoices from jobs AND quotes
    const jobInvoices = relatedJobs?.flatMap(job => job.invoices || []) || []
    const quoteInvoices = allQuotes.flatMap(quote => quote.invoices || [])
    const allInvoices = [...jobInvoices, ...quoteInvoices]

    const uniqueInvoices = Array.from(new Map(
        allInvoices.map(inv => [inv.id, inv])
    ).values())

    const tabs = [
        { id: 'tasks', name: 'Tasks', count: items.length },
        { id: 'jobs', name: 'Jobs', count: relatedJobs?.length || 0 },
        { id: 'job-sites', name: 'Job Sites', count: uniqueJobSites.length },
        { id: 'customers', name: 'Customers', count: uniqueCustomers.length },
        { id: 'contracts', name: 'Contracts', count: uniqueContracts.length },
        { id: 'quotes', name: 'Quotes', count: uniqueQuotes.length },
        { id: 'invoices', name: 'Invoices', count: uniqueInvoices.length },
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
                            {checklist.name}
                        </h2>
                        <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                {checklist.is_template && (
                                    <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10 mr-2">
                                        Template
                                    </span>
                                )}
                                <span>Created {new Date(checklist.created_at).toLocaleDateString('en-GB')}</span>
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
                    <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                  ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
                  whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                `}
                            >
                                {tab.name}
                                <span className={`ml-2 rounded-full py-0.5 px-2.5 text-xs font-medium ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-900'
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'tasks' && (
                        <>
                            {/* Progress Bar */}
                            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Progress</span>
                                    <span className="text-sm font-medium text-gray-900">{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>

                            {/* Checklist Items */}
                            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                                <div className="border-b border-gray-900/5 bg-gray-50 px-4 py-3 sm:px-6">
                                    <h3 className="text-base font-semibold leading-7 text-gray-900">Tasks</h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {items.map((item, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-start p-4 hover:bg-gray-50 cursor-pointer transition-colors ${item.isCompleted ? 'bg-gray-50/50' : ''}`}
                                            onClick={() => toggleItem(index)}
                                        >
                                            <div className="flex h-6 items-center">
                                                {item.isCompleted ? (
                                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                ) : (
                                                    <Circle className="h-5 w-5 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="ml-3 text-sm leading-6 flex-1 min-w-0">
                                                <p className={`font-medium text-gray-900 cursor-pointer ${item.isCompleted ? 'line-through text-gray-500' : ''}`}>
                                                    {item.text}
                                                </p>
                                                {item.description && (
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {items.length === 0 && (
                                        <div className="p-8 text-center text-gray-500 text-sm">No tasks in this checklist.</div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'jobs' && (
                        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                            <ul role="list" className="divide-y divide-gray-100">
                                {relatedJobs?.map((job) => (
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
                                                <span>•</span>
                                                <p>{job.job_sites?.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-none items-center gap-x-4">
                                            <Link href={`/dashboard/jobs/${job.id}`} className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block">
                                                View
                                            </Link>
                                        </div>
                                    </li>
                                ))}
                                {(!relatedJobs || relatedJobs.length === 0) && (
                                    <li className="py-12 text-center text-gray-500">No jobs using this checklist.</li>
                                )}
                            </ul>
                        </div>
                    )}

                    {activeTab === 'job-sites' && (
                        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                            <ul role="list" className="divide-y divide-gray-100">
                                {uniqueJobSites.map((site: any) => (
                                    <li key={site.id} className="flex items-center justify-between gap-x-6 py-5 px-6 hover:bg-gray-50">
                                        <div className="min-w-0">
                                            <div className="flex items-start gap-x-3">
                                                <p className="text-sm font-semibold leading-6 text-gray-900">{site.name}</p>
                                                <p className={`rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${site.is_active ? 'text-green-700 bg-green-50 ring-green-600/20' : 'text-red-700 bg-red-50 ring-red-600/20'}`}>
                                                    {site.is_active ? 'ACTIVE' : 'INACTIVE'}
                                                </p>
                                            </div>
                                            <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                                <p className="truncate">{site.address}, {site.city}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-none items-center gap-x-4">
                                            <Link href={`/dashboard/job-sites/${site.id}`} className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block">
                                                View
                                            </Link>
                                        </div>
                                    </li>
                                ))}
                                {uniqueJobSites.length === 0 && (
                                    <li className="py-12 text-center text-gray-500">No job sites linked.</li>
                                )}
                            </ul>
                        </div>
                    )}

                    {activeTab === 'customers' && (
                        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                            <ul role="list" className="divide-y divide-gray-100">
                                {uniqueCustomers.map((customer: any) => (
                                    <li key={customer.id} className="flex items-center justify-between gap-x-6 py-5 px-6 hover:bg-gray-50">
                                        <div className="min-w-0">
                                            <div className="flex items-start gap-x-3">
                                                <p className="text-sm font-semibold leading-6 text-gray-900">{customer.business_name || customer.contact_name}</p>
                                            </div>
                                            <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                                <p className="truncate">{customer.email}</p>
                                                <span>•</span>
                                                <p>{customer.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-none items-center gap-x-4">
                                            <Link href={`/dashboard/customers/${customer.id}`} className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block">
                                                View
                                            </Link>
                                        </div>
                                    </li>
                                ))}
                                {uniqueCustomers.length === 0 && (
                                    <li className="py-12 text-center text-gray-500">No customers linked.</li>
                                )}
                            </ul>
                        </div>
                    )}

                    {activeTab === 'contracts' && (
                        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                            <ul role="list" className="divide-y divide-gray-100">
                                {uniqueContracts.map((contract: any) => (
                                    <li key={contract.id} className="flex items-center justify-between gap-x-6 py-5 px-6 hover:bg-gray-50">
                                        <div className="min-w-0">
                                            <div className="flex items-start gap-x-3">
                                                <p className="text-sm font-semibold leading-6 text-gray-900">{contract.title}</p>
                                                <p className={`rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${contract.status === 'active' ? 'text-green-700 bg-green-50 ring-green-600/20' : 'text-gray-600 bg-gray-50 ring-gray-500/10'}`}>
                                                    {contract.status}
                                                </p>
                                            </div>
                                            <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                                <p className="truncate">
                                                    {new Date(contract.start_date).toLocaleDateString('en-GB')} - {contract.end_date ? new Date(contract.end_date).toLocaleDateString('en-GB') : 'Ongoing'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-none items-center gap-x-4">
                                            <Link href={`/dashboard/contracts/${contract.id}`} className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block">
                                                View
                                            </Link>
                                        </div>
                                    </li>
                                ))}
                                {uniqueContracts.length === 0 && (
                                    <li className="py-12 text-center text-gray-500">No contracts linked.</li>
                                )}
                            </ul>
                        </div>
                    )}

                    {activeTab === 'quotes' && (
                        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                            <ul role="list" className="divide-y divide-gray-100">
                                {uniqueQuotes.map((quote: any) => (
                                    <li key={quote.id} className="flex items-center justify-between gap-x-6 py-5 px-6 hover:bg-gray-50">
                                        <div className="min-w-0">
                                            <div className="flex items-start gap-x-3">
                                                <p className="text-sm font-semibold leading-6 text-gray-900">{quote.title}</p>
                                                <p className={`rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${quote.status === 'accepted' ? 'text-green-700 bg-green-50 ring-green-600/20' : 'text-gray-600 bg-gray-50 ring-gray-500/10'}`}>
                                                    {quote.status}
                                                </p>
                                            </div>
                                            <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                                <p className="truncate">#{quote.quote_number}</p>
                                                <span>•</span>
                                                <p>£{quote.total_amount?.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-none items-center gap-x-4">
                                            <Link href={`/dashboard/quotes/${quote.id}`} className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block">
                                                View
                                            </Link>
                                        </div>
                                    </li>
                                ))}
                                {uniqueQuotes.length === 0 && (
                                    <li className="py-12 text-center text-gray-500">No quotes linked.</li>
                                )}
                            </ul>
                        </div>
                    )}

                    {activeTab === 'invoices' && (
                        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                            <ul role="list" className="divide-y divide-gray-100">
                                {uniqueInvoices.map((invoice: any) => (
                                    <li key={invoice.id} className="flex items-center justify-between gap-x-6 py-5 px-6 hover:bg-gray-50">
                                        <div className="min-w-0">
                                            <div className="flex items-start gap-x-3">
                                                <p className="text-sm font-semibold leading-6 text-gray-900">#{invoice.invoice_number}</p>
                                                <p className={`rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${invoice.status === 'paid' ? 'text-green-700 bg-green-50 ring-green-600/20' : 'text-yellow-800 bg-yellow-50 ring-yellow-600/20'}`}>
                                                    {invoice.status}
                                                </p>
                                            </div>
                                            <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                                <p className="truncate">£{invoice.total_amount?.toFixed(2)}</p>
                                                <span>•</span>
                                                <p>Due {new Date(invoice.due_date).toLocaleDateString('en-GB')}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-none items-center gap-x-4">
                                            <Link href={`/dashboard/invoices/${invoice.id}`} className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block">
                                                View
                                            </Link>
                                        </div>
                                    </li>
                                ))}
                                {uniqueInvoices.length === 0 && (
                                    <li className="py-12 text-center text-gray-500">No invoices linked.</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                        <div className="border-b border-gray-900/5 bg-gray-50 px-4 py-3 sm:px-6">
                            <h3 className="text-base font-semibold leading-7 text-gray-900">Details</h3>
                        </div>
                        <div className="px-4 py-5 sm:p-6">
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                                        {checklist.description || 'No description provided.'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {new Date(checklist.created_at).toLocaleDateString('en-GB')}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

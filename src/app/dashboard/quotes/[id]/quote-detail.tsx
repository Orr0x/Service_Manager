'use client'

import { api } from '@/trpc/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, DollarSign, FileText, MapPin, User, Pencil, Trash2, Mail, Receipt, Briefcase, Building2, ClipboardList } from 'lucide-react'
import { useState } from 'react'

interface QuoteItem {
    description: string
    quantity: number
    unitPrice: number
    amount: number
}

export function QuoteDetail({ id }: { id: string }) {
    const router = useRouter()
    const { data: quote, isLoading: isLoadingQuote } = api.quotes.getById.useQuery({ id })
    const { data: invoices } = api.invoices.getByQuoteId.useQuery({ quoteId: id })
    const { data: jobs } = api.jobs.getByQuoteId.useQuery({ quoteId: id })
    const { data: workers } = api.workers.getByQuoteId.useQuery({ quoteId: id })
    const { data: contractors } = api.contractors.getByQuoteId.useQuery({ quoteId: id })
    const { data: checklists } = api.checklists.getByQuoteId.useQuery({ quoteId: id })

    const [activeTab, setActiveTab] = useState('info')

    const deleteQuote = api.quotes.delete.useMutation({
        onSuccess: () => {
            router.push('/dashboard/quotes')
            router.refresh()
        },
    })

    const createInvoice = api.invoices.create.useMutation({
        onSuccess: (invoice) => {
            router.push(`/dashboard/invoices/${invoice.id}`)
        }
    })

    if (isLoadingQuote) {
        return <div className="p-8 text-center text-gray-500">Loading quote details...</div>
    }

    if (!quote) {
        return <div className="p-8 text-center text-gray-500">Quote not found</div>
    }

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this quote?')) {
            deleteQuote.mutate({ id })
        }
    }

    const items = (typeof quote.items === 'string' ? JSON.parse(quote.items) : quote.items) as QuoteItem[]

    const handleCreateInvoice = () => {
        if (!quote) return

        const invoiceItems = items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.amount
        }))

        createInvoice.mutate({
            customerId: quote.customer_id,
            jobSiteId: quote.job_site_id || undefined,
            quoteId: quote.id,
            status: 'draft',
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days due
            totalAmount: quote.total_amount || 0,
            items: invoiceItems,
            notes: `Created from Quote #${quote.quote_number}`
        })
    }

    const assignedStaff = [
        ...(workers?.map(w => ({ ...w, type: 'worker' as const, name: `${w.first_name} ${w.last_name}`, details: w.role })) || []),
        ...(contractors?.map(c => ({ ...c, type: 'contractor' as const, name: c.company_name, details: c.contact_name })) || [])
    ]

    const tabs = [
        { id: 'info', name: 'Quote Info', icon: FileText },
        { id: 'jobs', name: `Scheduled Jobs (${jobs?.length || 0})`, icon: Briefcase },
        { id: 'workers', name: `Assigned Workers (${assignedStaff.length})`, icon: User },
        { id: 'job-sites', name: `Job Sites (${quote.job_site ? 1 : 0})`, icon: Building2 },
        { id: 'checklists', name: `Checklists (${checklists?.length || 0})`, icon: ClipboardList },
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
                            {quote.title}
                        </h2>
                        <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${quote.status === 'accepted' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                    quote.status === 'sent' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                        quote.status === 'draft' ? 'bg-gray-50 text-gray-600 ring-gray-500/10' :
                                            'bg-red-50 text-red-700 ring-red-600/10'
                                    }`}>
                                    {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                                </span>
                                <span className="mx-2 text-gray-300">•</span>
                                <span>#{quote.quote_number}</span>
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
                            href={`/dashboard/quotes/${quote.id}/edit`}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            <Pencil className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Edit
                        </Link>
                        <button
                            type="button"
                            onClick={handleCreateInvoice}
                            disabled={createInvoice.isPending}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        >
                            <FileText className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            {createInvoice.isPending ? 'Creating...' : 'Create Invoice'}
                        </button>
                        <button
                            type="button"
                            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                        >
                            <Mail className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Send
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
                        {/* Quote Details */}
                        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                                <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center">
                                    <FileText className="mr-2 h-5 w-5 text-blue-500" />
                                    Quote Details
                                </h3>
                            </div>
                            <div className="px-4 py-5 sm:p-6">
                                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Customer</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {quote.customer ? (
                                                <Link href={`/dashboard/customers/${quote.customer_id}`} className="flex items-center text-blue-600 hover:underline">
                                                    <User className="mr-1.5 h-4 w-4 text-gray-400" />
                                                    {quote.customer.business_name || quote.customer.contact_name}
                                                </Link>
                                            ) : '-'}
                                        </dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Job Site</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {quote.job_site ? (
                                                <Link href={`/dashboard/job-sites/${quote.job_site_id}`} className="flex items-center text-blue-600 hover:underline">
                                                    <MapPin className="mr-1.5 h-4 w-4 text-gray-400" />
                                                    {quote.job_site.name}
                                                </Link>
                                            ) : '-'}
                                        </dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Issued Date</dt>
                                        <dd className="mt-1 text-sm text-gray-900 flex items-center">
                                            <Calendar className="mr-1.5 h-4 w-4 text-gray-400" />
                                            {quote.issued_date ? new Date(quote.issued_date).toLocaleDateString('en-GB') : '-'}
                                        </dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Expiry Date</dt>
                                        <dd className="mt-1 text-sm text-gray-900 flex items-center">
                                            <Calendar className="mr-1.5 h-4 w-4 text-gray-400" />
                                            {quote.expiry_date ? new Date(quote.expiry_date).toLocaleDateString('en-GB') : '-'}
                                        </dd>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <dt className="text-sm font-medium text-gray-500">Description</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{quote.description || 'No description provided.'}</dd>
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
                                {quote.customer ? (
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Customer Name</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                <Link href={`/dashboard/customers/${quote.customer.id}`} className="text-blue-600 hover:underline">
                                                    {quote.customer.business_name || quote.customer.contact_name}
                                                </Link>
                                            </dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{quote.customer.contact_name}</dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{quote.customer.email || '-'}</dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Phone</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{quote.customer.phone || '-'}</dd>
                                        </div>
                                    </dl>
                                ) : (
                                    <p className="text-sm text-gray-500">No customer linked.</p>
                                )}
                            </div>
                        </div>

                        {/* Line Items - Full Width */}
                        <div className="lg:col-span-2 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                                <h3 className="text-base font-semibold leading-6 text-gray-900">Line Items</h3>
                            </div>
                            <div className="px-4 py-5 sm:p-6">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr>
                                            <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                            <th scope="col" className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                            <th scope="col" className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                            <th scope="col" className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {items && items.length > 0 ? (
                                            items.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="py-4 text-sm text-gray-900">{item.description}</td>
                                                    <td className="py-4 text-sm text-gray-900 text-right">{item.quantity}</td>
                                                    <td className="py-4 text-sm text-gray-900 text-right">£{item.unitPrice.toFixed(2)}</td>
                                                    <td className="py-4 text-sm text-gray-900 text-right">£{item.amount.toFixed(2)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="py-4 text-sm text-gray-500 text-center">No items found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={3} className="py-4 text-sm font-bold text-gray-900 text-right">Total</td>
                                            <td className="py-4 text-sm font-bold text-gray-900 text-right">£{quote.total_amount ? quote.total_amount.toFixed(2) : '0.00'}</td>
                                        </tr>
                                    </tfoot>
                                </table>
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
                                <li className="py-12 text-center text-gray-500">No scheduled jobs found for this quote's site.</li>
                            )}
                        </ul>
                    </div>
                )}

                {activeTab === 'workers' && (
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
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
                                <li className="py-12 text-center text-gray-500">No workers or contractors assigned to jobs at this site.</li>
                            )}
                        </ul>
                    </div>
                )}

                {activeTab === 'job-sites' && (
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                        <ul role="list" className="divide-y divide-gray-100">
                            {quote.job_site ? (
                                <li className="flex items-center justify-between gap-x-6 py-5 px-6 hover:bg-gray-50">
                                    <div className="min-w-0">
                                        <div className="flex items-start gap-x-3">
                                            <p className="text-sm font-semibold leading-6 text-gray-900">{quote.job_site.name}</p>
                                            <p className={`rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${quote.job_site.is_active ? 'text-green-700 bg-green-50 ring-green-600/20' : 'text-red-700 bg-red-50 ring-red-600/20'}`}>
                                                {quote.job_site.is_active ? 'ACTIVE' : 'INACTIVE'}
                                            </p>
                                        </div>
                                        <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                            <p className="truncate">
                                                {quote.job_site.address}, {quote.job_site.city}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-none items-center gap-x-4">
                                        <a href={`/dashboard/job-sites/${quote.job_site.id}`} className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block">
                                            View
                                        </a>
                                    </div>
                                </li>
                            ) : (
                                <li className="py-12 text-center text-gray-500">No job site linked to this quote.</li>
                            )}
                        </ul>
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
                                <li className="py-12 text-center text-gray-500">No invoices linked to this quote.</li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}

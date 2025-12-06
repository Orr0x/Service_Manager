'use client'

import { api } from '@/trpc/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
    User,
    Building2,
    FileText,
    Briefcase,
    Receipt,
    Phone,
    Mail,
    MapPin,
    Edit,
    ArrowLeft
} from 'lucide-react'

export function CustomerDetail({ id }: { id: string }) {
    const router = useRouter()
    const { data: customer, isLoading: isLoadingCustomer } = api.customers.getById.useQuery({ id })
    const { data: jobSites } = api.jobSites.getByCustomerId.useQuery({ customerId: id })
    const { data: contracts } = api.contracts.getByCustomerId.useQuery({ customerId: id })
    const { data: jobs } = api.jobs.getByCustomerId.useQuery({ customerId: id })
    const { data: invoices } = api.invoices.getByCustomerId.useQuery({ customerId: id })
    const { data: quotes } = api.quotes.getByCustomerId.useQuery({ customerId: id })

    const [activeTab, setActiveTab] = useState('info')

    if (isLoadingCustomer) {
        return <div className="p-8 text-center text-gray-500">Loading customer details...</div>
    }

    if (!customer) {
        return <div className="p-8 text-center text-gray-500">Customer not found</div>
    }

    const tabs = [
        { id: 'info', name: 'Customer Info', icon: User },
        { id: 'properties', name: `Job Sites (${jobSites?.length || 0})`, icon: Building2 },
        { id: 'contracts', name: `Contracts (${contracts?.length || 0})`, icon: FileText },
        { id: 'jobs', name: `Jobs (${jobs?.length || 0})`, icon: Briefcase },
        { id: 'invoices', name: `Invoices & Quotes (${(invoices?.length || 0) + (quotes?.length || 0)})`, icon: Receipt },
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
                            {customer.business_name || customer.contact_name}
                        </h2>
                        <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                {customer.type === 'business' ? (
                                    <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                        BUSINESS
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                        INDIVIDUAL
                                    </span>
                                )}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                <User className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                                {customer.contact_name}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex md:ml-4 md:mt-0">
                        <a
                            href={`/dashboard/customers/${id}/edit`}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            <Edit className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                            Edit
                        </a>
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
                    <>
                        {/* Business Information */}
                        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                                <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center">
                                    <User className="mr-2 h-5 w-5 text-blue-500" />
                                    Business Information
                                </h3>
                            </div>
                            <div className="px-4 py-5 sm:p-6">
                                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Customer Number</dt>
                                        <dd className="mt-1 text-sm text-gray-900">CUST-{customer.id.substring(0, 8).toUpperCase()}</dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Business Name</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{customer.business_name || '-'}</dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{customer.contact_name}</dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Email</dt>
                                        <dd className="mt-1 text-sm text-gray-900 flex items-center">
                                            <Mail className="mr-1.5 h-4 w-4 text-gray-400" />
                                            {customer.email || '-'}
                                        </dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Phone</dt>
                                        <dd className="mt-1 text-sm text-gray-900 flex items-center">
                                            <Phone className="mr-1.5 h-4 w-4 text-gray-400" />
                                            {customer.phone || '-'}
                                        </dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Address</dt>
                                        <dd className="mt-1 text-sm text-gray-900 flex items-start">
                                            <MapPin className="mr-1.5 h-4 w-4 text-gray-400 mt-0.5" />
                                            <span>
                                                {customer.address}<br />
                                                {customer.city}, {customer.postal_code}<br />
                                                {customer.country}
                                            </span>
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {/* Engagement Type */}
                        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                                <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center">
                                    <FileText className="mr-2 h-5 w-5 text-orange-500" />
                                    Engagement Type
                                </h3>
                            </div>
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center space-x-3">
                                    <div className={`flex-shrink-0 h-4 w-4 rounded-full ${customer.engagement_type === 'contract' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                    <span className="text-sm font-medium text-gray-900">
                                        {customer.engagement_type === 'contract' ? 'Contract' : 'Pay as you Go'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Information */}
                        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                                <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center">
                                    <Receipt className="mr-2 h-5 w-5 text-blue-500" />
                                    Payment Information
                                </h3>
                            </div>
                            <div className="px-4 py-5 sm:p-6">
                                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Payment Terms</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{customer.payment_terms || 'Net 14 Days'}</dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Reliability Score</dt>
                                        <dd className="mt-1 text-sm text-gray-900">50/10</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'properties' && (
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                        <ul role="list" className="divide-y divide-gray-100">
                            {jobSites?.map((site) => (
                                <li key={site.id} className="flex items-center justify-between gap-x-6 py-5 px-6 hover:bg-gray-50">
                                    <div className="min-w-0">
                                        <div className="flex items-start gap-x-3">
                                            <p className="text-sm font-semibold leading-6 text-gray-900">{site.name}</p>
                                        </div>
                                        <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                            <p className="truncate">{site.address}, {site.city}, {site.postal_code}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-none items-center gap-x-4">
                                        <a href={`/dashboard/job-sites/${site.id}`} className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block">
                                            View
                                        </a>
                                    </div>
                                </li>
                            ))}
                            {(!jobSites || jobSites.length === 0) && (
                                <li className="py-12 text-center text-gray-500">No job sites found.</li>
                            )}
                        </ul>
                    </div>
                )}

                {activeTab === 'contracts' && (
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
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
                                            <p className="truncate">{contract.job_site?.name || 'No Job Site'}</p>
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
                                <li className="py-12 text-center text-gray-500">No contracts found.</li>
                            )}
                        </ul>
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
                                            <p className="truncate">{job.job_sites?.name || 'No Job Site'}</p>
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
                                <li className="py-12 text-center text-gray-500">No jobs found.</li>
                            )}
                        </ul>
                    </div>
                )}

                {activeTab === 'invoices' && (
                    <div className="space-y-6">
                        {/* Invoices */}
                        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                                <h3 className="text-base font-semibold leading-6 text-gray-900">Invoices</h3>
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
                                <h3 className="text-base font-semibold leading-6 text-gray-900">Quotes</h3>
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
            </div>
        </div>
    )
}

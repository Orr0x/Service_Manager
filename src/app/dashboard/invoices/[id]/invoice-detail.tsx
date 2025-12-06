'use client'

import { api } from '@/trpc/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, MapPin, Calendar, Trash2, Download, Pencil, FileText, Link as LinkIcon } from 'lucide-react'
import { useState } from 'react'

interface InvoiceItem {
    description: string
    quantity: number
    unitPrice: number
    total: number
}

export function InvoiceDetail({ id }: { id: string }) {
    const router = useRouter()
    const { data: invoice, isLoading } = api.invoices.getById.useQuery({ id })
    const [activeTab, setActiveTab] = useState('invoice')

    const deleteInvoice = api.invoices.delete.useMutation({
        onSuccess: () => {
            router.push('/dashboard/invoices')
            router.refresh()
        },
    })

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading invoice details...</div>
    }

    if (!invoice) {
        return <div className="p-8 text-center text-gray-500">Invoice not found</div>
    }

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this invoice?')) {
            deleteInvoice.mutate({ id })
        }
    }

    const items = (typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items) as InvoiceItem[]

    const tabs = [
        { id: 'invoice', name: 'Invoice', icon: FileText },
        { id: 'related', name: 'Related', icon: LinkIcon },
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
                            Invoice #{invoice.invoice_number}
                        </h2>
                        <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${invoice.status === 'paid' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                    invoice.status === 'overdue' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                        invoice.status === 'sent' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                            'bg-gray-50 text-gray-600 ring-gray-500/10'
                                    }`}>
                                    {invoice.status.toUpperCase()}
                                </span>
                                <span className="mx-2 text-gray-300">•</span>
                                <span>Issued {new Date(invoice.issue_date).toLocaleDateString('en-GB')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex md:ml-4 md:mt-0 gap-x-3">
                        <Link
                            href={`/dashboard/invoices/${id}/edit`}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            <Pencil className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Edit
                        </Link>
                        <button
                            type="button"
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            <Download className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Download PDF
                        </button>
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
                {activeTab === 'invoice' && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Main Invoice Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Addresses Section */}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                                    <div className="border-b border-gray-900/5 bg-gray-50 px-4 py-3 sm:px-6">
                                        <h3 className="text-base font-semibold leading-7 text-gray-900">From</h3>
                                    </div>
                                    <div className="px-4 py-5 sm:p-6">
                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                            {invoice.business_address || 'No business address set.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                                    <div className="border-b border-gray-900/5 bg-gray-50 px-4 py-3 sm:px-6">
                                        <h3 className="text-base font-semibold leading-7 text-gray-900">Bill To</h3>
                                    </div>
                                    <div className="px-4 py-5 sm:p-6">
                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                            {invoice.customer_address || 'No customer address set.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                                <div className="border-b border-gray-900/5 bg-gray-50 px-4 py-3 sm:px-6">
                                    <h3 className="text-base font-semibold leading-7 text-gray-900">Invoice Items</h3>
                                </div>
                                <div className="px-4 py-5 sm:p-6">
                                    <table className="min-w-full divide-y divide-gray-300">
                                        <thead>
                                            <tr>
                                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Description</th>
                                                <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Qty</th>
                                                <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Price</th>
                                                <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {items.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">{item.description}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">{item.quantity}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">£{item.unitPrice.toFixed(2)}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-900">£{item.total.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <th scope="row" colSpan={3} className="hidden pl-4 pr-3 pt-6 text-right text-sm font-normal text-gray-500 sm:table-cell sm:pl-0">Total Amount</th>
                                                <th scope="row" className="pl-4 pr-3 pt-6 text-left text-sm font-normal text-gray-500 sm:hidden">Total Amount</th>
                                                <td className="pl-3 pr-4 pt-6 text-right text-sm font-semibold text-gray-900 sm:pr-0">£{Number(invoice.total_amount).toFixed(2)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {invoice.notes && (
                                <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                                    <div className="border-b border-gray-900/5 bg-gray-50 px-4 py-3 sm:px-6">
                                        <h3 className="text-base font-semibold leading-7 text-gray-900">Notes</h3>
                                    </div>
                                    <div className="px-4 py-5 sm:p-6">
                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{invoice.notes}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                                <div className="border-b border-gray-900/5 bg-gray-50 px-4 py-3 sm:px-6">
                                    <h3 className="text-base font-semibold leading-7 text-gray-900">Customer Details</h3>
                                </div>
                                <div className="px-4 py-5 sm:p-6">
                                    <dl className="space-y-4">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Customer</dt>
                                            <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                                <User className="h-4 w-4 text-gray-400" />
                                                <Link href={`/dashboard/customers/${invoice.customer_id}`} className="hover:underline text-blue-600">
                                                    {invoice.customer?.business_name || invoice.customer?.contact_name}
                                                </Link>
                                            </dd>
                                        </div>
                                        {invoice.job_site && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Job Site</dt>
                                                <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                                    <MapPin className="h-4 w-4 text-gray-400" />
                                                    {invoice.job_site.name}
                                                </dd>
                                                <dd className="mt-1 text-xs text-gray-500 ml-6">
                                                    {invoice.job_site.address}
                                                </dd>
                                            </div>
                                        )}
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Dates</dt>
                                            <dd className="mt-1 text-sm text-gray-900 space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Issued:</span>
                                                    <span>{new Date(invoice.issue_date).toLocaleDateString('en-GB')}</span>
                                                </div>
                                                <div className="flex justify-between font-medium">
                                                    <span className="text-gray-500">Due:</span>
                                                    <span>{new Date(invoice.due_date).toLocaleDateString('en-GB')}</span>
                                                </div>
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'related' && (
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                        <div className="border-b border-gray-900/5 bg-gray-50 px-4 py-3 sm:px-6">
                            <h3 className="text-base font-semibold leading-7 text-gray-900">Related Items</h3>
                        </div>
                        <ul role="list" className="divide-y divide-gray-100">
                            {invoice.job && (
                                <li className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
                                    <div className="flex min-w-0 gap-x-4">
                                        <div className="min-w-0 flex-auto">
                                            <p className="text-sm font-semibold leading-6 text-gray-900">
                                                <Link href={`/dashboard/jobs/${invoice.job_id}`}>
                                                    <span className="absolute inset-x-0 -top-px bottom-0" />
                                                    Job: {invoice.job.title}
                                                </Link>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-x-4">
                                        <div className="hidden sm:flex sm:flex-col sm:items-end">
                                            <p className="text-sm leading-6 text-gray-900">View Job</p>
                                        </div>
                                    </div>
                                </li>
                            )}
                            {invoice.quote && (
                                <li className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
                                    <div className="flex min-w-0 gap-x-4">
                                        <div className="min-w-0 flex-auto">
                                            <p className="text-sm font-semibold leading-6 text-gray-900">
                                                <Link href={`/dashboard/quotes/${invoice.quote_id}`}>
                                                    <span className="absolute inset-x-0 -top-px bottom-0" />
                                                    Quote: #{invoice.quote.quote_number}
                                                </Link>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-x-4">
                                        <div className="hidden sm:flex sm:flex-col sm:items-end">
                                            <p className="text-sm leading-6 text-gray-900">View Quote</p>
                                        </div>
                                    </div>
                                </li>
                            )}
                            {!invoice.job && !invoice.quote && (
                                <li className="px-4 py-5 text-sm text-gray-500 sm:px-6">
                                    No related items found.
                                </li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}

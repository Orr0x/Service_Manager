'use client'

import { api } from '@/trpc/react'
import Link from 'next/link'
import { FileText, User, Calendar, DollarSign } from 'lucide-react'
import { useState } from 'react'
import { ViewToggle } from '@/components/common/view-toggle'
import { cn } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'

export function InvoiceList() {
    const [view, setView] = useState<'list' | 'grid'>('list')
    const searchParams = useSearchParams()
    const search = searchParams.get('search') || undefined

    const { data: invoices, isLoading } = api.invoices.getAll.useQuery({ search })

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading invoices...</div>
    }

    if (!invoices || invoices.length === 0) {
        return (
            <div className="p-12 text-center">
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No invoices found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new invoice.</p>
                <div className="mt-6">
                    <Link
                        href="/dashboard/invoices/new"
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        New Invoice
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-4 sm:px-6 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                <h3 className="text-base font-semibold leading-6 text-gray-900">All Invoices</h3>
                <ViewToggle view={view} setView={setView} />
            </div>

            {view === 'list' ? (
                <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                    <ul role="list" className="divide-y divide-gray-100">
                        {invoices.map((invoice) => (
                            <li key={invoice.id} className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
                                <div className="flex min-w-0 gap-x-4">
                                    <div className="h-12 w-12 flex-none rounded-lg bg-gray-50 flex items-center justify-center">
                                        <FileText className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div className="min-w-0 flex-auto">
                                        <p className="text-sm font-semibold leading-6 text-gray-900">
                                            <Link href={`/dashboard/invoices/${invoice.id}`}>
                                                <span className="absolute inset-x-0 -top-px bottom-0" />
                                                Invoice #{invoice.invoice_number}
                                            </Link>
                                        </p>
                                        <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <p className="truncate">
                                                {invoice.customers?.business_name || invoice.customers?.contact_name || 'Unknown Customer'}
                                            </p>
                                            <span className="text-gray-300">|</span>
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span className="truncate">Due {new Date(invoice.due_date).toLocaleDateString('en-GB')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-x-4">
                                    <div className="hidden sm:flex sm:flex-col sm:items-end">
                                        <p className="text-sm leading-6 text-gray-900">£{Number(invoice.total_amount).toFixed(2)}</p>
                                        <div className="mt-1 flex items-center gap-x-1.5 text-xs leading-5 text-gray-500">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${invoice.status === 'paid' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                invoice.status === 'overdue' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                                    invoice.status === 'sent' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                                        'bg-gray-50 text-gray-600 ring-gray-500/10'
                                                }`}>
                                                {invoice.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <svg className="h-5 w-5 flex-none text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.16 8 7.23 4.29a.75.75 0 011.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {invoices.map((invoice) => (
                        <div key={invoice.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-1 flex-col p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                                            <FileText className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold leading-relaxed text-gray-900">
                                                <Link href={`/dashboard/invoices/${invoice.id}`}>
                                                    <span className="absolute inset-0" />
                                                    Invoice #{invoice.invoice_number}
                                                </Link>
                                            </h3>
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${invoice.status === 'paid' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                invoice.status === 'overdue' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                                    invoice.status === 'sent' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                                        'bg-gray-50 text-gray-600 ring-gray-500/10'
                                                }`}>
                                                {invoice.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-col gap-2">
                                    <dl className="flex flex-col gap-1">
                                        <dt className="sr-only">Customer</dt>
                                        <dd className="text-sm text-gray-500 flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-400 shrink-0" />
                                            <span className="truncate">{invoice.customers?.business_name || invoice.customers?.contact_name || 'Unknown Customer'}</span>
                                        </dd>
                                        <dt className="sr-only">Due Date</dt>
                                        <dd className="text-sm text-gray-500 flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                                            <span className="truncate">Due {new Date(invoice.due_date).toLocaleDateString('en-GB')}</span>
                                        </dd>
                                        <dt className="sr-only">Amount</dt>
                                        <dd className="text-sm text-gray-900 font-semibold flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-gray-400 shrink-0" />
                                            <span>£{Number(invoice.total_amount).toFixed(2)}</span>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

import Link from 'next/link'
import { api, HydrateClient } from '@/trpc/server'
import { Plus, Receipt, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import { InvoiceList } from './invoice-list'

export default async function InvoicesPage() {
    void api.invoices.getAll.prefetch()
    const stats = await api.invoices.getDashboardStats()

    return (
        <HydrateClient>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Invoices</h1>
                        <p className="mt-2 text-sm text-gray-700">
                            Manage customer invoicing and payments
                        </p>
                    </div>
                    <Link
                        href="/dashboard/invoices/new"
                        className="inline-flex items-center rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        New Invoice
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total Invoices */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Receipt className="h-6 w-6 text-blue-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">TOTAL INVOICES</dt>
                                        <dd>
                                            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Paid Invoices */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CheckCircle className="h-6 w-6 text-green-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">PAID</dt>
                                        <dd>
                                            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Overdue Invoices */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-6 w-6 text-red-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">OVERDUE</dt>
                                        <dd>
                                            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Draft Invoices */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <FileText className="h-6 w-6 text-gray-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">DRAFT</dt>
                                        <dd>
                                            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        className="block w-full rounded-md border-0 py-3 pl-4 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        placeholder="Search invoices by number or customer..."
                    />
                </div>

                {/* Invoice List */}
                <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                    <InvoiceList />
                </div>
            </div>
        </HydrateClient>
    )
}

'use client'

import { api } from '@/trpc/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, DollarSign, FileText, MapPin, User, Pencil, Trash2, Mail } from 'lucide-react'

interface QuoteItem {
    description: string
    quantity: number
    unitPrice: number
    amount: number
}

export function QuoteDetail({ id }: { id: string }) {
    const router = useRouter()
    const { data: quote, isLoading } = api.quotes.getById.useQuery({ id })
    const deleteQuote = api.quotes.delete.useMutation({
        onSuccess: () => {
            router.push('/dashboard/quotes')
            router.refresh()
        },
    })

    if (isLoading) {
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

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-x-4">
                    <Link
                        href="/dashboard/quotes"
                        className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{quote.title}</h1>
                        <div className="mt-1 flex items-center gap-x-3 text-sm text-gray-500">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${quote.status === 'accepted' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                    quote.status === 'sent' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                        quote.status === 'draft' ? 'bg-gray-50 text-gray-600 ring-gray-500/10' :
                                            'bg-red-50 text-red-700 ring-red-600/10'
                                }`}>
                                {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                            </span>
                            <span>•</span>
                            <span>#{quote.quote_number}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-x-3">
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
                    <button
                        type="button"
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                    >
                        <Mail className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        Send
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Info Card */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                        <div className="border-b border-gray-900/5 bg-gray-50 px-4 py-3 sm:px-6">
                            <h3 className="text-base font-semibold leading-7 text-gray-900">Quote Details</h3>
                        </div>
                        <div className="px-4 py-5 sm:p-6">
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Customer</dt>
                                    <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                        <User className="h-4 w-4 text-gray-400" />
                                        <Link href={`/dashboard/customers/${quote.customer_id}`} className="hover:underline text-blue-600">
                                            {quote.customer?.business_name || quote.customer?.contact_name}
                                        </Link>
                                    </dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Job Site</dt>
                                    <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        {quote.job_site ? (
                                            <Link href={`/dashboard/job-sites/${quote.job_site_id}`} className="hover:underline text-blue-600">
                                                {quote.job_site.name}
                                            </Link>
                                        ) : (
                                            <span className="text-gray-400">N/A</span>
                                        )}
                                    </dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Issued Date</dt>
                                    <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        {quote.issued_date ? new Date(quote.issued_date).toLocaleDateString() : 'N/A'}
                                    </dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Expiry Date</dt>
                                    <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        {quote.expiry_date ? new Date(quote.expiry_date).toLocaleDateString() : 'N/A'}
                                    </dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                                        {quote.description || 'No description provided.'}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                        <div className="border-b border-gray-900/5 bg-gray-50 px-4 py-3 sm:px-6">
                            <h3 className="text-base font-semibold leading-7 text-gray-900">Line Items</h3>
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

                {/* Sidebar / Actions */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Activity / Notes placeholder */}
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                        <div className="border-b border-gray-900/5 bg-gray-50 px-4 py-3 sm:px-6">
                            <h3 className="text-base font-semibold leading-7 text-gray-900">Activity</h3>
                        </div>
                        <div className="px-4 py-5 sm:p-6 text-center text-sm text-gray-500">
                            Quote created on {new Date(quote.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

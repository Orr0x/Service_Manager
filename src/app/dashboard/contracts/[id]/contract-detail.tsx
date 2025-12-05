'use client'

import { api } from '@/trpc/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, DollarSign, FileText, MapPin, User, Pencil, Trash2 } from 'lucide-react'

export function ContractDetail({ id }: { id: string }) {
    const router = useRouter()
    const { data: contract, isLoading } = api.contracts.getById.useQuery({ id })
    const deleteContract = api.contracts.delete.useMutation({
        onSuccess: () => {
            router.push('/dashboard/contracts')
            router.refresh()
        },
    })

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading contract details...</div>
    }

    if (!contract) {
        return <div className="p-8 text-center text-gray-500">Contract not found</div>
    }

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this contract?')) {
            deleteContract.mutate({ id })
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-x-4">
                    <Link
                        href="/dashboard/contracts"
                        className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{contract.name}</h1>
                        <div className="mt-1 flex items-center gap-x-3 text-sm text-gray-500">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${contract.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                    contract.status === 'draft' ? 'bg-gray-50 text-gray-600 ring-gray-500/10' :
                                        'bg-red-50 text-red-700 ring-red-600/10'
                                }`}>
                                {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                            </span>
                            <span>•</span>
                            <span className="capitalize">{contract.type}</span>
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
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Main Info Card */}
                <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <div className="border-b border-gray-900/5 bg-gray-50 px-4 py-3 sm:px-6">
                        <h3 className="text-base font-semibold leading-7 text-gray-900">Contract Information</h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Customer</dt>
                                <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <Link href={`/dashboard/customers/${contract.customer_id}`} className="hover:underline text-blue-600">
                                        {contract.customer?.business_name || contract.customer?.contact_name}
                                    </Link>
                                </dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Job Site</dt>
                                <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    {contract.job_site ? (
                                        <Link href={`/dashboard/job-sites/${contract.job_site_id}`} className="hover:underline text-blue-600">
                                            {contract.job_site.name}
                                        </Link>
                                    ) : (
                                        <span className="text-gray-400">N/A</span>
                                    )}
                                </dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                                <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    {contract.start_date ? new Date(contract.start_date).toLocaleDateString() : 'N/A'}
                                </dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">End Date</dt>
                                <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'N/A'}
                                </dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Value</dt>
                                <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                    <DollarSign className="h-4 w-4 text-gray-400" />
                                    {contract.amount ? `£${contract.amount.toFixed(2)}` : 'N/A'}
                                </dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Billing Frequency</dt>
                                <dd className="mt-1 text-sm text-gray-900 capitalize">
                                    {contract.billing_frequency || 'N/A'}
                                </dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-sm font-medium text-gray-500">Description</dt>
                                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                                    {contract.description || 'No description provided.'}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Placeholder for related items (Invoices, Jobs, etc.) */}
                <div className="space-y-6">
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                        <div className="border-b border-gray-900/5 bg-gray-50 px-4 py-3 sm:px-6">
                            <h3 className="text-base font-semibold leading-7 text-gray-900">Recent Activity</h3>
                        </div>
                        <div className="px-4 py-5 sm:p-6 text-center text-sm text-gray-500">
                            No recent activity for this contract.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

'use client'

import { api } from '@/trpc/react'
import Link from 'next/link'
import { Building2, FileText, Phone, Mail } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export function CustomerList() {
    const searchParams = useSearchParams()
    const search = searchParams.get('search') || undefined

    const { data: customers, isLoading } = api.customers.getAll.useQuery({ search })

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading customers...</div>
    }

    if (!customers || customers.length === 0) {
        return (
            <div className="p-12 text-center">
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No customers</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new customer.</p>
                <div className="mt-6">
                    <Link
                        href="/dashboard/customers/new"
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        Add Customer
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <ul role="list" className="divide-y divide-gray-100">
            {customers.map((customer) => (
                <li key={customer.id} className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
                    <div className="flex min-w-0 gap-x-4">
                        <div className="min-w-0 flex-auto">
                            <p className="text-sm font-semibold leading-6 text-gray-900">
                                <Link href={`/dashboard/customers/${customer.id}`}>
                                    <span className="absolute inset-x-0 -top-px bottom-0" />
                                    {customer.business_name || customer.contact_name}
                                </Link>
                                {customer.type === 'business' && (
                                    <span className="ml-2 inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                        BUSINESS
                                    </span>
                                )}
                                {customer.type === 'individual' && (
                                    <span className="ml-2 inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                        INDIVIDUAL
                                    </span>
                                )}
                            </p>
                            <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                <p className="truncate">{customer.contact_name}</p>
                                {customer.email && (
                                    <>
                                        <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                                            <circle cx={1} cy={1} r={1} />
                                        </svg>
                                        <p className="truncate">{customer.email}</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-x-4">
                        <div className="hidden sm:flex sm:flex-col sm:items-end">
                            <div className="flex items-center gap-x-1.5 text-xs leading-5 text-gray-500">
                                <Building2 className="h-4 w-4 text-gray-400" />
                                <span>0 Properties</span>
                            </div>
                            <div className="mt-1 flex items-center gap-x-1.5 text-xs leading-5 text-gray-500">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <span>Net 14</span>
                            </div>
                        </div>
                        <svg className="h-5 w-5 flex-none text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.16 8 7.23 4.29a.75.75 0 011.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                    </div>
                </li>
            ))}
        </ul>
    )
}

'use client'

import { api } from '@/trpc/react'
import Link from 'next/link'
import { Building2, User, Phone, Mail } from 'lucide-react'

import { useSearchParams } from 'next/navigation'

export function ContractorList() {
    const searchParams = useSearchParams()
    const search = searchParams.get('search') || undefined

    const { data: contractors, isLoading } = api.contractors.getAll.useQuery({ search })

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading contractors...</div>
    }

    if (!contractors || contractors.length === 0) {
        return (
            <div className="p-12 text-center">
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No contractors found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding your first external partner.</p>
                <div className="mt-6">
                    <Link
                        href="/dashboard/contractors/new"
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        Add Contractor
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <ul role="list" className="divide-y divide-gray-100">
            {contractors.map((contractor) => (
                <li key={contractor.id} className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
                    <div className="flex min-w-0 gap-x-4">
                        <div className="h-12 w-12 flex-none rounded-lg bg-gray-50 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="min-w-0 flex-auto">
                            <p className="text-sm font-semibold leading-6 text-gray-900">
                                <Link href={`/dashboard/contractors/${contractor.id}`}>
                                    <span className="absolute inset-x-0 -top-px bottom-0" />
                                    {contractor.company_name}
                                </Link>
                            </p>
                            <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                <User className="h-4 w-4 text-gray-400" />
                                <p className="truncate">{contractor.contact_name}</p>
                                {contractor.email && (
                                    <>
                                        <span className="text-gray-300">|</span>
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <span className="truncate">{contractor.email}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-x-4">
                        <div className="hidden sm:flex sm:flex-col sm:items-end">
                            <div className="flex items-center gap-x-1.5 text-xs leading-5 text-gray-500">
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${contractor.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                    contractor.status === 'blacklisted' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                        'bg-gray-50 text-gray-600 ring-gray-500/10'
                                    }`}>
                                    {contractor.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                </span>
                            </div>
                            {contractor.phone && (
                                <div className="mt-1 flex items-center gap-x-1.5 text-xs leading-5 text-gray-500">
                                    <Phone className="h-3 w-3 text-gray-400" />
                                    {contractor.phone}
                                </div>
                            )}
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

'use client'

import { api } from '@/trpc/react'
import Link from 'next/link'
import { Building2, MapPin, User } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export function JobSiteList() {
    const searchParams = useSearchParams()
    const search = searchParams.get('search') || undefined

    const { data: jobSites, isLoading } = api.jobSites.getAll.useQuery({ search })

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading job sites...</div>
    }

    if (!jobSites || jobSites.length === 0) {
        return (
            <div className="p-12 text-center">
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No job sites</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new job site.</p>
                <div className="mt-6">
                    <Link
                        href="/dashboard/job-sites/new"
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        Add Job Site
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <ul role="list" className="divide-y divide-gray-100">
            {jobSites.map((site) => (
                <li key={site.id} className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
                    <div className="flex min-w-0 gap-x-4">
                        <div className="min-w-0 flex-auto">
                            <p className="text-sm font-semibold leading-6 text-gray-900">
                                <Link href={`/dashboard/job-sites/${site.id}`}>
                                    <span className="absolute inset-x-0 -top-px bottom-0" />
                                    {site.name}
                                </Link>
                            </p>
                            <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <p className="truncate">{site.address}, {site.city}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-x-4">
                        <div className="hidden sm:flex sm:flex-col sm:items-end">
                            <div className="flex items-center gap-x-1.5 text-xs leading-5 text-gray-500">
                                <User className="h-4 w-4 text-gray-400" />
                                <span>{site.customer?.business_name || site.customer?.contact_name}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-x-1.5 text-xs leading-5 text-gray-500">
                                <Building2 className="h-4 w-4 text-gray-400" />
                                <span>Active</span>
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

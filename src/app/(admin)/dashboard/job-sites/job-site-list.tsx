'use client'

import { api } from '@/trpc/react'
import Link from 'next/link'
import { Building2, Edit, MapPin, User } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useMobileDefaultView } from '@/hooks/use-mobile-default-view'
import { ViewToggle } from '@/components/common/view-toggle'
import { JobSiteMapPreview } from '@/components/job-site-location-summary'
import { DataViewControls } from '@/components/common/data-view-controls'
import { compareValues, groupRows, includesSearch } from '@/lib/data-view'

export function JobSiteList() {
    const searchParams = useSearchParams()
    const search = searchParams.get('search') || undefined
    const dashboard = searchParams.get('dashboard') === 'range' ? 'range' : undefined
    const range = searchParams.get('range') || undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const [refineSearch, setRefineSearch] = useState('')
    const [sortBy, setSortBy] = useState('name')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const [groupBy, setGroupBy] = useState('none')

    const { data: jobSites, isLoading } = api.jobSites.getAll.useQuery({ search, dashboard, range: range as any, startDate, endDate })
    const [view, setView] = useMobileDefaultView()

    const visibleSites = useMemo(() => {
        return [...(jobSites || [])]
            .filter((site) => includesSearch([
                site.name,
                site.address,
                site.city,
                site.state,
                site.postal_code,
                site.customer?.business_name,
                site.customer?.contact_name,
            ], refineSearch))
            .sort((a, b) => compareValues(getSiteSortValue(a, sortBy), getSiteSortValue(b, sortBy), sortDirection))
    }, [jobSites, refineSearch, sortBy, sortDirection])

    const groupedSites = useMemo(() => groupRows(visibleSites, groupBy, getSiteGroup), [visibleSites, groupBy])

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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-4 shadow-sm ring-1 ring-gray-900/5 sm:px-6 sm:rounded-xl">
                <div>
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                        {dashboard === 'range' ? `Dashboard Job Sites (${visibleSites.length})` : `All Job Sites (${visibleSites.length})`}
                    </h3>
                    {dashboard === 'range' && (
                        <Link href="/dashboard/job-sites" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                            Clear dashboard filter
                        </Link>
                    )}
                </div>
                <ViewToggle view={view} setView={setView} />
            </div>

            <DataViewControls
                search={refineSearch}
                onSearchChange={setRefineSearch}
                searchPlaceholder="Refine sites by name, address, city, or customer..."
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOptions={[
                    { value: 'name', label: 'Site name' },
                    { value: 'customer', label: 'Customer' },
                    { value: 'city', label: 'City' },
                    { value: 'address', label: 'Address' },
                ]}
                sortDirection={sortDirection}
                onSortDirectionChange={setSortDirection}
                groupBy={groupBy}
                onGroupByChange={setGroupBy}
                groupOptions={[
                    { value: 'none', label: 'No grouping' },
                    { value: 'customer', label: 'Customer' },
                    { value: 'city', label: 'City' },
                    { value: 'status', label: 'Status' },
                ]}
                onReset={() => {
                    setRefineSearch('')
                    setSortBy('name')
                    setSortDirection('asc')
                    setGroupBy('none')
                }}
            />

            {visibleSites.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                    No job sites match the current filters.
                </div>
            )}

            {view === 'list' ? (
                <div className="space-y-4">
                    {groupedSites.map((group) => (
                        <div key={group.key} className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                            {groupBy !== 'none' && <GroupHeader label={group.label} count={group.rows.length} />}
                            <ul role="list" className="divide-y divide-gray-100">
                                {group.rows.map((site) => (
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
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {groupedSites.map((group) => (
                        <section key={group.key} className="space-y-3">
                            {groupBy !== 'none' && <GroupHeader label={group.label} count={group.rows.length} />}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {group.rows.map((site) => (
                                    <div key={site.id} className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                            <Link
                                href={`/dashboard/job-sites/${site.id}/edit`}
                                className="block p-3 pb-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                aria-label={`Edit ${site.name} location`}
                            >
                                <JobSiteMapPreview
                                    latitude={site.latitude}
                                    longitude={site.longitude}
                                    rangeMeters={site.location_radius_meters}
                                />
                            </Link>
                            <div className="flex flex-1 flex-col p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                                            <Building2 className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold leading-relaxed text-gray-900">
                                                <Link href={`/dashboard/job-sites/${site.id}`}>
                                                    {site.name}
                                                </Link>
                                            </h3>
                                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-col gap-2">
                                    <dl className="flex flex-col gap-1">
                                        <dt className="sr-only">Address</dt>
                                        <dd className="text-sm text-gray-500 flex items-start gap-2">
                                            <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                                            <span className="truncate">{site.address}, {site.city}</span>
                                        </dd>
                                        <dt className="sr-only">Customer</dt>
                                        <dd className="text-sm text-gray-500 flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-400 shrink-0" />
                                            <span className="truncate">{site.customer?.business_name || site.customer?.contact_name}</span>
                                        </dd>
                                    </dl>
                                </div>
                                <div className="mt-5 grid grid-cols-2 gap-2">
                                    <Link
                                        href={`/dashboard/job-sites/${site.id}`}
                                        className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                    >
                                        View
                                    </Link>
                                    <Link
                                        href={`/dashboard/job-sites/${site.id}/edit`}
                                        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                                    >
                                        <Edit className="mr-1.5 h-4 w-4" />
                                        Edit
                                    </Link>
                                </div>
                            </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    )
}

function getSiteSortValue(site: any, sortBy: string) {
    switch (sortBy) {
        case 'customer':
            return site.customer?.business_name || site.customer?.contact_name
        case 'city':
            return site.city
        case 'address':
            return site.address
        case 'name':
        default:
            return site.name
    }
}

function getSiteGroup(site: any, groupBy: string) {
    switch (groupBy) {
        case 'customer': {
            const label = site.customer?.business_name || site.customer?.contact_name || 'No customer'
            return { key: label, label }
        }
        case 'city': {
            const label = site.city || 'No city'
            return { key: label, label }
        }
        case 'status': {
            const label = site.is_active === false ? 'Inactive' : 'Active'
            return { key: label, label }
        }
        default:
            return { key: 'all', label: 'All job sites' }
    }
}

function GroupHeader({ label, count }: { label: string; count: number }) {
    return (
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2 text-sm">
            <h4 className="font-semibold text-gray-900">{label}</h4>
            <span className="text-xs font-medium text-gray-500">{count} sites</span>
        </div>
    )
}

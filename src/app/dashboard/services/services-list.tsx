'use client'

import { api } from '@/trpc/react'

import { useSearchParams } from 'next/navigation'
import { DollarSign, Clock, Wrench } from 'lucide-react'
import { useState } from 'react'
import { ViewToggle } from '@/components/common/view-toggle'
import { cn } from '@/lib/utils'

export function ServicesList() {
    const searchParams = useSearchParams()
    const search = searchParams.get('search') || undefined

    const { data: services, isLoading } = api.services.getAll.useQuery({ search })

    const [view, setView] = useState<'list' | 'grid'>('list')

    if (isLoading) {
        return <div className="py-4 text-center">Loading services...</div>
    }

    if (!services || services.length === 0) {
        return (
            <div className="py-10 text-center text-sm text-gray-500">
                No services found. Click "Add service" to create one.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-4 sm:px-6 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                <h3 className="text-base font-semibold leading-6 text-gray-900">All Services</h3>
                <ViewToggle view={view} setView={setView} />
            </div>

            {view === 'list' ? (
                <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                    <ul role="list" className="divide-y divide-gray-100">
                        {services.map((service) => (
                            <li key={service.id} className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
                                <div className="flex min-w-0 gap-x-4">
                                    {service.image_url && (
                                        <img
                                            src={service.image_url}
                                            alt=""
                                            className="h-12 w-12 flex-none rounded-md bg-gray-50 object-cover"
                                        />
                                    )}
                                    <div className="min-w-0 flex-auto">
                                        <p className="text-sm font-semibold leading-6 text-gray-900">
                                            <a href={`/dashboard/services/${service.id}`}>
                                                <span className="absolute inset-x-0 -top-px bottom-0" />
                                                {service.name}
                                            </a>
                                            <span className="ml-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                {service.category}
                                            </span>
                                        </p>
                                        <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                            <p className="truncate">{service.description || 'No description'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-x-4">
                                    <div className="hidden sm:flex sm:flex-col sm:items-end">
                                        <div className="flex items-center gap-x-1.5 text-xs leading-5 text-gray-500">
                                            <DollarSign className="h-4 w-4 text-gray-400" />
                                            <span>
                                                {service.unit_of_measure
                                                    ? `$${service.base_price} / ${service.unit_of_measure}`
                                                    : `$${service.base_price}`
                                                }
                                            </span>
                                        </div>
                                        <div className="mt-1 flex items-center gap-x-1.5 text-xs leading-5 text-gray-500">
                                            <Clock className="h-4 w-4 text-gray-400" />
                                            <span>{service.duration_minutes} min</span>
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
                    {services.map((service) => (
                        <div key={service.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="aspect-h-3 aspect-w-4 bg-gray-200 sm:aspect-none sm:h-48">
                                {service.image_url ? (
                                    <img
                                        src={service.image_url}
                                        alt={service.name}
                                        className="h-full w-full object-cover object-center sm:h-full sm:w-full"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                                        <Wrench className="h-12 w-12" />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-1 flex-col p-4">
                                <h3 className="text-base font-semibold text-gray-900">
                                    <a href={`/dashboard/services/${service.id}`}>
                                        <span className="absolute inset-0" />
                                        {service.name}
                                    </a>
                                </h3>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                        {service.category}
                                    </span>
                                </div>
                                <p className="mt-2 flex-1 text-sm text-gray-500 line-clamp-2">
                                    {service.description || 'No description available.'}
                                </p>
                                <div className="mt-4 flex items-center justify-between text-sm font-medium text-gray-900">
                                    <div className="flex items-center text-gray-500">
                                        <Clock className="mr-1.5 h-4 w-4 text-gray-400" />
                                        {service.duration_minutes} min
                                    </div>
                                    <div className="flex items-center text-blue-600 font-bold">
                                        {service.unit_of_measure
                                            ? `$${service.base_price} / ${service.unit_of_measure}`
                                            : `$${service.base_price}`
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

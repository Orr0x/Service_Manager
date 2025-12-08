'use client'

import { api } from '@/trpc/react'

import { useSearchParams } from 'next/navigation'
import { DollarSign, Clock } from 'lucide-react'

export function ServicesList() {
    const searchParams = useSearchParams()
    const search = searchParams.get('search') || undefined

    const { data: services, isLoading } = api.services.getAll.useQuery({ search })

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
        <ul role="list" className="divide-y divide-gray-100">
            {services.map((service) => (
                <li key={service.id} className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
                    <div className="flex min-w-0 gap-x-4">
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
    )
}

'use client'

import { api } from '@/trpc/react'

import { useSearchParams } from 'next/navigation'

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
        <table className="min-w-full divide-y divide-gray-300">
            <thead>
                <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                        Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Category
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Price
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Duration
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                        <span className="sr-only">Edit</span>
                    </th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {services.map((service) => (
                    <tr key={service.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                            {service.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{service.category}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${service.base_price}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{service.duration_minutes} min</td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                            <a href={`/dashboard/services/${service.id}`} className="text-indigo-600 hover:text-indigo-900">
                                Edit<span className="sr-only">, {service.name}</span>
                            </a>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

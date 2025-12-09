'use client'

import Link from 'next/link'

import { api } from '@/trpc/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
    Wrench,
    Edit,
    ArrowLeft,
    Clock,
    DollarSign,
    MapPin,
    Tag,
    Activity,
    ImageIcon,
    Download
} from 'lucide-react'
import { ActivityFeed } from '@/components/common/activity-feed'

export function ServiceDetail({ id }: { id: string }) {
    const router = useRouter()
    const { data: service, isLoading } = api.services.getById.useQuery({ id })
    const [activeTab, setActiveTab] = useState('overview')

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading service details...</div>
    }

    if (!service) {
        return <div className="p-8 text-center text-gray-500">Service not found</div>
    }

    const tabs: { id: string; name: string; icon: React.ElementType }[] = [
        { id: 'overview', name: 'Overview', icon: Wrench },
        { id: 'activity', name: 'Activity', icon: Activity },
    ]

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <div>
                <a
                    href="/dashboard/services"
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back
                </a>
            </div>

            {/* Header */}
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                <div className="md:flex md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                            {service.name}
                        </h2>
                        <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                    {service.category}
                                </span>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                <DollarSign className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                                {service.unit_of_measure
                                    ? `$${service.base_price} / ${service.unit_of_measure}`
                                    : `$${service.base_price}`
                                }
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                <Clock className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                                {service.duration_minutes} min
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex md:ml-4 md:mt-0 gap-x-3">
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            <Download className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Download PDF
                        </button>
                        <Link
                            href={`/dashboard/services/${id}/edit`}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            <Edit className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                            Edit
                        </Link>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-8 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                  ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
                  group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium
                `}
                            >
                                <tab.icon
                                    className={`
                    ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                    -ml-0.5 mr-2 h-5 w-5
                  `}
                                    aria-hidden="true"
                                />
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            <div id="printable-content" className="space-y-6">
                {activeTab === 'overview' && (
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                        <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                            <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center">
                                <Wrench className="mr-2 h-5 w-5 text-blue-500" />
                                Service Details
                            </h3>
                        </div>
                        <div className="px-4 py-5 sm:p-6">
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{service.description || 'No description provided.'}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{service.category}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Coverage Area</dt>
                                    <dd className="mt-1 text-sm text-gray-900 flex items-start">
                                        <MapPin className="mr-1.5 h-4 w-4 text-gray-400 mt-0.5" />
                                        <span>{service.coverage_area || 'Universal / All Areas'}</span>
                                    </dd>
                                </div>
                                {service.image_url && (
                                    <div className="sm:col-span-2">
                                        <dt className="text-sm font-medium text-gray-500 mb-2">Service Photo</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            <img
                                                src={service.image_url}
                                                alt={service.name}
                                                className="h-48 w-full object-cover rounded-lg sm:w-96"
                                            />
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                        <h3 className="text-base font-semibold leading-6 text-gray-900 mb-6">Recent Activity</h3>
                        <ActivityFeed entityType="service" entityId={id} />
                    </div>
                )}
            </div>
        </div>
    )
}

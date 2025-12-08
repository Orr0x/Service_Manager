'use client'

import { api } from '@/trpc/react'
import Link from 'next/link'
import { User, Mail, Phone, Briefcase } from 'lucide-react'
import { useState } from 'react'
import { ViewToggle } from '@/components/common/view-toggle'
import { cn } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'

export function WorkerList() {
    const [view, setView] = useState<'list' | 'grid'>('list')
    const searchParams = useSearchParams()
    const search = searchParams.get('search') || undefined

    const { data: workers, isLoading } = api.workers.getAll.useQuery({ search })

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading workers...</div>
    }

    if (!workers || workers.length === 0) {
        return (
            <div className="p-12 text-center">
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No workers found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding your first team member.</p>
                <div className="mt-6">
                    <Link
                        href="/dashboard/workers/new"
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        Add Worker
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-4 sm:px-6 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                <h3 className="text-base font-semibold leading-6 text-gray-900">All Workers</h3>
                <ViewToggle view={view} setView={setView} />
            </div>

            {view === 'list' ? (
                <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                    <ul role="list" className="divide-y divide-gray-100">
                        {workers.map((worker) => (
                            <li key={worker.id} className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
                                <div className="flex min-w-0 gap-x-4">
                                    <div className="h-12 w-12 flex-none rounded-full bg-gray-50 flex items-center justify-center">
                                        <User className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div className="min-w-0 flex-auto">
                                        <p className="text-sm font-semibold leading-6 text-gray-900">
                                            <Link href={`/dashboard/workers/${worker.id}`}>
                                                <span className="absolute inset-x-0 -top-px bottom-0" />
                                                {worker.first_name} {worker.last_name}
                                            </Link>
                                        </p>
                                        <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                            <Briefcase className="h-4 w-4 text-gray-400" />
                                            <p className="truncate">{worker.role}</p>
                                            {worker.email && (
                                                <>
                                                    <span className="text-gray-300">|</span>
                                                    <Mail className="h-4 w-4 text-gray-400" />
                                                    <span className="truncate">{worker.email}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-x-4">
                                    <div className="hidden sm:flex sm:flex-col sm:items-end">
                                        <div className="flex items-center gap-x-1.5 text-xs leading-5 text-gray-500">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${worker.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                worker.status === 'on_leave' ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' :
                                                    'bg-gray-50 text-gray-600 ring-gray-500/10'
                                                }`}>
                                                {worker.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                            </span>
                                        </div>
                                        {worker.phone && (
                                            <div className="mt-1 flex items-center gap-x-1.5 text-xs leading-5 text-gray-500">
                                                <Phone className="h-3 w-3 text-gray-400" />
                                                {worker.phone}
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
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {workers.map((worker) => (
                        <div key={worker.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-1 flex-col p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                                            <User className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold leading-relaxed text-gray-900">
                                                <Link href={`/dashboard/workers/${worker.id}`}>
                                                    <span className="absolute inset-0" />
                                                    {worker.first_name} {worker.last_name}
                                                </Link>
                                            </h3>
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${worker.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                worker.status === 'on_leave' ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' :
                                                    'bg-gray-50 text-gray-600 ring-gray-500/10'
                                                }`}>
                                                {worker.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-col gap-2">
                                    <dl className="flex flex-col gap-1">
                                        <dt className="sr-only">Role</dt>
                                        <dd className="text-sm text-gray-500 flex items-center gap-2">
                                            <Briefcase className="h-4 w-4 text-gray-400 shrink-0" />
                                            <span className="truncate">{worker.role}</span>
                                        </dd>
                                        {worker.email && (
                                            <>
                                                <dt className="sr-only">Email</dt>
                                                <dd className="text-sm text-gray-500 flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                                                    <span className="truncate">{worker.email}</span>
                                                </dd>
                                            </>
                                        )}
                                        {worker.phone && (
                                            <>
                                                <dt className="sr-only">Phone</dt>
                                                <dd className="text-sm text-gray-500 flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                                                    <span className="truncate">{worker.phone}</span>
                                                </dd>
                                            </>
                                        )}
                                    </dl>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

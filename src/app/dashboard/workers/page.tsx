import Link from 'next/link'
import { api, HydrateClient } from '@/trpc/server'
import { Plus } from 'lucide-react'
import { WorkerList } from './worker-list'

export default async function WorkersPage() {
    void api.workers.getAll.prefetch()

    return (
        <HydrateClient>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Internal Workers</h1>
                        <p className="mt-2 text-sm text-gray-700">
                            Manage your staff, technicians, and internal team members
                        </p>
                    </div>
                    <Link
                        href="/dashboard/workers/new"
                        className="inline-flex items-center rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        Add Worker
                    </Link>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        className="block w-full rounded-md border-0 py-3 pl-4 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        placeholder="Search workers by name, role, or email..."
                    />
                </div>

                {/* Worker List */}
                <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                    <WorkerList />
                </div>
            </div>
        </HydrateClient>
    )
}

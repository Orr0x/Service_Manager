import Link from 'next/link'
import { api, HydrateClient } from '@/trpc/server'
import { Plus, ClipboardList, CheckSquare, ListTodo, List } from 'lucide-react'
import { ChecklistList } from './checklist-list'
import { SearchInput } from '@/components/common/search-input'

export default async function ChecklistsPage() {
    await api.checklists.getAll.prefetch()
    const stats = await api.checklists.getDashboardStats()

    return (
        <HydrateClient>
            <div className="space-y-5 sm:space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">Checklists</h1>
                        <p className="mt-2 text-sm text-gray-700">
                            Manage standard operating procedures and task lists
                        </p>
                    </div>
                    <Link
                        href="/dashboard/checklists/new"
                        className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto"
                    >
                        <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        New Checklist
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    {/* Total Templates */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="p-4 sm:p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <ClipboardList className="h-6 w-6 text-blue-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">TEMPLATES</dt>
                                        <dd>
                                            <div className="text-2xl font-bold text-blue-600">{stats.templates}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Completed Checklists */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="p-4 sm:p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CheckSquare className="h-6 w-6 text-green-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">COMPLETED</dt>
                                        <dd>
                                            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Checklists */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="p-4 sm:p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <ListTodo className="h-6 w-6 text-yellow-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">ACTIVE</dt>
                                        <dd>
                                            <div className="text-2xl font-bold text-yellow-600">{stats.active}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Items */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="p-4 sm:p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <List className="h-6 w-6 text-purple-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">TOTAL ITEMS</dt>
                                        <dd>
                                            <div className="text-2xl font-bold text-purple-600">{stats.totalItems}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <SearchInput placeholder="Search checklists by name..." />

                {/* Checklist List */}
                {/* Checklist List */}
                <ChecklistList />
            </div>
        </HydrateClient>
    )
}

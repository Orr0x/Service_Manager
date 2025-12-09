import Link from 'next/link'
import { api, HydrateClient } from '@/trpc/server'
import { Plus, FileText, CheckCircle, AlertCircle, File } from 'lucide-react'
import { ContractList } from './contract-list'
import { SearchInput } from '@/components/common/search-input'

export default async function ContractsPage() {
    await api.contracts.getAll.prefetch()
    const stats = await api.contracts.getDashboardStats()

    return (
        <HydrateClient>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Contracts</h1>
                        <p className="mt-2 text-sm text-gray-700">
                            Manage service agreements and recurring work
                        </p>
                    </div>
                    <Link
                        href="/dashboard/contracts/new"
                        className="inline-flex items-center rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        New Contract
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total Contracts */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <FileText className="h-6 w-6 text-blue-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">TOTAL CONTRACTS</dt>
                                        <dd>
                                            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Contracts */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CheckCircle className="h-6 w-6 text-green-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">ACTIVE</dt>
                                        <dd>
                                            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expired Contracts */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-6 w-6 text-red-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">EXPIRED</dt>
                                        <dd>
                                            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Draft Contracts */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <File className="h-6 w-6 text-gray-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">DRAFT</dt>
                                        <dd>
                                            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <SearchInput placeholder="Search contracts by name, customer, or type..." />

                {/* Contract List */}
                {/* Contract List */}
                <ContractList />
            </div>
        </HydrateClient>
    )
}

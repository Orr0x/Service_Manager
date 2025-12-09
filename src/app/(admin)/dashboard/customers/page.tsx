import Link from 'next/link'
import { api, HydrateClient } from '@/trpc/server'
import { Users, FileText, Building2, Plus, Briefcase } from 'lucide-react'
import { CustomerList } from './customer-list'
import { SearchInput } from '@/components/common/search-input'

export default async function CustomersPage() {
    await api.customers.getAll.prefetch()
    const stats = await api.customers.getDashboardStats()

    return (
        <HydrateClient>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Customers</h1>
                        <p className="mt-2 text-sm text-gray-700">
                            Manage your customer relationships and contracts
                        </p>
                    </div>
                    <Link
                        href="/dashboard/customers/new"
                        className="inline-flex items-center rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        Add Customer
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total Customers */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Users className="h-6 w-6 text-blue-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">TOTAL CUSTOMERS</dt>
                                        <dd>
                                            <div className="text-2xl font-bold text-blue-600">{stats.customers}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

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
                                            <div className="text-2xl font-bold text-blue-600">{stats.contracts}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Sites */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Building2 className="h-6 w-6 text-blue-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">TOTAL SITES</dt>
                                        <dd>
                                            <div className="text-2xl font-bold text-blue-600">{stats.sites}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Jobs */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Briefcase className="h-6 w-6 text-blue-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">TOTAL JOBS</dt>
                                        <dd>
                                            <div className="text-2xl font-bold text-blue-600">{stats.jobs}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <SearchInput placeholder="Search customers by name, email, or phone..." />

                {/* Customer List */}
                {/* Customer List */}
                <CustomerList />
            </div>
        </HydrateClient>
    )
}

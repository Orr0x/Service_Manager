import Link from 'next/link'
import { api, HydrateClient } from '@/trpc/server'
import { Plus } from 'lucide-react'
import { ContractList } from './contract-list'

export default async function ContractsPage() {
    void api.contracts.getAll.prefetch()

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

                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        className="block w-full rounded-md border-0 py-3 pl-4 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        placeholder="Search contracts by name, customer, or type..."
                    />
                </div>

                {/* Contract List */}
                <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                    <ContractList />
                </div>
            </div>
        </HydrateClient>
    )
}

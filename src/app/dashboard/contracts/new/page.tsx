'use client'

import { useRouter } from 'next/navigation'
import { api } from '@/trpc/react'
import { useState } from 'react'
import Link from 'next/link'

export default function NewContractPage() {
    const router = useRouter()
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')

    const { data: customers, isLoading: isLoadingCustomers } = api.customers.getAll.useQuery()

    // Fetch job sites only when a customer is selected
    const { data: jobSites, isLoading: isLoadingJobSites } = api.jobSites.getByCustomerId.useQuery(
        { customerId: selectedCustomerId },
        { enabled: !!selectedCustomerId }
    )

    const createContract = api.contracts.create.useMutation({
        onSuccess: () => {
            router.push('/dashboard/contracts')
            router.refresh()
        },
    })

    async function onSubmit(formData: FormData) {
        const customerId = formData.get('customerId') as string
        const jobSiteId = formData.get('jobSiteId') as string
        const name = formData.get('name') as string
        const type = formData.get('type') as string
        const status = formData.get('status') as string
        const startDate = formData.get('startDate') as string
        const endDate = formData.get('endDate') as string
        const amountStr = formData.get('amount') as string
        const billingFrequency = formData.get('billingFrequency') as string
        const description = formData.get('description') as string

        createContract.mutate({
            customerId,
            jobSiteId: jobSiteId || undefined,
            name,
            type,
            status,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            amount: amountStr ? parseFloat(amountStr) : undefined,
            billingFrequency: billingFrequency || undefined,
            description: description || undefined,
        })
    }

    if (isLoadingCustomers) {
        return <div className="p-8 text-center text-gray-500">Loading customers...</div>
    }

    if (!customers || customers.length === 0) {
        return (
            <div className="p-12 text-center">
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No customers found</h3>
                <p className="mt-1 text-sm text-gray-500">You need to create a customer before adding a contract.</p>
                <div className="mt-6">
                    <Link
                        href="/dashboard/customers/new"
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        Create Customer
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        New Contract
                    </h2>
                </div>
            </div>

            <form action={onSubmit} className="mt-8 space-y-8">
                {createContract.error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Error creating contract: {createContract.error.message}
                                </h3>
                            </div>
                        </div>
                    </div>
                )}

                {/* Contract Details */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900">Contract Details</h3>
                        <p className="mt-1 text-sm leading-6 text-gray-600">General information about the agreement.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                            <label htmlFor="customerId" className="block text-sm font-medium leading-6 text-gray-900">
                                Customer <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <select
                                    id="customerId"
                                    name="customerId"
                                    required
                                    value={selectedCustomerId}
                                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:max-w-xs sm:text-sm sm:leading-6"
                                >
                                    <option value="">Select a customer</option>
                                    {customers.map((customer) => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.business_name || customer.contact_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="jobSiteId" className="block text-sm font-medium leading-6 text-gray-900">
                                Job Site
                            </label>
                            <div className="mt-2">
                                <select
                                    id="jobSiteId"
                                    name="jobSiteId"
                                    disabled={!selectedCustomerId || isLoadingJobSites}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:max-w-xs sm:text-sm sm:leading-6 disabled:bg-gray-100 disabled:text-gray-500"
                                >
                                    <option value="">Select a job site (optional)</option>
                                    {jobSites?.map((site) => (
                                        <option key={site.id} value={site.id}>
                                            {site.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="sm:col-span-4">
                            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                                Contract Name <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    required
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="e.g., Annual Office Cleaning 2025"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="type" className="block text-sm font-medium leading-6 text-gray-900">
                                Type <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <select
                                    id="type"
                                    name="type"
                                    required
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:max-w-xs sm:text-sm sm:leading-6"
                                >
                                    <option value="cleaning">Cleaning</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="security">Security</option>
                                    <option value="landscaping">Landscaping</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="status" className="block text-sm font-medium leading-6 text-gray-900">
                                Status <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <select
                                    id="status"
                                    name="status"
                                    required
                                    defaultValue="draft"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:max-w-xs sm:text-sm sm:leading-6"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="active">Active</option>
                                    <option value="expired">Expired</option>
                                    <option value="terminated">Terminated</option>
                                </select>
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="startDate" className="block text-sm font-medium leading-6 text-gray-900">
                                Start Date
                            </label>
                            <div className="mt-2">
                                <input
                                    type="date"
                                    name="startDate"
                                    id="startDate"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="endDate" className="block text-sm font-medium leading-6 text-gray-900">
                                End Date
                            </label>
                            <div className="mt-2">
                                <input
                                    type="date"
                                    name="endDate"
                                    id="endDate"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="amount" className="block text-sm font-medium leading-6 text-gray-900">
                                Value
                            </label>
                            <div className="mt-2 relative rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="text-gray-500 sm:text-sm">£</span>
                                </div>
                                <input
                                    type="number"
                                    name="amount"
                                    id="amount"
                                    step="0.01"
                                    className="block w-full rounded-md border-0 py-1.5 pl-7 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="billingFrequency" className="block text-sm font-medium leading-6 text-gray-900">
                                Billing Frequency
                            </label>
                            <div className="mt-2">
                                <select
                                    id="billingFrequency"
                                    name="billingFrequency"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:max-w-xs sm:text-sm sm:leading-6"
                                >
                                    <option value="">Select frequency</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="annually">Annually</option>
                                    <option value="one_off">One-off</option>
                                </select>
                            </div>
                        </div>

                        <div className="col-span-full">
                            <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
                                Description
                            </label>
                            <div className="mt-2">
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={3}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    defaultValue={''}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 pt-8">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="text-sm font-semibold leading-6 text-gray-900"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={createContract.isPending}
                        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                    >
                        {createContract.isPending ? 'Creating...' : 'Create Contract'}
                    </button>
                </div>
            </form>
        </div>
    )
}

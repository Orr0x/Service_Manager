'use client'

import { useRouter } from 'next/navigation'
import { api } from '@/trpc/react'
import { useState } from 'react'

interface EditContractFormProps {
    contract: {
        id: string
        name: string
        type: string
        status: string
        start_date: string | null
        end_date: string | null
        amount: number | null
        billing_frequency: string | null
        description: string | null
    }
}

export function EditContractForm({ contract }: EditContractFormProps) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    const updateContract = api.contracts.update.useMutation({
        onSuccess: () => {
            router.push(`/dashboard/contracts/${contract.id}`)
            router.refresh()
        },
        onError: (e) => {
            setError(e.message)
        },
    })

    async function onSubmit(formData: FormData) {
        const name = formData.get('name') as string
        const type = formData.get('type') as string
        const status = formData.get('status') as string
        const startDate = formData.get('startDate') as string
        const endDate = formData.get('endDate') as string
        const amount = parseFloat(formData.get('amount') as string)
        const billingFrequency = formData.get('billingFrequency') as string
        const description = formData.get('description') as string

        updateContract.mutate({
            id: contract.id,
            name,
            type,
            status,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            amount: isNaN(amount) ? undefined : amount,
            billingFrequency: billingFrequency || undefined,
            description: description || undefined,
        })
    }

    return (
        <form action={onSubmit} className="space-y-8">
            {error && (
                <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                Error updating contract: {error}
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <div>
                    <h3 className="text-base font-semibold leading-7 text-gray-900">Contract Information</h3>
                    <p className="mt-1 text-sm leading-6 text-gray-600">Update the details for this contract.</p>
                </div>

                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
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
                                defaultValue={contract.name}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="type" className="block text-sm font-medium leading-6 text-gray-900">
                            Type <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                            <select
                                id="type"
                                name="type"
                                required
                                defaultValue={contract.type}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:max-w-xs sm:text-sm sm:leading-6"
                            >
                                <option value="Maintenance">Maintenance</option>
                                <option value="Installation">Installation</option>
                                <option value="Repair">Repair</option>
                                <option value="Service">Service</option>
                                <option value="Cleaning">Cleaning</option>
                            </select>
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="status" className="block text-sm font-medium leading-6 text-gray-900">
                            Status <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                            <select
                                id="status"
                                name="status"
                                required
                                defaultValue={contract.status}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:max-w-xs sm:text-sm sm:leading-6"
                            >
                                <option value="Draft">Draft</option>
                                <option value="Active">Active</option>
                                <option value="Expired">Expired</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="startDate" className="block text-sm font-medium leading-6 text-gray-900">
                            Start Date
                        </label>
                        <div className="mt-2">
                            <input
                                type="date"
                                name="startDate"
                                id="startDate"
                                defaultValue={contract.start_date ? new Date(contract.start_date).toISOString().split('T')[0] : ''}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="endDate" className="block text-sm font-medium leading-6 text-gray-900">
                            End Date
                        </label>
                        <div className="mt-2">
                            <input
                                type="date"
                                name="endDate"
                                id="endDate"
                                defaultValue={contract.end_date ? new Date(contract.end_date).toISOString().split('T')[0] : ''}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
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
                                defaultValue={contract.amount || ''}
                                className="block w-full rounded-md border-0 py-1.5 pl-7 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="billingFrequency" className="block text-sm font-medium leading-6 text-gray-900">
                            Billing Frequency
                        </label>
                        <div className="mt-2">
                            <select
                                id="billingFrequency"
                                name="billingFrequency"
                                defaultValue={contract.billing_frequency || ''}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:max-w-xs sm:text-sm sm:leading-6"
                            >
                                <option value="">Select frequency</option>
                                <option value="Monthly">Monthly</option>
                                <option value="Quarterly">Quarterly</option>
                                <option value="Annually">Annually</option>
                                <option value="One-off">One-off</option>
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
                                defaultValue={contract.description || ''}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
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
                    disabled={updateContract.isPending}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                >
                    {updateContract.isPending ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    )
}

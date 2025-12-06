'use client'

import { useRouter } from 'next/navigation'
import { api } from '@/trpc/react'
import { useState } from 'react'

interface EditJobSiteFormProps {
    jobSite: {
        id: string
        name: string
        address: string
        city: string | null
        state: string | null
        postal_code: string | null
        country: string | null
        is_active: boolean | null
        customer_id: string
    }
}

export function EditJobSiteForm({ jobSite }: EditJobSiteFormProps) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    const updateJobSite = api.jobSites.update.useMutation({
        onSuccess: () => {
            router.push(`/dashboard/job-sites/${jobSite.id}`)
            router.refresh()
        },
        onError: (e) => {
            setError(e.message)
        },
    })

    async function onSubmit(formData: FormData) {
        const name = formData.get('name') as string
        const address = formData.get('address') as string
        const city = formData.get('city') as string
        const postalCode = formData.get('postalCode') as string
        const country = formData.get('country') as string
        const isActive = formData.get('isActive') === 'on'

        updateJobSite.mutate({
            id: jobSite.id,
            name,
            address,
            city,
            postalCode,
            country,
            isActive,
        })
    }

    return (
        <form action={onSubmit} className="space-y-8">
            {error && (
                <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                Error updating job site: {error}
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <div>
                    <h3 className="text-base font-semibold leading-7 text-gray-900">Site Information</h3>
                    <p className="mt-1 text-sm leading-6 text-gray-600">Update the details for this job site.</p>
                </div>

                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                        <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                            Site Name <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="name"
                                id="name"
                                required
                                defaultValue={jobSite.name}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div className="col-span-full">
                        <label htmlFor="address" className="block text-sm font-medium leading-6 text-gray-900">
                            Address <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="address"
                                id="address"
                                required
                                defaultValue={jobSite.address}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2 sm:col-start-1">
                        <label htmlFor="city" className="block text-sm font-medium leading-6 text-gray-900">
                            City
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="city"
                                id="city"
                                defaultValue={jobSite.city || ''}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="postalCode" className="block text-sm font-medium leading-6 text-gray-900">
                            Postcode
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="postalCode"
                                id="postalCode"
                                defaultValue={jobSite.postal_code || ''}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="country" className="block text-sm font-medium leading-6 text-gray-900">
                            Country
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="country"
                                id="country"
                                defaultValue={jobSite.country || 'United Kingdom'}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-4">
                        <div className="flex items-start">
                            <div className="flex h-6 items-center">
                                <input
                                    id="isActive"
                                    name="isActive"
                                    type="checkbox"
                                    defaultChecked={jobSite.is_active ?? true}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                />
                            </div>
                            <div className="ml-3 text-sm leading-6">
                                <label htmlFor="isActive" className="font-medium text-gray-900">
                                    Active
                                </label>
                                <p className="text-gray-500">Inactive job sites will not appear in some lists.</p>
                            </div>
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
                    disabled={updateJobSite.isPending}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                >
                    {updateJobSite.isPending ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    )
}

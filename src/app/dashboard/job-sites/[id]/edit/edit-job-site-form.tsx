'use client'

import { useRouter } from 'next/navigation'
import { api } from '@/trpc/react'
import { useState } from 'react'
import { FileUploader } from '@/components/file-uploader'

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
        latitude: number | null
        longitude: number | null
        what3words: string | null
        access_instructions: string | null
        security_codes: string | null
        key_holder: string | null
        facilities: string | null
        site_type: string | null
        parking_info: string | null
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

        // New fields
        const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : undefined
        const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : undefined
        const what3words = formData.get('what3words') as string
        const accessInstructions = formData.get('accessInstructions') as string
        const securityCodes = formData.get('securityCodes') as string
        const keyHolder = formData.get('keyHolder') as string
        const facilities = formData.get('facilities') as string
        const siteType = formData.get('siteType') as string
        const parkingInfo = formData.get('parkingInfo') as string

        updateJobSite.mutate({
            id: jobSite.id,
            name,
            address,
            city,
            postalCode,
            country,
            isActive,
            latitude,
            longitude,
            what3words,
            accessInstructions,
            securityCodes,
            keyHolder,
            facilities,
            siteType,
            parkingInfo,
        })
    }

    return (
        <div className="space-y-8">
            {/* Photo Upload Section */}
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                <div>
                    <h3 className="text-base font-semibold leading-7 text-gray-900">Job Site Photos</h3>
                    <p className="mt-1 text-sm leading-6 text-gray-600">Add more photos to this job site.</p>
                </div>
                <div className="mt-4">
                    <FileUploader
                        entityType="job_site"
                        entityId={jobSite.id}
                        onUploadComplete={() => {
                            // Optional: notification
                        }}
                    />
                </div>
            </div>

            <form action={onSubmit} className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                {error && (
                    <div className="rounded-md bg-red-50 p-4 mb-6">
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

                        <div className="sm:col-span-2">
                            <label htmlFor="siteType" className="block text-sm font-medium leading-6 text-gray-900">
                                Site Type
                            </label>
                            <div className="mt-2">
                                <select
                                    id="siteType"
                                    name="siteType"
                                    defaultValue={jobSite.site_type || ''}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:max-w-xs sm:text-sm sm:leading-6"
                                >
                                    <option value="">Select a type</option>
                                    <option value="Office">Office</option>
                                    <option value="House">House</option>
                                    <option value="Bungalow">Bungalow</option>
                                    <option value="Lodge">Lodge</option>
                                    <option value="Cabin">Cabin</option>
                                    <option value="Public Building">Public Building</option>
                                    <option value="Warehouse">Warehouse</option>
                                    <option value="Retail Store">Retail Store</option>
                                    <option value="School">School</option>
                                    <option value="Hospital">Hospital</option>
                                    <option value="Other">Other</option>
                                </select>
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

                {/* Geolocation Section */}
                <div className="mt-8 pt-8 border-t border-gray-900/10">
                    <h3 className="text-base font-semibold leading-7 text-gray-900">Geolocation</h3>
                    <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <div className="sm:col-span-2">
                            <label htmlFor="latitude" className="block text-sm font-medium leading-6 text-gray-900">
                                Latitude
                            </label>
                            <div className="mt-2">
                                <input
                                    type="number"
                                    step="any"
                                    name="latitude"
                                    id="latitude"
                                    defaultValue={jobSite.latitude || ''}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="longitude" className="block text-sm font-medium leading-6 text-gray-900">
                                Longitude
                            </label>
                            <div className="mt-2">
                                <input
                                    type="number"
                                    step="any"
                                    name="longitude"
                                    id="longitude"
                                    defaultValue={jobSite.longitude || ''}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="what3words" className="block text-sm font-medium leading-6 text-gray-900">
                                What3Words
                            </label>
                            <div className="mt-2">
                                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-600 sm:max-w-md">
                                    <span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">///</span>
                                    <input
                                        type="text"
                                        name="what3words"
                                        id="what3words"
                                        defaultValue={jobSite.what3words || ''}
                                        className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                                        placeholder="word.word.word"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Access & Facilities Section */}
                <div className="mt-8 pt-8 border-t border-gray-900/10">
                    <h3 className="text-base font-semibold leading-7 text-gray-900">Access & Facilities</h3>
                    <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <div className="col-span-full">
                            <label htmlFor="accessInstructions" className="block text-sm font-medium leading-6 text-gray-900">
                                Access Instructions
                            </label>
                            <div className="mt-2">
                                <textarea
                                    id="accessInstructions"
                                    name="accessInstructions"
                                    rows={3}
                                    defaultValue={jobSite.access_instructions || ''}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="securityCodes" className="block text-sm font-medium leading-6 text-gray-900">
                                Security Codes
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="securityCodes"
                                    id="securityCodes"
                                    defaultValue={jobSite.security_codes || ''}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="keyHolder" className="block text-sm font-medium leading-6 text-gray-900">
                                Key Holder
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="keyHolder"
                                    id="keyHolder"
                                    defaultValue={jobSite.key_holder || ''}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div className="col-span-full">
                            <label htmlFor="parkingInfo" className="block text-sm font-medium leading-6 text-gray-900">
                                Parking Information
                            </label>
                            <div className="mt-2">
                                <textarea
                                    id="parkingInfo"
                                    name="parkingInfo"
                                    rows={3}
                                    defaultValue={jobSite.parking_info || ''}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="e.g., Free parking on street, or use driveway."
                                />
                            </div>
                        </div>

                        <div className="col-span-full">
                            <label htmlFor="facilities" className="block text-sm font-medium leading-6 text-gray-900">
                                Facilities
                            </label>
                            <div className="mt-2">
                                <textarea
                                    id="facilities"
                                    name="facilities"
                                    rows={3}
                                    defaultValue={jobSite.facilities || ''}
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
                        disabled={updateJobSite.isPending}
                        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                    >
                        {updateJobSite.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}

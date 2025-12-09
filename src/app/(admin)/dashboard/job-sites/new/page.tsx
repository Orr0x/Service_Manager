'use client'

import { useRouter } from 'next/navigation'
import { api } from '@/trpc/react'
import { useState } from 'react'
import Link from 'next/link'
import { FileUploader } from '@/components/file-uploader'
import { useEffect } from 'react'

export default function NewJobSitePage() {
    const router = useRouter()
    const { data: customers, isLoading: isLoadingCustomers } = api.customers.getAll.useQuery()
    const [siteId, setSiteId] = useState<string>('')

    useEffect(() => {
        setSiteId(crypto.randomUUID())
    }, [])

    const { data: settings } = api.settings.getSettings.useQuery()
    const terminology = (settings?.terminology as Record<string, string>) || {}
    const getLabel = (key: string, defaultLabel: string) => terminology[key] || defaultLabel

    const createJobSite = api.jobSites.create.useMutation({
        onSuccess: () => {
            router.push('/dashboard/job-sites')
            router.refresh()
        },
    })

    async function onSubmit(formData: FormData) {
        const customerId = formData.get('customerId') as string
        const name = formData.get('name') as string
        const address = formData.get('address') as string
        const city = formData.get('city') as string
        const postalCode = formData.get('postalCode') as string
        const country = formData.get('country') as string

        const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : undefined
        const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : undefined
        const what3words = formData.get('what3words') as string
        const accessInstructions = formData.get('accessInstructions') as string
        const securityCodes = formData.get('securityCodes') as string
        const keyHolder = formData.get('keyHolder') as string
        const facilities = formData.get('facilities') as string
        const siteType = formData.get('siteType') as string
        const parkingInfo = formData.get('parkingInfo') as string

        createJobSite.mutate({
            id: siteId,
            customerId,
            name,
            address,
            city,
            postalCode,
            country,
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

    if (isLoadingCustomers) {
        return <div className="p-8 text-center text-gray-500">Loading customers...</div>
    }

    if (!customers || customers.length === 0) {
        return (
            <div className="p-12 text-center">
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No customers found</h3>
                <p className="mt-1 text-sm text-gray-500">You need to create a customer before adding a job site.</p>
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
                        Add Job Site
                    </h2>
                </div>
            </div>

            <form action={onSubmit} className="mt-8 space-y-8">
                {createJobSite.error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Error creating job site: {createJobSite.error.message}
                                </h3>
                            </div>
                        </div>
                    </div>
                )}

                {/* Image Upload */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900">Job Site Photos</h3>
                        <p className="mt-1 text-sm leading-6 text-gray-600">Upload photos of the site. You can do this now or later.</p>
                    </div>

                    <div className="rounded-lg border border-dashed border-gray-900/25 p-6">
                        {siteId && (
                            <FileUploader
                                entityType="job_site"
                                entityId={siteId}
                                onUploadComplete={() => {
                                    // Optional: Show a success message or refresh a list if we were displaying one
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Site Information */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900">Site Information</h3>
                        <p className="mt-1 text-sm leading-6 text-gray-600">Details about the job location.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <div className="sm:col-span-4">
                            <label htmlFor="customerId" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('job_sites.customerId', 'Customer')} <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <select
                                    id="customerId"
                                    name="customerId"
                                    required
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

                        <div className="sm:col-span-4">
                            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('job_sites.name', 'Site Name')} <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    required
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="e.g., Main Office"
                                />
                            </div>
                        </div>

                        <div className="col-span-full">
                            <label htmlFor="address" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('job_sites.address', 'Address')} <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="address"
                                    id="address"
                                    required
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="e.g., 123 High Street"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-2 sm:col-start-1">
                            <label htmlFor="siteType" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('job_sites.siteType', 'Site Type')}
                            </label>
                            <div className="mt-2">
                                <select
                                    id="siteType"
                                    name="siteType"
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

                        <div className="sm:col-span-2">
                            <label htmlFor="city" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('job_sites.city', 'City')}
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="city"
                                    id="city"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="e.g., London"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="postalCode" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('job_sites.postalCode', 'Postcode')}
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="postalCode"
                                    id="postalCode"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="e.g., SW1A 1AA"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="country" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('job_sites.country', 'Country')}
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="country"
                                    id="country"
                                    defaultValue="United Kingdom"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                    </div>
                </div>


                {/* Geolocation */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900">Geolocation</h3>
                        <p className="mt-1 text-sm leading-6 text-gray-600">Precise location details for rural sites.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <div className="sm:col-span-2">
                            <label htmlFor="latitude" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('job_sites.latitude', 'Latitude')}
                            </label>
                            <div className="mt-2">
                                <input
                                    type="number"
                                    step="any"
                                    name="latitude"
                                    id="latitude"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="e.g., 51.5074"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="longitude" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('job_sites.longitude', 'Longitude')}
                            </label>
                            <div className="mt-2">
                                <input
                                    type="number"
                                    step="any"
                                    name="longitude"
                                    id="longitude"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="e.g., -0.1278"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="what3words" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('job_sites.what3words', 'What3Words')}
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="what3words"
                                    id="what3words"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="e.g., ///filled.count.soap"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Access & Facilities */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900">Access & Facilities</h3>
                        <p className="mt-1 text-sm leading-6 text-gray-600">Important information for accessing the site.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <div className="col-span-full">
                            <label htmlFor="accessInstructions" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('job_sites.accessInstructions', 'Access Instructions')}
                            </label>
                            <div className="mt-2">
                                <textarea
                                    id="accessInstructions"
                                    name="accessInstructions"
                                    rows={3}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="e.g., Use side gate, beware of dog."
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="securityCodes" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('job_sites.securityCodes', 'Security Codes')}
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="securityCodes"
                                    id="securityCodes"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="e.g., Gate: 1234, Alarm: 5678"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="keyHolder" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('job_sites.keyHolder', 'Key Holder')}
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="keyHolder"
                                    id="keyHolder"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="e.g., John Smith (07700 900000)"
                                />
                            </div>
                        </div>

                        <div className="col-span-full">
                            <label htmlFor="parkingInfo" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('job_sites.parkingInfo', 'Parking Information')}
                            </label>
                            <div className="mt-2">
                                <textarea
                                    id="parkingInfo"
                                    name="parkingInfo"
                                    rows={3}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="e.g., Free parking on street, or use driveway."
                                />
                            </div>
                        </div>

                        <div className="col-span-full">
                            <label htmlFor="facilities" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('job_sites.facilities', 'Facilities')}
                            </label>
                            <div className="mt-2">
                                <textarea
                                    id="facilities"
                                    name="facilities"
                                    rows={3}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="e.g., Kitchen, Toilets, Parking..."
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
                        disabled={createJobSite.isPending}
                        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                    >
                        {createJobSite.isPending ? 'Creating...' : 'Create Job Site'}
                    </button>
                </div>
            </form>
        </div>
    )
}

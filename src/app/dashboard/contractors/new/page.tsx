'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/trpc/react'
import { FileUploader } from '@/components/file-uploader'

export default function NewContractorPage() {
    const router = useRouter()

    const createContractor = api.contractors.create.useMutation({
        onSuccess: () => {
            router.push('/dashboard/contractors')
            router.refresh()
        },
    })

    // Generate a temporary ID for file uploads (or just use undefined if uploader handles it, 
    // but better to have one if we want to link immediately. 
    // However, for simplified flow, we upload to a bucket and just get URL)
    // Actually FileUploader just returns URL, entityId is for folder structure.
    // Let's generate one.
    const [tempId] = useState(() => crypto.randomUUID())
    const [profilePictureUrl, setProfilePictureUrl] = useState<string | undefined>()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        const companyName = formData.get('companyName') as string
        const contactName = formData.get('contactName') as string
        const email = formData.get('email') as string
        const phone = formData.get('phone') as string
        const specialtiesStr = formData.get('specialties') as string
        const status = formData.get('status') as string

        const specialties = specialtiesStr ? specialtiesStr.split(',').map(s => s.trim()).filter(s => s !== '') : []

        const areaPostcode = formData.get('area-postcode') as string
        const areaRadius = formData.get('area-radius') ? parseInt(formData.get('area-radius') as string) : undefined
        const hasOwnTransport = formData.get('transport') === 'on'
        const licenses = formData.get('licenses') as string

        createContractor.mutate({
            companyName,
            contactName,
            email: email || undefined, // Keep original logic for optional email
            phone: phone || undefined, // Keep original logic for optional phone
            status,
            specialties,
            profilePictureUrl,
            areaPostcode: areaPostcode || undefined,
            areaRadius,
            hasOwnTransport,
            licenses: licenses || undefined,
        })
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Add External Contractor
                    </h2>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-8">
                {createContractor.error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Error creating contractor: {createContractor.error.message}
                                </h3>
                            </div>
                        </div>
                    </div>
                )}

                {/* Contractor Details */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900">Company Information</h3>
                        <p className="mt-1 text-sm leading-6 text-gray-600">Details about the external service provider.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <div className="col-span-full">
                            <label htmlFor="companyName" className="block text-sm font-medium leading-6 text-gray-900">
                                Company Name <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="companyName"
                                    id="companyName"
                                    required
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="contactName" className="block text-sm font-medium leading-6 text-gray-900">
                                Contact Person <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="contactName"
                                    id="contactName"
                                    required
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
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
                                    defaultValue="active"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:max-w-xs sm:text-sm sm:leading-6"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="blacklisted">Blacklisted</option>
                                </select>
                            </div>
                        </div>

                        {/* Additional Details */}
                        <div className="col-span-full">
                            <h3 className="text-base font-semibold leading-7 text-gray-900">Additional Details</h3>
                            <p className="mt-1 text-sm leading-6 text-gray-600">Provide more information about the contractor.</p>
                        </div>

                        <div className="col-span-full">
                            <label htmlFor="profile-photo" className="block text-sm font-medium leading-6 text-gray-900">
                                Profile Picture
                            </label>
                            <div className="mt-2 flex items-center gap-x-3">
                                <FileUploader
                                    entityType="contractor_profile"
                                    entityId={tempId}
                                    bucketName="avatars"
                                    label="Upload Photo"
                                    onUploadComplete={(url) => setProfilePictureUrl(url)}
                                />
                                {profilePictureUrl && (
                                    <img src={profilePictureUrl} alt="Profile Preview" className="h-12 w-12 rounded-full object-cover" />
                                )}
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="area-postcode" className="block text-sm font-medium leading-6 text-gray-900">
                                Area Covered (Postcode)
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="area-postcode"
                                    id="area-postcode"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="area-radius" className="block text-sm font-medium leading-6 text-gray-900">
                                Area Radius (Miles)
                            </label>
                            <div className="mt-2">
                                <input
                                    type="number"
                                    name="area-radius"
                                    id="area-radius"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div className="col-span-full">
                            <div className="relative flex gap-x-3">
                                <div className="flex h-6 items-center">
                                    <input
                                        id="transport"
                                        name="transport"
                                        type="checkbox"
                                        defaultChecked={true}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                    />
                                </div>
                                <div className="text-sm leading-6">
                                    <label htmlFor="transport" className="font-medium text-gray-900">
                                        Has Own Transport
                                    </label>
                                    <p className="text-gray-500">Contractor has their own vehicle for jobs.</p>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-full">
                            <label htmlFor="licenses" className="block text-sm font-medium leading-6 text-gray-900">
                                Licenses & Certifications
                            </label>
                            <div className="mt-2">
                                <textarea
                                    id="licenses"
                                    name="licenses"
                                    rows={3}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="List licenses (e.g., CSCS, Gas Safe)..."
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                                Email Address
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="phone" className="block text-sm font-medium leading-6 text-gray-900">
                                Phone Number
                            </label>
                            <div className="mt-2">
                                <input
                                    type="tel"
                                    name="phone"
                                    id="phone"
                                    autoComplete="tel"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div className="col-span-full">
                            <label htmlFor="specialties" className="block text-sm font-medium leading-6 text-gray-900">
                                Specialties
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="specialties"
                                    id="specialties"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="e.g. HVAC, Roofing, Plumbing (comma separated)"
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
                        disabled={createContractor.isPending}
                        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                    >
                        {createContractor.isPending ? 'Adding Contractor...' : 'Add Contractor'}
                    </button>
                </div>
            </form>
        </div>
    )
}

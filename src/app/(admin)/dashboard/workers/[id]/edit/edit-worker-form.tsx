'use client'

import { useRouter } from 'next/navigation'
import { api } from '@/trpc/react'
import { useState } from 'react'
import { FileUploader } from '@/components/file-uploader'
import { AttachmentsSection } from '@/components/attachments-section'

interface EditWorkerFormProps {
    worker: {
        id: string
        first_name: string
        last_name: string
        email: string | null
        phone: string | null
        role: string
        skills: any
        hourly_rate: number | null
        status: string
        profile_picture_url: string | null
        area_postcode: string | null
        area_radius: number | null
        has_own_transport: boolean | null
        licenses: string | null
    }
}

export function EditWorkerForm({ worker }: EditWorkerFormProps) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    const updateWorker = api.workers.update.useMutation({
        onSuccess: () => {
            router.push(`/dashboard/workers/${worker.id}`)
            router.refresh()
        },
        onError: (e) => {
            setError(e.message)
        },
    })

    async function onSubmit(formData: FormData) {
        const firstName = formData.get('firstName') as string
        const lastName = formData.get('lastName') as string
        const email = formData.get('email') as string
        const phone = formData.get('phone') as string
        const role = formData.get('role') as string
        const skillsStr = formData.get('skills') as string
        const hourlyRateStr = formData.get('hourlyRate') as string
        const status = formData.get('status') as string

        const areaPostcode = formData.get('areaPostcode') as string
        const areaRadiusStr = formData.get('areaRadius') as string
        const hasOwnTransport = formData.get('hasOwnTransport') === 'on'
        const licenses = formData.get('licenses') as string

        const skills = skillsStr ? skillsStr.split(',').map(s => s.trim()).filter(s => s !== '') : []

        updateWorker.mutate({
            id: worker.id,
            firstName,
            lastName,
            email: email || undefined,
            phone: phone || undefined,
            role,
            skills,
            hourlyRate: hourlyRateStr ? parseFloat(hourlyRateStr) : undefined,
            status,
            areaPostcode,
            areaRadius: areaRadiusStr ? parseInt(areaRadiusStr) : undefined,
            hasOwnTransport,
            licenses,
            profilePictureUrl: worker.profile_picture_url || undefined // Preserve unless changed via other means (not implemented in this form directly, handled by FileUploader + Attachments logic usually, or we can add a specific field if we want to set URL manually, but user wants upload)
        })
    }

    // Parse skills to string for input
    const skillsString = Array.isArray(worker.skills)
        ? (worker.skills as string[]).join(', ')
        : typeof worker.skills === 'string'
            ? JSON.parse(worker.skills as string).join(', ')
            : ''

    return (
        <div className="space-y-8">
            <form action={onSubmit} className="space-y-8">
                {error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Error updating worker: {error}
                                </h3>
                            </div>
                        </div>
                    </div>
                )}

                {/* Worker Details */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900">Personal Information</h3>
                        <p className="mt-1 text-sm leading-6 text-gray-600">Basic details about the team member.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                            <label htmlFor="firstName" className="block text-sm font-medium leading-6 text-gray-900">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="firstName"
                                    id="firstName"
                                    required
                                    defaultValue={worker.first_name}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="lastName" className="block text-sm font-medium leading-6 text-gray-900">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="lastName"
                                    id="lastName"
                                    required
                                    defaultValue={worker.last_name}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-4">
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                                Email Address
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    defaultValue={worker.email || ''}
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
                                    defaultValue={worker.phone || ''}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Area & Transport */}
                <div className="space-y-6 border-t border-gray-900/10 pt-8">
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900">Area & Transport</h3>
                        <p className="mt-1 text-sm leading-6 text-gray-600">Coverage area and transport details.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <div className="sm:col-span-2">
                            <label htmlFor="areaPostcode" className="block text-sm font-medium leading-6 text-gray-900">
                                Area Postcode
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="areaPostcode"
                                    id="areaPostcode"
                                    defaultValue={worker.area_postcode || ''}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="e.g. SW1A"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="areaRadius" className="block text-sm font-medium leading-6 text-gray-900">
                                Radius (Miles)
                            </label>
                            <div className="mt-2">
                                <input
                                    type="number"
                                    name="areaRadius"
                                    id="areaRadius"
                                    defaultValue={worker.area_radius || ''}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="10"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-4">
                            <div className="flex items-start">
                                <div className="flex h-6 items-center">
                                    <input
                                        id="hasOwnTransport"
                                        name="hasOwnTransport"
                                        type="checkbox"
                                        defaultChecked={worker.has_own_transport || false}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                    />
                                </div>
                                <div className="ml-3 text-sm leading-6">
                                    <label htmlFor="hasOwnTransport" className="font-medium text-gray-900">
                                        Has Own Transport
                                    </label>
                                    <p className="text-gray-500">Worker has their own vehicle for travel.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Role & Skills */}
                <div className="space-y-6 border-t border-gray-900/10 pt-8">
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900">Role & Skills</h3>
                        <p className="mt-1 text-sm leading-6 text-gray-600">Job details and qualifications.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                            <label htmlFor="role" className="block text-sm font-medium leading-6 text-gray-900">
                                Role <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <select
                                    id="role"
                                    name="role"
                                    required
                                    defaultValue={worker.role}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:max-w-xs sm:text-sm sm:leading-6"
                                >
                                    <option value="Technician">Technician</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Support">Support</option>
                                    <option value="Sales">Sales</option>
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
                                    defaultValue={worker.status}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:max-w-xs sm:text-sm sm:leading-6"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="on_leave">On Leave</option>
                                </select>
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="hourlyRate" className="block text-sm font-medium leading-6 text-gray-900">
                                Hourly Rate
                            </label>
                            <div className="mt-2 relative rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="text-gray-500 sm:text-sm">£</span>
                                </div>
                                <input
                                    type="number"
                                    name="hourlyRate"
                                    id="hourlyRate"
                                    step="0.01"
                                    defaultValue={worker.hourly_rate || ''}
                                    className="block w-full rounded-md border-0 py-1.5 pl-7 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="col-span-full">
                            <label htmlFor="skills" className="block text-sm font-medium leading-6 text-gray-900">
                                Skills
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="skills"
                                    id="skills"
                                    defaultValue={skillsString}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="e.g. Plumbing, Electrical, Cleaning (comma separated)"
                                />
                            </div>
                        </div>

                        <div className="col-span-full">
                            <label htmlFor="licenses" className="block text-sm font-medium leading-6 text-gray-900">
                                Licenses & Certifications (Text)
                            </label>
                            <div className="mt-2">
                                <textarea
                                    name="licenses"
                                    id="licenses"
                                    rows={3}
                                    defaultValue={worker.licenses || ''}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="List any relevant licenses or certifications details..."
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
                        disabled={updateWorker.isPending}
                        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                    >
                        {updateWorker.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>

            <div className="border-t border-gray-900/10 pt-8">
                <h3 className="text-base font-semibold leading-7 text-gray-900 mb-6">Documents & Photos</h3>

                <div className="space-y-8">
                    {/* Profile Picture Upload */}
                    <div>
                        <h4 className="text-sm font-medium leading-6 text-gray-900 mb-2">Profile Picture</h4>
                        <FileUploader
                            entityType="worker_profile"
                            entityId={worker.id}
                            onUploadComplete={() => {
                                // Potentially update the profile_picture_url field automatically?
                                // For now, we just rely on attachments. 
                                // To act completely "picture-like", we might want to ensure only 1 exists or overwrite.
                                router.refresh()
                            }}
                        />
                        <div className="mt-4">
                            <AttachmentsSection entityType="worker_profile" entityId={worker.id} />
                        </div>
                    </div>

                    {/* General Documents Upload */}
                    <div>
                        <h4 className="text-sm font-medium leading-6 text-gray-900 mb-2">Certifications & Documents</h4>
                        <FileUploader
                            entityType="worker_document"
                            entityId={worker.id}
                            onUploadComplete={() => router.refresh()}
                        />
                        <div className="mt-4">
                            <AttachmentsSection entityType="worker_document" entityId={worker.id} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

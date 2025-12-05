'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import { api } from '@/trpc/react'

export default function NewServicePage() {
    const router = useRouter()
    const createService = api.services.create.useMutation({
        onSuccess: () => {
            router.push('/dashboard/services')
            router.refresh()
        },
    })

    async function onSubmit(formData: FormData) {
        const name = formData.get('name') as string
        const category = formData.get('category') as string
        const basePrice = parseFloat(formData.get('basePrice') as string)
        const durationMinutes = parseInt(formData.get('durationMinutes') as string)
        const description = formData.get('description') as string

        createService.mutate({
            name,
            category,
            basePrice,
            durationMinutes,
            description,
        })
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Add New Service
                    </h2>
                </div>
            </div>

            <form action={onSubmit} className="mt-8 space-y-6">
                {createService.error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Error creating service: {createService.error.message}
                                </h3>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                        <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                            Service Name
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="name"
                                id="name"
                                required
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="category" className="block text-sm font-medium leading-6 text-gray-900">
                            Category
                        </label>
                        <div className="mt-2">
                            <select
                                id="category"
                                name="category"
                                required
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
                            >
                                <option value="">Select a category</option>
                                <option value="Cleaning">Cleaning</option>
                                <option value="Plumbing">Plumbing</option>
                                <option value="Electrical">Electrical</option>
                                <option value="HVAC">HVAC</option>
                                <option value="Landscaping">Landscaping</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="basePrice" className="block text-sm font-medium leading-6 text-gray-900">
                            Base Price ($)
                        </label>
                        <div className="mt-2">
                            <input
                                type="number"
                                name="basePrice"
                                id="basePrice"
                                min="0"
                                step="0.01"
                                required
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="durationMinutes" className="block text-sm font-medium leading-6 text-gray-900">
                            Duration (minutes)
                        </label>
                        <div className="mt-2">
                            <input
                                type="number"
                                name="durationMinutes"
                                id="durationMinutes"
                                min="1"
                                required
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
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
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-x-6">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="text-sm font-semibold leading-6 text-gray-900"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={createService.isPending}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                    >
                        {createService.isPending ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    )
}

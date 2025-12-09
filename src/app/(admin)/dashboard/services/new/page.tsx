'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { api } from '@/trpc/react'
import { createClient } from '@/utils/supabase/client'
import { Upload } from 'lucide-react'

export default function NewServicePage() {
    const router = useRouter()
    const supabase = createClient()
    const [isUploading, setIsUploading] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState('')
    const [customCategory, setCustomCategory] = useState('')

    const createService = api.services.create.useMutation({
        onSuccess: () => {
            router.push('/dashboard/services')
            router.refresh()
        },
    })

    const { data: settings } = api.settings.getSettings.useQuery()
    const terminology = (settings?.terminology as Record<string, string>) || {}
    const getLabel = (key: string, defaultLabel: string) => terminology[key] || defaultLabel

    async function onSubmit(formData: FormData) {
        setIsUploading(true)
        try {
            const name = formData.get('name') as string
            const basePrice = parseFloat(formData.get('basePrice') as string)
            const durationMinutes = parseInt(formData.get('durationMinutes') as string)
            const description = formData.get('description') as string
            const coverageArea = formData.get('coverageArea') as string
            const unitOfMeasure = formData.get('unitOfMeasure') as string
            const imageFile = formData.get('image') as File

            let category = formData.get('category') as string
            if (category === 'Other') {
                category = customCategory
            }

            let imageUrl = ''
            if (imageFile && imageFile.size > 0) {
                const fileExt = imageFile.name.split('.').pop()
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
                const filePath = `services/${fileName}` // Uploading to 'attachments' bucket, services folder

                const { error: uploadError } = await supabase.storage
                    .from('attachments')
                    .upload(filePath, imageFile)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('attachments')
                    .getPublicUrl(filePath)

                imageUrl = publicUrl
            }

            createService.mutate({
                name,
                category,
                basePrice,
                durationMinutes,
                description,
                coverageArea,
                imageUrl,
                unitOfMeasure,
            })
        } catch (error: any) {
            console.error('Submission failed:', error)
            alert('Failed to save service: ' + error.message)
            setIsUploading(false)
        }
    }

    const categories = [
        'Cleaning',
        'Plumbing',
        'Electrical',
        'HVAC',
        'Heating',
        'Landscaping',
        'Carpentry',
        'Pest Control',
        'Gas Engineer',
        'PAT Testing',
        'Maintenance',
        'Building',
        'Laundry & Ironing',
        'Other'
    ]

    const unitsOfMeasure = [
        'Per Item',
        'Per Hour',
        'Per Job',
        'Per Contract'
    ]

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
                    {/* Basic Info */}
                    <div className="sm:col-span-4">
                        <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                            {getLabel('services.name', 'Service Name')} <span className="text-red-500">*</span>
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
                            {getLabel('services.category', 'Category')}
                        </label>
                        <div className="mt-2">
                            <select
                                id="category"
                                name="category"
                                required
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
                            >
                                <option value="">Select a category</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedCategory === 'Other' && (
                        <div className="sm:col-span-3">
                            <label htmlFor="customCategory" className="block text-sm font-medium leading-6 text-gray-900">
                                Custom Category Name <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    id="customCategory"
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    required
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                    )}

                    <div className="sm:col-span-3">
                        <label htmlFor="basePrice" className="block text-sm font-medium leading-6 text-gray-900">
                            {getLabel('services.basePrice', 'Base Price (£)')}
                        </label>
                        <div className="mt-2 relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-gray-500 sm:text-sm">£</span>
                            </div>
                            <input
                                type="number"
                                name="basePrice"
                                id="basePrice"
                                min="0"
                                step="0.01"
                                required
                                className="block w-full rounded-md border-0 py-1.5 pl-7 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="unitOfMeasure" className="block text-sm font-medium leading-6 text-gray-900">
                            Unit of Measure
                        </label>
                        <div className="mt-2">
                            <select
                                id="unitOfMeasure"
                                name="unitOfMeasure"
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
                            >
                                <option value="">Select unit...</option>
                                {unitsOfMeasure.map((unit) => (
                                    <option key={unit} value={unit}>{unit}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="duration" className="block text-sm font-medium leading-6 text-gray-900">
                            {getLabel('services.duration', 'Duration (minutes)')}
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
                            {getLabel('services.description', 'Description')}
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

                    {/* Coverage Area */}
                    <div className="col-span-full">
                        <label htmlFor="coverageArea" className="block text-sm font-medium leading-6 text-gray-900">
                            Coverage Area
                        </label>
                        <div className="mt-2">
                            <textarea
                                id="coverageArea"
                                name="coverageArea"
                                rows={3}
                                placeholder="e.g., Greater London, M25 Corridor, or specific postcodes..."
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="col-span-full">
                        <label htmlFor="image" className="block text-sm font-medium leading-6 text-gray-900">
                            Service Photo
                        </label>
                        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 bg-gray-50/50">
                            <div className="text-center">
                                <Upload className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                                <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                    <label
                                        htmlFor="image"
                                        className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
                                    >
                                        <span>Upload a file</span>
                                        <input id="image" name="image" type="file" className="sr-only" accept="image/*" />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF up to 5MB</p>
                            </div>
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
                        disabled={createService.isPending || isUploading}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                    >
                        {createService.isPending || isUploading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    )
}

'use client'

import { useRouter } from 'next/navigation'
import { api } from '@/trpc/react'
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

interface ChecklistItem {
    text: string
    isCompleted: boolean
}

export default function NewChecklistPage() {
    const router = useRouter()
    const [items, setItems] = useState<ChecklistItem[]>([{ text: '', isCompleted: false }])

    const createChecklist = api.checklists.create.useMutation({
        onSuccess: () => {
            router.push('/dashboard/checklists')
            router.refresh()
        },
    })

    // Update item text
    const updateItem = (index: number, text: string) => {
        const newItems = [...items]
        newItems[index].text = text
        setItems(newItems)
    }

    // Add new item row
    const addItem = () => {
        setItems([...items, { text: '', isCompleted: false }])
    }

    // Remove item row
    const removeItem = (index: number) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index)
            setItems(newItems)
        }
    }

    async function onSubmit(formData: FormData) {
        const name = formData.get('name') as string
        const description = formData.get('description') as string
        const isTemplate = formData.get('isTemplate') === 'on'

        // Filter out empty items
        const validItems = items.filter(item => item.text.trim() !== '')

        createChecklist.mutate({
            name,
            description: description || undefined,
            isTemplate,
            items: validItems,
        })
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        New Checklist
                    </h2>
                </div>
            </div>

            <form action={onSubmit} className="mt-8 space-y-8">
                {createChecklist.error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Error creating checklist: {createChecklist.error.message}
                                </h3>
                            </div>
                        </div>
                    </div>
                )}

                {/* Checklist Details */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900">General Information</h3>
                        <p className="mt-1 text-sm leading-6 text-gray-600">Basic details about this checklist.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <div className="sm:col-span-4">
                            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    required
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="e.g., Daily Office Cleaning"
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
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    defaultValue={''}
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-4">
                            <div className="relative flex items-start">
                                <div className="flex h-6 items-center">
                                    <input
                                        id="isTemplate"
                                        name="isTemplate"
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                    />
                                </div>
                                <div className="ml-3 text-sm leading-6">
                                    <label htmlFor="isTemplate" className="font-medium text-gray-900">
                                        Save as Template
                                    </label>
                                    <p className="text-gray-500">Use this checklist as a template for future jobs.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Checklist Items */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold leading-7 text-gray-900">Checklist Items</h3>
                            <p className="mt-1 text-sm leading-6 text-gray-600">Add tasks to be completed.</p>
                        </div>
                        <button
                            type="button"
                            onClick={addItem}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Add Task
                        </button>
                    </div>

                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div key={index} className="flex items-center gap-x-3">
                                <span className="text-sm text-gray-400 w-6 text-right">{index + 1}.</span>
                                <input
                                    type="text"
                                    value={item.text}
                                    onChange={(e) => updateItem(index, e.target.value)}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="Task description"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="text-red-600 hover:text-red-900 disabled:opacity-50 p-2"
                                    disabled={items.length === 1}
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
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
                        disabled={createChecklist.isPending}
                        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                    >
                        {createChecklist.isPending ? 'Creating...' : 'Create Checklist'}
                    </button>
                </div>
            </form>
        </div>
    )
}

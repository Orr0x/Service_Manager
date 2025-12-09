'use client'

import { useRouter } from 'next/navigation'
import { api } from '@/trpc/react'
import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Save, ArrowLeft } from 'lucide-react'
import { FileUploader } from '@/components/file-uploader'
import Link from 'next/link'

interface ChecklistItem {
    id: string
    text: string
    description?: string
    imageUrl?: string
    isCompleted: boolean
    isExpanded?: boolean
}

export default function EditChecklistPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()

    // Unwrap params using state or similar since we are in a client component, 
    // BUT this is a page, so it receives params as props.
    // However, to unwrap Promise params in Client Component, we need `use` from react or await in async wrapper.
    // Easier pattern for Client Component pages in Next.js 15:
    // Just wrap content? Or since it's "use client", we might strictly need to use `use(params)` or handle async loading.
    // Actually, let's make the default export async if possible? No, client components can't be async.
    // We will use a wrapper or just use `useParams` from `next/navigation`!
    // Since it's a client component, `useParams` is the clean way.

    // Wait, let's check how I wrote it. I'll use useParams() hook instead of props to be safe and clean.
    return <EditChecklistContent />
}

import { useParams } from 'next/navigation'

function EditChecklistContent() {
    const params = useParams()
    const id = params.id as string
    const router = useRouter()

    // Fetch Data
    const { data: checklist, isLoading } = api.checklists.getById.useQuery({ id }, {
        refetchOnWindowFocus: false
    })

    const [items, setItems] = useState<ChecklistItem[]>([])
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [isTemplate, setIsTemplate] = useState(false)

    // Initialize State when data loads
    useEffect(() => {
        if (checklist) {
            setName(checklist.name)
            setDescription(checklist.description || '')
            setIsTemplate(checklist.is_template)

            const parsedItems = (typeof checklist.items === 'string'
                ? JSON.parse(checklist.items)
                : checklist.items) as ChecklistItem[]

            // Ensure they have IDs and expansion state
            setItems(parsedItems.map(item => ({
                ...item,
                id: item.id || crypto.randomUUID(),
                isExpanded: false
            })))
        }
    }, [checklist])

    const updateChecklist = api.checklists.update.useMutation({
        onSuccess: () => {
            router.push(`/dashboard/checklists/${id}`)
            router.refresh()
        },
    })

    const { data: settings } = api.settings.getSettings.useQuery()
    const terminology = (settings?.terminology as Record<string, string>) || {}
    const getLabel = (key: string, defaultLabel: string) => terminology[key] || defaultLabel

    // Update item field
    const updateItem = (index: number, field: keyof ChecklistItem, value: any) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        setItems(newItems)
    }

    // Toggle item expansion
    const toggleItem = (index: number) => {
        const newItems = [...items]
        newItems[index].isExpanded = !newItems[index].isExpanded
        setItems(newItems)
    }

    // Add new item row
    const addItem = () => {
        setItems([...items, {
            id: crypto.randomUUID(),
            text: '',
            description: '',
            isCompleted: false,
            isExpanded: true
        }])
    }

    // Remove item row
    const removeItem = (index: number) => {
        if (items.length > 0) { // Allow deleting last one if needed, but usually keep 1
            const newItems = items.filter((_, i) => i !== index)
            setItems(newItems)
        }
    }

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // Filter out empty items
        const validItems = items.filter(item => item.text && item.text.trim() !== '')

        updateChecklist.mutate({
            id,
            name,
            description: description || undefined,
            isTemplate,
            items: validItems.map(({ isExpanded, ...item }) => item), // Remove UI-only fields
        })
    }

    if (isLoading) return <div className="p-8 text-center">Loading...</div>
    if (!checklist && !isLoading) return <div className="p-8 text-center text-red-500">Checklist not found</div>

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
                <Link
                    href={`/dashboard/checklists/${id}`}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to Details
                </Link>
            </div>

            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Edit Checklist
                    </h2>
                </div>
            </div>

            <form onSubmit={onSubmit} className="mt-8 space-y-8">
                {updateChecklist.error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Error updating checklist: {updateChecklist.error.message}
                                </h3>
                            </div>
                        </div>
                    </div>
                )}

                {/* Checklist Details */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900">General Information</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <div className="sm:col-span-4">
                            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('checklists.name', 'Checklist Name')} <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div className="col-span-full">
                            <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('checklists.description', 'Description')}
                            </label>
                            <div className="mt-2">
                                <textarea
                                    id="description"
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-4">
                            <div className="relative flex items-start">
                                <div className="flex h-6 items-center">
                                    <input
                                        id="isTemplate"
                                        type="checkbox"
                                        checked={isTemplate}
                                        onChange={(e) => setIsTemplate(e.target.checked)}
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
                            <h3 className="text-base font-semibold leading-7 text-gray-900">{getLabel('checklists.tasks', 'Tasks')}</h3>
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

                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div key={item.id} className="bg-white border rounded-lg shadow-sm">
                                {/* Header / Summary */}
                                <div className="flex items-center gap-x-3 p-4 bg-gray-50 border-b rounded-t-lg">
                                    <button type="button" onClick={() => toggleItem(index)} className="text-gray-500 hover:text-gray-700">
                                        {item.isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                    </button>
                                    <span className="font-medium text-gray-500">Task {index + 1}</span>
                                    <input
                                        type="text"
                                        value={item.text}
                                        onChange={(e) => updateItem(index, 'text', e.target.value)}
                                        className="block w-full border-0 bg-transparent p-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                                        placeholder="Task title..."
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="text-red-600 hover:text-red-900 p-1"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Expanded Content */}
                                {item.isExpanded && (
                                    <div className="p-4 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium leading-6 text-gray-900">Description</label>
                                            <div className="mt-2">
                                                <textarea
                                                    rows={2}
                                                    value={item.description || ''}
                                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                                    placeholder="Detailed instructions..."
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium leading-6 text-gray-900">Reference Image</label>
                                            <div className="mt-2">
                                                <FileUploader
                                                    entityType="checklist_item"
                                                    entityId={item.id}
                                                    onUploadComplete={() => { }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                        disabled={updateChecklist.isPending}
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                    >
                        <Save className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        {updateChecklist.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}

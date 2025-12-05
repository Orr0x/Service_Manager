'use client'

import { api } from '@/trpc/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckSquare, Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { useState } from 'react'

interface ChecklistItem {
    text: string
    isCompleted: boolean
}

export function ChecklistDetail({ id }: { id: string }) {
    const router = useRouter()
    const utils = api.useUtils()
    const { data: checklist, isLoading } = api.checklists.getById.useQuery({ id })

    const updateChecklist = api.checklists.update.useMutation({
        onSuccess: () => {
            utils.checklists.getById.invalidate({ id })
        }
    })

    const deleteChecklist = api.checklists.delete.useMutation({
        onSuccess: () => {
            router.push('/dashboard/checklists')
            router.refresh()
        },
    })

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading checklist details...</div>
    }

    if (!checklist) {
        return <div className="p-8 text-center text-gray-500">Checklist not found</div>
    }

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this checklist?')) {
            deleteChecklist.mutate({ id })
        }
    }

    const items = (typeof checklist.items === 'string' ? JSON.parse(checklist.items) : checklist.items) as ChecklistItem[]

    const toggleItem = (index: number) => {
        const newItems = [...items]
        newItems[index].isCompleted = !newItems[index].isCompleted

        updateChecklist.mutate({
            id,
            items: newItems
        })
    }

    const completedCount = items.filter(i => i.isCompleted).length
    const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-x-4">
                    <Link
                        href="/dashboard/checklists"
                        className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{checklist.name}</h1>
                        <div className="mt-1 flex items-center gap-x-3 text-sm text-gray-500">
                            {checklist.is_template && (
                                <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                                    Template
                                </span>
                            )}
                            <span>{items.length} Tasks</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-x-3">
                    <button
                        onClick={handleDelete}
                        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50"
                    >
                        <Trash2 className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        Delete
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                        <Pencil className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        Edit
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Progress Bar */}
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Progress</span>
                            <span className="text-sm font-medium text-gray-900">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>

                    {/* Checklist Items */}
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                        <div className="border-b border-gray-900/5 bg-gray-50 px-4 py-3 sm:px-6">
                            <h3 className="text-base font-semibold leading-7 text-gray-900">Tasks</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {items.map((item, index) => (
                                <div
                                    key={index}
                                    className={`flex items-start p-4 hover:bg-gray-50 cursor-pointer transition-colors ${item.isCompleted ? 'bg-gray-50/50' : ''}`}
                                    onClick={() => toggleItem(index)}
                                >
                                    <div className="flex h-6 items-center">
                                        {item.isCompleted ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <Circle className="h-5 w-5 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="ml-3 text-sm leading-6">
                                        <label className={`font-medium text-gray-900 cursor-pointer ${item.isCompleted ? 'line-through text-gray-500' : ''}`}>
                                            {item.text}
                                        </label>
                                    </div>
                                </div>
                            ))}
                            {items.length === 0 && (
                                <div className="p-8 text-center text-gray-500 text-sm">No tasks in this checklist.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                        <div className="border-b border-gray-900/5 bg-gray-50 px-4 py-3 sm:px-6">
                            <h3 className="text-base font-semibold leading-7 text-gray-900">Details</h3>
                        </div>
                        <div className="px-4 py-5 sm:p-6">
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                                        {checklist.description || 'No description provided.'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {new Date(checklist.created_at).toLocaleDateString()}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

'use client'

import { useState, useRef } from 'react'
import { api } from '@/trpc/react'
import { createClient } from '@/utils/supabase/client'
import { Folder, Upload, X, FileText, Image as ImageIcon, Download, Edit2, Check, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface CertificationManagerProps {
    entityType: string
    entityId: string
    tenantId?: string // Optional, but usually inferred from context
}

const CATEGORIES = ['cat_1', 'cat_2', 'cat_3', 'cat_4', 'cat_5', 'cat_6']

export default function CertificationManager({ entityType, entityId }: CertificationManagerProps) {
    const [activeTab, setActiveTab] = useState<string>('cat_1')
    const [editingTab, setEditingTab] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const utils = api.useUtils()
    const supabase = createClient()

    // Queries
    const { data: settings } = api.certification.getSettings.useQuery({ entityType })
    const { data: files, isLoading: filesLoading } = api.certification.getCertifications.useQuery({
        entityType,
        entityId,
        categoryKey: activeTab
    })

    // Mutations
    const updateSetting = api.certification.updateSetting.useMutation({
        onSuccess: () => utils.certification.getSettings.invalidate()
    })

    const createCertification = api.certification.create.useMutation({
        onSuccess: () => utils.certification.getCertifications.invalidate()
    })

    const deleteCertification = api.certification.delete.useMutation({
        onSuccess: () => utils.certification.getCertifications.invalidate()
    })

    // Helpers
    const getTabLabel = (key: string) => {
        const setting = settings?.find(s => s.category_key === key)
        return setting?.label || `Category ${key.replace('cat_', '')}`
    }

    const handleRename = async (key: string) => {
        if (!editValue.trim()) return
        await updateSetting.mutateAsync({
            entityType,
            categoryKey: key,
            label: editValue
        })
        setEditingTab(null)
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploading(true)
            const fileExt = file.name.split('.').pop()
            const filePath = `${entityType}/${entityId}/${activeTab}/${Math.random()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('certifications')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            await createCertification.mutateAsync({
                entityType,
                entityId,
                categoryKey: activeTab,
                fileName: file.name,
                filePath,
                fileType: file.type,
                fileSize: file.size
            })

        } catch (error) {
            console.error('Upload failed:', error)
            alert('Upload failed. Please try again.')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this document?')) {
            await deleteCertification.mutateAsync(id)
        }
    }

    const handleDownload = async (path: string, filename: string) => {
        const { data } = await supabase.storage.from('certifications').createSignedUrl(path, 60)
        if (data?.signedUrl) {
            window.open(data.signedUrl, '_blank')
        }
    }

    return (
        <div className="bg-white shadow sm:rounded-lg">
            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-4 overflow-x-auto" aria-label="Tabs">
                    {CATEGORIES.map((key) => {
                        const isCurrent = activeTab === key
                        const label = getTabLabel(key)

                        return (
                            <div
                                key={key}
                                className={`
                                    whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2 group cursor-pointer
                                    ${isCurrent
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }
                                `}
                                onClick={() => !editingTab && setActiveTab(key)}
                            >
                                {editingTab === key ? (
                                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            value={editValue}
                                            onChange={e => setEditValue(e.target.value)}
                                            className="w-24 px-1 py-0.5 text-xs border rounded"
                                            autoFocus
                                        />
                                        <button onClick={() => handleRename(key)} className="text-green-600 hover:text-green-700">
                                            <Check className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => setEditingTab(null)} className="text-red-600 hover:text-red-700">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {label}
                                        {isCurrent && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setEditingTab(key)
                                                    setEditValue(label)
                                                }}
                                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600"
                                            >
                                                <Edit2 className="h-3 w-3" />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        )
                    })}
                </nav>
            </div>

            {/* Content */}
            <div className="p-6">
                <div className="mb-6 flex justify-between items-center">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                        {getTabLabel(activeTab)} Documents
                    </h3>
                    <div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleUpload}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            {uploading ? 'Uploading...' : 'Upload Document'}
                        </button>
                    </div>
                </div>

                {/* File List */}
                {filesLoading ? (
                    <div className="text-center py-10 text-gray-500">Loading documents...</div>
                ) : files && files.length > 0 ? (
                    <ul role="list" className="divide-y divide-gray-100 rounded-md border border-gray-200">
                        {files.map((file) => (
                            <li key={file.id} className="flex items-center justify-between py-4 pl-4 pr-5 text-sm leading-6">
                                <div className="flex w-0 flex-1 items-center">
                                    {file.file_type.includes('image') ? (
                                        <ImageIcon className="h-5 w-5 flex-shrink-0 text-gray-400" />
                                    ) : (
                                        <FileText className="h-5 w-5 flex-shrink-0 text-gray-400" />
                                    )}
                                    <div className="ml-4 flex min-w-0 flex-1 gap-2">
                                        <span className="truncate font-medium">{file.file_name}</span>
                                        <span className="flex-shrink-0 text-gray-400">
                                            {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>
                                <div className="ml-4 flex-shrink-0 flex items-center gap-4">
                                    <button
                                        onClick={() => handleDownload(file.file_path, file.file_name)}
                                        className="font-medium text-blue-600 hover:text-blue-500"
                                    >
                                        Download
                                    </button>
                                    <button
                                        onClick={() => handleDelete(file.id)}
                                        className="text-gray-400 hover:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                        <Folder className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">No documents</h3>
                        <p className="mt-1 text-sm text-gray-500">Upload documents to this category</p>
                    </div>
                )}
            </div>
        </div>
    )
}

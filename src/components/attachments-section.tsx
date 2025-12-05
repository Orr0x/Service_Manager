'use client'

import { useState } from 'react'
import { api } from '@/trpc/react'
import { format } from 'date-fns'
import { FileText, Trash2, Image as ImageIcon, Download } from 'lucide-react'
import { FileUploader } from './file-uploader'
import { createClient } from '@/utils/supabase/client'

interface AttachmentsSectionProps {
    entityType: string
    entityId: string
}

export function AttachmentsSection({ entityType, entityId }: AttachmentsSectionProps) {
    const utils = api.useUtils()
    const supabase = createClient()

    const { data: attachments, isLoading } = api.attachments.getByEntity.useQuery({
        entityType,
        entityId,
    })

    const deleteAttachment = api.attachments.delete.useMutation({
        onSuccess: () => {
            utils.attachments.getByEntity.invalidate({ entityType, entityId })
        },
    })

    const getPublicUrl = (path: string) => {
        const { data } = supabase.storage.from('attachments').getPublicUrl(path)
        return data.publicUrl
    }

    const isImage = (fileType: string) => fileType.startsWith('image/')

    if (isLoading) return <div className="animate-pulse h-20 bg-gray-100 rounded"></div>

    return (
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
            <h3 className="text-base font-semibold leading-7 text-gray-900 mb-4">Attachments</h3>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 mb-6">
                {attachments?.map((file) => (
                    <div key={file.id} className="relative group rounded-lg border border-gray-200 bg-white p-2 shadow-sm hover:border-gray-300">
                        <div className="aspect-w-10 aspect-h-7 block w-full overflow-hidden rounded-lg bg-gray-100">
                            {isImage(file.file_type) ? (
                                <img
                                    src={getPublicUrl(file.storage_path)}
                                    alt={file.file_name}
                                    className="object-cover pointer-events-none"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <FileText className="h-10 w-10 text-gray-400" />
                                </div>
                            )}
                        </div>
                        <div className="mt-2 flex items-start justify-between">
                            <div className="truncate">
                                <p className="truncate text-sm font-medium text-gray-900" title={file.file_name}>{file.file_name}</p>
                                <p className="text-xs text-gray-500">{(file.file_size / 1024).toFixed(1)} KB</p>
                            </div>
                            <div className="flex space-x-1">
                                <a
                                    href={getPublicUrl(file.storage_path)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <Download className="h-4 w-4" />
                                </a>
                                <button
                                    onClick={() => deleteAttachment.mutate(file.id)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <FileUploader
                entityType={entityType}
                entityId={entityId}
                onUploadComplete={() => utils.attachments.getByEntity.invalidate({ entityType, entityId })}
            />
        </div>
    )
}

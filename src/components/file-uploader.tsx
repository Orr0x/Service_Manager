'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Upload, X } from 'lucide-react'
import { api } from '@/trpc/react'

interface FileUploaderProps {
    entityType: string
    entityId: string
    onUploadComplete: () => void
}

export function FileUploader({ entityType, entityId, onUploadComplete }: FileUploaderProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const createAttachment = api.attachments.create.useMutation({
        onSuccess: () => {
            onUploadComplete()
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        },
        onError: (err) => {
            setError(err.message)
            setIsUploading(false)
        }
    })

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        setError(null)

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `${entityType}/${entityId}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('attachments')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            // Create attachment record in DB
            createAttachment.mutate({
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                storagePath: filePath,
                entityType,
                entityId,
            })

        } catch (err: any) {
            console.error('Upload failed:', err)
            setError(err.message || 'Failed to upload file')
            setIsUploading(false)
        }
    }

    return (
        <div className="mt-2">
            <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-500">SVG, PNG, JPG or PDF (MAX. 10MB)</p>
                    </div>
                    <input
                        id="dropzone-file"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isUploading}
                        ref={fileInputRef}
                    />
                </label>
            </div>
            {isUploading && <p className="mt-2 text-sm text-blue-600">Uploading...</p>}
            {error && <p className="mt-2 text-sm text-red-600">Error: {error}</p>}
        </div>
    )
}

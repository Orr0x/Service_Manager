import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { createAdminClient } from '@/lib/supabase/admin'
import { isGoogleDriveConfigured, uploadBufferToGoogleDrive } from '@/lib/google/drive'
import type { Context } from '../context'

const photoTypeSchema = z.enum(['before', 'during', 'after'])

async function getWorkerId(ctx: {
    db: Context['db']
    user: { id: string }
    impersonatedEntity?: { id: string; type: string } | null
}) {
    if (ctx.impersonatedEntity?.type === 'worker') {
        return ctx.impersonatedEntity.id
    }

    const { data: worker } = await ctx.db
        .from('workers')
        .select('id')
        .eq('user_id', ctx.user.id)
        .single()

    return worker?.id as string | undefined
}

async function assertWorkerAssigned(ctx: {
    db: Context['db']
    user: { id: string }
    impersonatedEntity?: { id: string; type: string } | null
}, jobId: string) {
    const workerId = await getWorkerId(ctx)
    if (!workerId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a worker' })
    }

    const { data: assignment } = await ctx.db
        .from('job_assignments')
        .select('id')
        .eq('job_id', jobId)
        .eq('worker_id', workerId)
        .single()

    if (!assignment) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not assigned to this job' })
    }

    return workerId
}

export const jobPhotosRouter = createTRPCRouter({
    getByJob: protectedProcedure
        .input(z.object({ jobId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('job_photos')
                .select('*')
                .eq('tenant_id', ctx.tenantId)
                .eq('job_id', input.jobId)
                .order('created_at', { ascending: false })

            if (error) {
                throw new Error(`Failed to fetch job photos: ${error.message}`)
            }

            return data
        }),

    createFromStagedUpload: protectedProcedure
        .input(z.object({
            jobId: z.string().uuid(),
            photoType: photoTypeSchema,
            description: z.string().optional(),
            fileName: z.string().min(1),
            fileType: z.string().min(1),
            fileSize: z.number().nonnegative(),
            storagePath: z.string().min(1),
            capturedAt: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const workerId = await assertWorkerAssigned(ctx, input.jobId)

            const { data: photo, error } = await ctx.db
                .from('job_photos')
                .insert({
                    tenant_id: ctx.tenantId,
                    job_id: input.jobId,
                    worker_id: workerId,
                    uploaded_by: ctx.user.id,
                    photo_type: input.photoType,
                    description: input.description,
                    file_name: input.fileName,
                    file_type: input.fileType,
                    file_size: input.fileSize,
                    storage_bucket: 'job-photos',
                    storage_path: input.storagePath,
                    status: 'stored_in_supabase',
                    captured_at: input.capturedAt || new Date().toISOString(),
                })
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to create job photo record: ${error.message}`)
            }

            if (isGoogleDriveConfigured()) {
                await syncPhotoToGoogleDrive(photo.id)
            }

            const { data: refreshedPhoto, error: refreshError } = await ctx.db
                .from('job_photos')
                .select('*')
                .eq('id', photo.id)
                .single()

            if (refreshError) {
                throw new Error(`Failed to refresh job photo record: ${refreshError.message}`)
            }

            return refreshedPhoto
        }),

    retryGoogleDriveSync: protectedProcedure
        .input(z.object({ photoId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { data: photo, error } = await ctx.db
                .from('job_photos')
                .select('id, tenant_id')
                .eq('id', input.photoId)
                .eq('tenant_id', ctx.tenantId)
                .single()

            if (error || !photo) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Photo not found' })
            }

            await syncPhotoToGoogleDrive(input.photoId)

            const { data: refreshedPhoto, error: refreshError } = await ctx.db
                .from('job_photos')
                .select('*')
                .eq('id', input.photoId)
                .single()

            if (refreshError) {
                throw new Error(`Failed to refresh job photo record: ${refreshError.message}`)
            }

            return refreshedPhoto
        }),
})

async function syncPhotoToGoogleDrive(photoId: string) {
    const admin = createAdminClient()

    const { data: photo, error: photoError } = await admin
        .from('job_photos')
        .select('*')
        .eq('id', photoId)
        .single()

    if (photoError || !photo) {
        throw new Error(photoError?.message || 'Photo not found')
    }

    if (!photo.storage_path) {
        throw new Error('Photo has no Supabase staging path')
    }

    await admin
        .from('job_photos')
        .update({ status: 'syncing_to_google_drive', last_error: null })
        .eq('id', photoId)

    try {
        const drive = photo.google_drive_file_id
            ? {
                fileId: photo.google_drive_file_id as string,
                webViewLink: photo.google_drive_web_view_link as string | null,
                folderId: photo.google_drive_folder_id as string | null,
            }
            : await uploadStagedPhotoToDrive(admin, photo)

        const { error: removeError } = await admin.storage
            .from(photo.storage_bucket || 'job-photos')
            .remove([photo.storage_path])

        if (removeError) {
            throw new Error(`Google Drive upload succeeded, but Supabase cleanup failed: ${removeError.message}`)
        }

        await admin
            .from('job_photos')
            .update({
                google_drive_file_id: drive.fileId,
                google_drive_web_view_link: drive.webViewLink,
                google_drive_folder_id: drive.folderId,
                storage_path: null,
                status: 'stored_in_google_drive',
                synced_at: new Date().toISOString(),
                last_error: null,
            })
            .eq('id', photoId)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Google Drive sync failed'
        await admin
            .from('job_photos')
            .update({
                status: 'google_drive_failed',
                last_error: message,
            })
            .eq('id', photoId)
    }
}

async function uploadStagedPhotoToDrive(admin: ReturnType<typeof createAdminClient>, photo: {
    storage_bucket?: string | null
    storage_path: string
    file_name: string
    file_type: string
}) {
    const { data: fileData, error: downloadError } = await admin.storage
        .from(photo.storage_bucket || 'job-photos')
        .download(photo.storage_path)

    if (downloadError || !fileData) {
        throw new Error(downloadError?.message || 'Failed to download staged photo')
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())

    return uploadBufferToGoogleDrive({
        fileName: photo.file_name,
        mimeType: photo.file_type,
        buffer,
        folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
    })
}

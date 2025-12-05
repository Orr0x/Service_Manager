import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const attachmentsRouter = createTRPCRouter({
    getByEntity: protectedProcedure
        .input(z.object({
            entityType: z.string(),
            entityId: z.string().uuid(),
        }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('attachments')
                .select(`
          *,
          users:uploaded_by(first_name, last_name)
        `)
                .eq('entity_type', input.entityType)
                .eq('entity_id', input.entityId)
                .eq('tenant_id', ctx.tenantId)
                .order('created_at', { ascending: false })

            if (error) {
                throw new Error(`Failed to fetch attachments: ${error.message}`)
            }

            return data
        }),

    create: protectedProcedure
        .input(z.object({
            fileName: z.string(),
            fileType: z.string(),
            fileSize: z.number(),
            storagePath: z.string(),
            entityType: z.string(),
            entityId: z.string().uuid(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('attachments')
                .insert({
                    tenant_id: ctx.tenantId,
                    file_name: input.fileName,
                    file_type: input.fileType,
                    file_size: input.fileSize,
                    storage_path: input.storagePath,
                    entity_type: input.entityType,
                    entity_id: input.entityId,
                    uploaded_by: ctx.user.id,
                })
                .select(`
          *,
          users:uploaded_by(first_name, last_name)
        `)
                .single()

            if (error) {
                throw new Error(`Failed to create attachment record: ${error.message}`)
            }

            return data
        }),

    delete: protectedProcedure
        .input(z.string().uuid())
        .mutation(async ({ ctx, input }) => {
            const { error } = await ctx.db
                .from('attachments')
                .delete()
                .eq('id', input)
                .eq('tenant_id', ctx.tenantId)

            if (error) {
                throw new Error(`Failed to delete attachment: ${error.message}`)
            }

            return { success: true }
        }),
})

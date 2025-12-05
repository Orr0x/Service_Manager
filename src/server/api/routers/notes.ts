import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const notesRouter = createTRPCRouter({
    getByEntity: protectedProcedure
        .input(z.object({
            entityType: z.string(),
            entityId: z.string().uuid(),
        }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('notes')
                .select(`
          *,
          users(first_name, last_name, email)
        `)
                .eq('entity_type', input.entityType)
                .eq('entity_id', input.entityId)
                .eq('tenant_id', ctx.tenantId)
                .order('created_at', { ascending: false })

            if (error) {
                throw new Error(`Failed to fetch notes: ${error.message}`)
            }

            return data
        }),

    create: protectedProcedure
        .input(z.object({
            content: z.string().min(1),
            entityType: z.string(),
            entityId: z.string().uuid(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('notes')
                .insert({
                    tenant_id: ctx.tenantId,
                    content: input.content,
                    entity_type: input.entityType,
                    entity_id: input.entityId,
                    created_by: ctx.user.id,
                })
                .select(`
          *,
          users(first_name, last_name, email)
        `)
                .single()

            if (error) {
                throw new Error(`Failed to create note: ${error.message}`)
            }

            return data
        }),

    delete: protectedProcedure
        .input(z.string().uuid())
        .mutation(async ({ ctx, input }) => {
            const { error } = await ctx.db
                .from('notes')
                .delete()
                .eq('id', input)
                .eq('tenant_id', ctx.tenantId)

            if (error) {
                throw new Error(`Failed to delete note: ${error.message}`)
            }

            return { success: true }
        }),
})

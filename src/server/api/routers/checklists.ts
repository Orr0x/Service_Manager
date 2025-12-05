import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

// Define a schema for checklist items
const checklistItemSchema = z.object({
    text: z.string(),
    isCompleted: z.boolean(),
})

export const checklistsRouter = createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
        const { data, error } = await ctx.db
            .from('checklists')
            .select('*')
            .eq('tenant_id', ctx.tenantId)
            .order('created_at', { ascending: false })

        if (error) {
            throw new Error(`Failed to fetch checklists: ${error.message}`)
        }

        return data
    }),

    getById: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('checklists')
                .select('*')
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .single()

            if (error) {
                throw new Error(`Failed to fetch checklist: ${error.message}`)
            }

            return data
        }),

    create: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1),
                description: z.string().optional(),
                isTemplate: z.boolean().optional(),
                items: z.array(checklistItemSchema).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('checklists')
                .insert({
                    tenant_id: ctx.tenantId,
                    name: input.name,
                    description: input.description,
                    is_template: input.isTemplate || false,
                    items: input.items || [],
                })
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to create checklist: ${error.message}`)
            }

            return data
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                name: z.string().min(1).optional(),
                description: z.string().optional(),
                isTemplate: z.boolean().optional(),
                items: z.array(checklistItemSchema).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('checklists')
                .update({
                    name: input.name,
                    description: input.description,
                    is_template: input.isTemplate,
                    items: input.items || undefined,
                })
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to update checklist: ${error.message}`)
            }

            return data
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { error } = await ctx.db
                .from('checklists')
                .delete()
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)

            if (error) {
                throw new Error(`Failed to delete checklist: ${error.message}`)
            }

            return { success: true }
        }),
})

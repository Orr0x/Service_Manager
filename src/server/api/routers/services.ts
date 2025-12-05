import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const servicesRouter = createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
        const { data, error } = await ctx.db
            .from('services')
            .select('*')
            .eq('tenant_id', ctx.tenantId)
            .order('name')

        if (error) {
            throw new Error(`Failed to fetch services: ${error.message}`)
        }

        return data
    }),

    create: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1),
                description: z.string().optional(),
                basePrice: z.number().min(0),
                durationMinutes: z.number().min(1),
                category: z.string().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('services')
                .insert({
                    tenant_id: ctx.tenantId,
                    name: input.name,
                    description: input.description,
                    base_price: input.basePrice,
                    duration_minutes: input.durationMinutes,
                    category: input.category,
                })
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to create service: ${error.message}`)
            }

            return data
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                name: z.string().min(1).optional(),
                description: z.string().optional(),
                basePrice: z.number().min(0).optional(),
                durationMinutes: z.number().min(1).optional(),
                category: z.string().min(1).optional(),
                isActive: z.boolean().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('services')
                .update({
                    name: input.name,
                    description: input.description,
                    base_price: input.basePrice,
                    duration_minutes: input.durationMinutes,
                    category: input.category,
                    is_active: input.isActive,
                })
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to update service: ${error.message}`)
            }

            return data
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { error } = await ctx.db
                .from('services')
                .delete()
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)

            if (error) {
                throw new Error(`Failed to delete service: ${error.message}`)
            }

            return { success: true }
        }),
})

import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const workersRouter = createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
        const { data, error } = await ctx.db
            .from('workers')
            .select('*')
            .eq('tenant_id', ctx.tenantId)
            .order('created_at', { ascending: false })

        if (error) {
            throw new Error(`Failed to fetch workers: ${error.message}`)
        }

        return data
    }),

    getById: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('workers')
                .select('*')
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .single()

            if (error) {
                throw new Error(`Failed to fetch worker: ${error.message}`)
            }

            return data
        }),

    create: protectedProcedure
        .input(
            z.object({
                firstName: z.string().min(1),
                lastName: z.string().min(1),
                email: z.string().email().optional().or(z.literal('')),
                phone: z.string().optional(),
                role: z.string().min(1),
                skills: z.array(z.string()).optional(),
                hourlyRate: z.number().optional(),
                status: z.string().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('workers')
                .insert({
                    tenant_id: ctx.tenantId,
                    first_name: input.firstName,
                    last_name: input.lastName,
                    email: input.email || null,
                    phone: input.phone,
                    role: input.role,
                    skills: input.skills ? JSON.stringify(input.skills) : '[]',
                    hourly_rate: input.hourlyRate,
                    status: input.status,
                })
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to create worker: ${error.message}`)
            }

            return data
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                firstName: z.string().min(1).optional(),
                lastName: z.string().min(1).optional(),
                email: z.string().email().optional().or(z.literal('')),
                phone: z.string().optional(),
                role: z.string().min(1).optional(),
                skills: z.array(z.string()).optional(),
                hourlyRate: z.number().optional(),
                status: z.string().min(1).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('workers')
                .update({
                    first_name: input.firstName,
                    last_name: input.lastName,
                    email: input.email || null,
                    phone: input.phone,
                    role: input.role,
                    skills: input.skills ? JSON.stringify(input.skills) : undefined,
                    hourly_rate: input.hourlyRate,
                    status: input.status,
                })
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to update worker: ${error.message}`)
            }

            return data
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { error } = await ctx.db
                .from('workers')
                .delete()
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)

            if (error) {
                throw new Error(`Failed to delete worker: ${error.message}`)
            }

            return { success: true }
        }),
})

import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const contractorsRouter = createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
        const { data, error } = await ctx.db
            .from('contractors')
            .select('*')
            .eq('tenant_id', ctx.tenantId)
            .order('created_at', { ascending: false })

        if (error) {
            throw new Error(`Failed to fetch contractors: ${error.message}`)
        }

        return data
    }),

    getById: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('contractors')
                .select('*')
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .single()

            if (error) {
                throw new Error(`Failed to fetch contractor: ${error.message}`)
            }

            return data
        }),

    create: protectedProcedure
        .input(
            z.object({
                companyName: z.string().min(1),
                contactName: z.string().min(1),
                email: z.string().email().optional().or(z.literal('')),
                phone: z.string().optional(),
                specialties: z.array(z.string()).optional(),
                status: z.string().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('contractors')
                .insert({
                    tenant_id: ctx.tenantId,
                    company_name: input.companyName,
                    contact_name: input.contactName,
                    email: input.email || null,
                    phone: input.phone,
                    specialties: input.specialties ? JSON.stringify(input.specialties) : '[]',
                    status: input.status,
                })
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to create contractor: ${error.message}`)
            }

            return data
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                companyName: z.string().min(1).optional(),
                contactName: z.string().min(1).optional(),
                email: z.string().email().optional().or(z.literal('')),
                phone: z.string().optional(),
                specialties: z.array(z.string()).optional(),
                status: z.string().min(1).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('contractors')
                .update({
                    company_name: input.companyName,
                    contact_name: input.contactName,
                    email: input.email || null,
                    phone: input.phone,
                    specialties: input.specialties ? JSON.stringify(input.specialties) : undefined,
                    status: input.status,
                })
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to update contractor: ${error.message}`)
            }

            return data
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { error } = await ctx.db
                .from('contractors')
                .delete()
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)

            if (error) {
                throw new Error(`Failed to delete contractor: ${error.message}`)
            }

            return { success: true }
        }),
})

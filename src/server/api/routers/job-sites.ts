import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const jobSitesRouter = createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
        const { data, error } = await ctx.db
            .from('job_sites')
            .select(`
        *,
        customer:customers(business_name, contact_name)
      `)
            .eq('tenant_id', ctx.tenantId)
            .order('name', { ascending: true })

        if (error) {
            throw new Error(`Failed to fetch job sites: ${error.message}`)
        }

        return data
    }),

    getByCustomerId: protectedProcedure
        .input(z.object({ customerId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('job_sites')
                .select('*')
                .eq('customer_id', input.customerId)
                .eq('tenant_id', ctx.tenantId)
                .order('name', { ascending: true })

            if (error) {
                throw new Error(`Failed to fetch job sites for customer: ${error.message}`)
            }

            return data
        }),

    getById: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('job_sites')
                .select('*')
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .single()

            if (error) {
                throw new Error(`Failed to fetch job site: ${error.message}`)
            }

            return data
        }),

    create: protectedProcedure
        .input(
            z.object({
                customerId: z.string().uuid(),
                name: z.string().min(1),
                address: z.string().min(1),
                city: z.string().optional(),
                state: z.string().optional(),
                postalCode: z.string().optional(),
                country: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('job_sites')
                .insert({
                    tenant_id: ctx.tenantId,
                    customer_id: input.customerId,
                    name: input.name,
                    address: input.address,
                    city: input.city,
                    state: input.state,
                    postal_code: input.postalCode,
                    country: input.country,
                })
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to create job site: ${error.message}`)
            }

            return data
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                name: z.string().min(1).optional(),
                address: z.string().min(1).optional(),
                city: z.string().optional(),
                state: z.string().optional(),
                postalCode: z.string().optional(),
                country: z.string().optional(),
                isActive: z.boolean().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('job_sites')
                .update({
                    name: input.name,
                    address: input.address,
                    city: input.city,
                    state: input.state,
                    postal_code: input.postalCode,
                    country: input.country,
                    is_active: input.isActive,
                })
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to update job site: ${error.message}`)
            }

            return data
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { error } = await ctx.db
                .from('job_sites')
                .delete()
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)

            if (error) {
                throw new Error(`Failed to delete job site: ${error.message}`)
            }

            return { success: true }
        }),
})

import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const contractsRouter = createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
        const { data, error } = await ctx.db
            .from('contracts')
            .select(`
        *,
        customer:customers(business_name, contact_name),
        job_site:job_sites(name)
      `)
            .eq('tenant_id', ctx.tenantId)
            .order('created_at', { ascending: false })

        if (error) {
            throw new Error(`Failed to fetch contracts: ${error.message}`)
        }

        return data
    }),

    getById: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('contracts')
                .select(`
          *,
          customer:customers(id, business_name, contact_name, email, phone),
          job_site:job_sites(*)
        `)
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .single()

            if (error) {
                throw new Error(`Failed to fetch contract: ${error.message}`)
            }

            return data
        }),

    getByCustomerId: protectedProcedure
        .input(z.object({ customerId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('contracts')
                .select(`
          *,
          job_site:job_sites(name)
        `)
                .eq('customer_id', input.customerId)
                .eq('tenant_id', ctx.tenantId)
                .order('created_at', { ascending: false })

            if (error) {
                throw new Error(`Failed to fetch contracts for customer: ${error.message}`)
            }

            return data
        }),

    getByJobSiteId: protectedProcedure
        .input(z.object({ jobSiteId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('contracts')
                .select(`
          *,
          customer:customers(business_name, contact_name)
        `)
                .eq('job_site_id', input.jobSiteId)
                .eq('tenant_id', ctx.tenantId)
                .order('created_at', { ascending: false })

            if (error) {
                throw new Error(`Failed to fetch contracts for job site: ${error.message}`)
            }

            return data
        }),

    create: protectedProcedure
        .input(
            z.object({
                customerId: z.string().uuid(),
                jobSiteId: z.string().uuid().optional(),
                name: z.string().min(1),
                type: z.string().min(1),
                status: z.string().min(1),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
                amount: z.number().optional(),
                billingFrequency: z.string().optional(),
                description: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('contracts')
                .insert({
                    tenant_id: ctx.tenantId,
                    customer_id: input.customerId,
                    job_site_id: input.jobSiteId,
                    name: input.name,
                    type: input.type,
                    status: input.status,
                    start_date: input.startDate,
                    end_date: input.endDate,
                    amount: input.amount,
                    billing_frequency: input.billingFrequency,
                    description: input.description,
                })
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to create contract: ${error.message}`)
            }

            return data
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                name: z.string().min(1).optional(),
                type: z.string().min(1).optional(),
                status: z.string().min(1).optional(),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
                amount: z.number().optional(),
                billingFrequency: z.string().optional(),
                description: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('contracts')
                .update({
                    name: input.name,
                    type: input.type,
                    status: input.status,
                    start_date: input.startDate,
                    end_date: input.endDate,
                    amount: input.amount,
                    billing_frequency: input.billingFrequency,
                    description: input.description,
                })
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to update contract: ${error.message}`)
            }

            return data
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { error } = await ctx.db
                .from('contracts')
                .delete()
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)

            if (error) {
                throw new Error(`Failed to delete contract: ${error.message}`)
            }

            return { success: true }
        }),
})

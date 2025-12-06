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
    getByJobSiteId: protectedProcedure
        .input(z.object({ jobSiteId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('workers')
                .select(`
          *,
          job_assignments!inner(
            job:jobs!inner(job_site_id)
          )
        `)
                .eq('job_assignments.job.job_site_id', input.jobSiteId)
                .eq('tenant_id', ctx.tenantId)
                .order('first_name', { ascending: true })

            if (error) {
                throw new Error(`Failed to fetch workers for job site: ${error.message}`)
            }

            // Remove duplicates (a worker might be assigned to multiple jobs at the same site)
            const uniqueWorkers = Array.from(new Map(data.map(item => [item.id, item])).values())

            return uniqueWorkers
        }),
    getByContractId: protectedProcedure
        .input(z.object({ contractId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            // First get the contract to find the job site
            const { data: contract, error: contractError } = await ctx.db
                .from('contracts')
                .select('job_site_id')
                .eq('id', input.contractId)
                .single()

            if (contractError || !contract || !contract.job_site_id) {
                return []
            }

            // Then fetch workers for this job site
            const { data, error } = await ctx.db
                .from('workers')
                .select(`
          *,
          job_assignments!inner(
            job:jobs!inner(job_site_id)
          )
        `)
                .eq('job_assignments.job.job_site_id', contract.job_site_id)
                .eq('tenant_id', ctx.tenantId)
                .order('first_name', { ascending: true })

            if (error) {
                throw new Error(`Failed to fetch workers for contract: ${error.message}`)
            }

            // Remove duplicates
            const uniqueWorkers = Array.from(new Map(data.map(item => [item.id, item])).values())

            return uniqueWorkers
        }),
    getByQuoteId: protectedProcedure
        .input(z.object({ quoteId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            // First fetch the quote to get the job_site_id
            const { data: quote, error: quoteError } = await ctx.db
                .from('quotes')
                .select('job_site_id')
                .eq('id', input.quoteId)
                .single()

            if (quoteError) {
                throw new Error(`Failed to fetch quote details: ${quoteError.message}`)
            }

            if (!quote.job_site_id) {
                return []
            }

            const { data, error } = await ctx.db
                .from('workers')
                .select(`
          *,
          job_assignments!inner(
            job:jobs!inner(job_site_id)
          )
        `)
                .eq('job_assignments.job.job_site_id', quote.job_site_id)
                .eq('tenant_id', ctx.tenantId)
                .order('first_name', { ascending: true })

            if (error) {
                throw new Error(`Failed to fetch workers for quote: ${error.message}`)
            }

            // Remove duplicates
            const uniqueWorkers = Array.from(new Map(data.map(item => [item.id, item])).values())

            return uniqueWorkers
        }),
})

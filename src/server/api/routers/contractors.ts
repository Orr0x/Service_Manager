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
    getByJobSiteId: protectedProcedure
        .input(z.object({ jobSiteId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('contractors')
                .select(`
          *,
          job_assignments!inner(
            job:jobs!inner(job_site_id)
          )
        `)
                .eq('job_assignments.job.job_site_id', input.jobSiteId)
                .eq('tenant_id', ctx.tenantId)
                .order('company_name', { ascending: true })

            if (error) {
                throw new Error(`Failed to fetch contractors for job site: ${error.message}`)
            }

            // Remove duplicates
            const uniqueContractors = Array.from(new Map(data.map(item => [item.id, item])).values())

            return uniqueContractors
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

            // Then fetch contractors for this job site
            const { data, error } = await ctx.db
                .from('contractors')
                .select(`
          *,
          job_assignments!inner(
            job:jobs!inner(job_site_id)
          )
        `)
                .eq('job_assignments.job.job_site_id', contract.job_site_id)
                .eq('tenant_id', ctx.tenantId)
                .order('company_name', { ascending: true })

            if (error) {
                throw new Error(`Failed to fetch contractors for contract: ${error.message}`)
            }

            // Remove duplicates
            const uniqueContractors = Array.from(new Map(data.map(item => [item.id, item])).values())

            return uniqueContractors
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
                .from('contractors')
                .select(`
          *,
          job_assignments!inner(
            job:jobs!inner(job_site_id)
          )
        `)
                .eq('job_assignments.job.job_site_id', quote.job_site_id)
                .eq('tenant_id', ctx.tenantId)
                .order('company_name', { ascending: true })

            if (error) {
                throw new Error(`Failed to fetch contractors for quote: ${error.message}`)
            }

            // Remove duplicates
            const uniqueContractors = Array.from(new Map(data.map(item => [item.id, item])).values())

            return uniqueContractors
        }),
})

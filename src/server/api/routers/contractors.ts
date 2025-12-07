import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

interface Contractor {
    id: string
    tenant_id: string
    company_name: string
    contact_name: string
    email: string | null
    phone: string | null
    specialties: any
    status: string
    created_at: string
    updated_at: string
    profile_picture_url?: string | null
    area_postcode?: string | null
    area_radius?: number | null
    has_own_transport?: boolean | null
    licenses?: string | null
}

export const contractorsRouter = createTRPCRouter({
    getAll: protectedProcedure
        .input(z.object({
            search: z.string().optional()
        }).optional())
        .query(async ({ ctx, input }) => {
            if (input?.search) {
                const { data, error } = await ctx.db.rpc('search_contractors', {
                    p_tenant_id: ctx.tenantId,
                    p_search_text: input.search
                })

                if (error) {
                    throw new Error(`Failed to search contractors: ${error.message}`)
                }

                return data as Contractor[]
            }

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

    getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
        const [
            { count: totalCount },
            { count: activeCount },
            { count: activeJobsCount },
            { count: completedJobsCount }
        ] = await Promise.all([
            ctx.db.from('contractors').select('*', { count: 'exact', head: true }).eq('tenant_id', ctx.tenantId),
            ctx.db.from('contractors').select('*', { count: 'exact', head: true }).eq('tenant_id', ctx.tenantId).eq('status', 'active'),
            // Active Jobs: Contractors assigned to active jobs
            // Similar logic to workers, we count assignments or unique contractors on active jobs
            // Let's count active assignments for contractors
            ctx.db.from('job_assignments')
                .select('contractor_id', { count: 'exact', head: true })
                .not('contractor_id', 'is', null)
                .eq('status', 'active'),
            // Completed Jobs: Contractors assigned to completed jobs
            ctx.db.from('job_assignments')
                .select('contractor_id', { count: 'exact', head: true })
                .not('contractor_id', 'is', null)
                .eq('status', 'completed')
        ])

        return {
            total: totalCount || 0,
            active: activeCount || 0,
            activeJobs: activeJobsCount || 0,
            completedJobs: completedJobsCount || 0
        }
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
                // New fields
                profilePictureUrl: z.string().optional(),
                areaPostcode: z.string().optional(),
                areaRadius: z.number().optional(),
                hasOwnTransport: z.boolean().optional(),
                licenses: z.string().optional(),
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
                    profile_picture_url: input.profilePictureUrl,
                    area_postcode: input.areaPostcode,
                    area_radius: input.areaRadius,
                    has_own_transport: input.hasOwnTransport,
                    licenses: input.licenses,
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
                // New fields
                profilePictureUrl: z.string().optional(),
                areaPostcode: z.string().optional(),
                areaRadius: z.number().optional(),
                hasOwnTransport: z.boolean().optional(),
                licenses: z.string().optional(),
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
                    profile_picture_url: input.profilePictureUrl,
                    area_postcode: input.areaPostcode,
                    area_radius: input.areaRadius,
                    has_own_transport: input.hasOwnTransport,
                    licenses: input.licenses,
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

    // Unavailability Procedures
    getUnavailability: protectedProcedure
        .input(z.object({ contractorId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('contractor_unavailability')
                .select('*')
                .eq('contractor_id', input.contractorId)
                .eq('tenant_id', ctx.tenantId)
                .order('start_date', { ascending: true })

            if (error) {
                throw new Error(`Failed to fetch availability: ${error.message}`)
            }

            return data
        }),

    getAllUnavailability: protectedProcedure
        .query(async ({ ctx }) => {
            const { data, error } = await ctx.db
                .from('contractor_unavailability')
                .select('*, contractors(company_name, contact_name)')
                .eq('tenant_id', ctx.tenantId)

            if (error) {
                throw new Error(`Failed to fetch all contractor unavailability: ${error.message}`)
            }

            return data
        }),

    addUnavailability: protectedProcedure
        .input(
            z.object({
                contractorId: z.string().uuid(),
                startDate: z.string().or(z.date()),
                endDate: z.string().or(z.date()),
                reason: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('contractor_unavailability')
                .insert({
                    tenant_id: ctx.tenantId,
                    contractor_id: input.contractorId,
                    start_date: new Date(input.startDate).toISOString(),
                    end_date: new Date(input.endDate).toISOString(),
                    reason: input.reason,
                })
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to add availability: ${error.message}`)
            }

            return data
        }),

    removeUnavailability: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { error } = await ctx.db
                .from('contractor_unavailability')
                .delete()
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)

            if (error) {
                throw new Error(`Failed to remove availability: ${error.message}`)
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

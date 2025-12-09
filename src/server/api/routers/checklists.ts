import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

// Define a schema for checklist items
const checklistItemSchema = z.object({
    id: z.string().optional(), // client-generated UUID
    text: z.string(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    isCompleted: z.boolean(),
})

export const checklistsRouter = createTRPCRouter({
    getAll: protectedProcedure
        .input(z.object({
            search: z.string().optional()
        }).optional())
        .query(async ({ ctx, input }) => {
            let query = ctx.db
                .from('checklists')
                .select('*')
                .eq('tenant_id', ctx.tenantId)

            if (input?.search) {
                const search = input.search.toLowerCase()
                // Use Full Text Search on the generated column
                query = query.textSearch('search_vector', search, {
                    type: 'websearch',
                    config: 'english'
                })
            }

            const { data, error } = await query.order('created_at', { ascending: false })

            if (error) {
                throw new Error(`Failed to fetch checklists: ${error.message}`)
            }

            return data
        }),

    getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
        const [
            { count: templatesCount },
            { count: completedCount },
            { count: activeCount },
            { count: totalItemsCount }
        ] = await Promise.all([
            ctx.db.from('checklists').select('*', { count: 'exact', head: true }).eq('tenant_id', ctx.tenantId).eq('is_template', true),
            ctx.db.from('job_checklists').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
            ctx.db.from('job_checklists').select('*', { count: 'exact', head: true }).neq('status', 'completed'),
            ctx.db.from('checklists').select('items')
        ])

        // Calculate total items across all checklists
        // This is a bit more complex as items are stored as JSONB
        // For now, we'll just count the number of checklists as a proxy or fetch all and sum
        // Fetching all might be heavy, so let's stick to a simpler metric or just count checklists
        // Re-reading requirements: "Total Items".
        // Let's try to sum the length of items array if possible, or just return 0 for now if too complex for a simple query
        // Actually, let's fetch all checklists and sum items length in memory for now, assuming not too many checklists
        const { data: allChecklists } = await ctx.db.from('checklists').select('items').eq('tenant_id', ctx.tenantId)
        const totalItems = allChecklists?.reduce((acc, curr) => {
            const items = curr.items as any[]
            return acc + (Array.isArray(items) ? items.length : 0)
        }, 0) || 0

        return {
            templates: templatesCount || 0,
            completed: completedCount || 0,
            active: activeCount || 0,
            totalItems: totalItems
        }
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
                id: z.string().uuid().optional(),
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
                    id: input.id, // Use provided ID if available
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

    getByJobSiteId: protectedProcedure
        .input(z.object({ jobSiteId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            // 1. Get jobs for the site
            const { data: jobs, error: jobsError } = await ctx.db
                .from('jobs')
                .select('id')
                .eq('job_site_id', input.jobSiteId)
                .eq('tenant_id', ctx.tenantId)

            if (jobsError) {
                throw new Error(`Failed to fetch jobs for site: ${jobsError.message}`)
            }

            if (!jobs || jobs.length === 0) {
                return []
            }

            const jobIds = jobs.map(j => j.id)

            // 2. Get checklists for these jobs
            const { data, error } = await ctx.db
                .from('job_checklists')
                .select(`
          *,
          checklists(name, description),
          jobs(title, job_site_id)
        `)
                .in('job_id', jobIds)

            if (error) {
                throw new Error(`Failed to fetch checklists for job site: ${error.message}`)
            }

            return data.map((item: any) => ({
                ...item,
                checklist: item.checklists,
                job: item.jobs,
            }))
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

            // Get jobs for the site
            const { data: jobs, error: jobsError } = await ctx.db
                .from('jobs')
                .select('id')
                .eq('job_site_id', contract.job_site_id)
                .eq('tenant_id', ctx.tenantId)

            if (jobsError || !jobs || jobs.length === 0) {
                return []
            }

            const jobIds = jobs.map(j => j.id)

            // Get checklists for these jobs
            const { data, error } = await ctx.db
                .from('job_checklists')
                .select(`
          *,
          checklists(name, description),
          jobs(title, job_site_id)
        `)
                .in('job_id', jobIds)

            if (error) {
                throw new Error(`Failed to fetch checklists for contract: ${error.message}`)
            }

            return data.map((item: any) => ({
                ...item,
                checklist: item.checklists,
                job: item.jobs,
            }))
        }),

    getByQuoteId: protectedProcedure
        .input(z.object({ quoteId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            // First get the quote to find the job site
            const { data: quote, error: quoteError } = await ctx.db
                .from('quotes')
                .select('job_site_id')
                .eq('id', input.quoteId)
                .single()

            if (quoteError || !quote || !quote.job_site_id) {
                return []
            }

            // Get jobs for the site first
            const { data: jobs, error: jobsError } = await ctx.db
                .from('jobs')
                .select('id')
                .eq('job_site_id', quote.job_site_id)
                .eq('tenant_id', ctx.tenantId)

            if (jobsError || !jobs || jobs.length === 0) {
                return []
            }

            const jobIds = jobs.map(j => j.id)

            // Then fetch checklists for these jobs
            const { data, error } = await ctx.db
                .from('job_checklists')
                .select(`
          *,
          checklists(name, description),
          jobs(title, job_site_id)
        `)
                .in('job_id', jobIds)

            if (error) {
                console.error('Error fetching checklists for quote:', error)
                throw new Error(`Failed to fetch checklists for quote: ${error.message}`)
            }

            return data.map((item: any) => ({
                ...item,
                checklist: item.checklists,
                job: item.jobs,
            }))
        }),
})

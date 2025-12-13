import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const customerPortalRouter = createTRPCRouter({
    getProfile: protectedProcedure
        .query(async ({ ctx }) => {
            if (ctx.impersonatedEntity?.type === 'customer') {
                const { data: customer } = await ctx.db
                    .from('customers')
                    .select('*')
                    .eq('id', ctx.impersonatedEntity.id)
                    .single();
                return customer;
            }

            const { data: customer } = await ctx.db
                .from('customers')
                .select('*')
                .eq('user_id', ctx.user.id)
                .single();

            return customer;
        }),

    getDashboardStats: protectedProcedure
        .query(async ({ ctx }) => {
            // 1. Get Customer ID
            let customerId = ctx.impersonatedEntity?.type === 'customer' ? ctx.impersonatedEntity.id : null;

            if (!customerId) {
                const { data: customer } = await ctx.db
                    .from('customers')
                    .select('id')
                    .eq('user_id', ctx.user.id)
                    .single();
                customerId = customer?.id;
            }

            if (!customerId) return { activeJobs: 0, openQuotes: 0, totalSpent: 0 };

            // 2. Active Jobs (not completed or cancelled)
            const { count: activeJobs } = await ctx.db
                .from('jobs')
                .select('id', { count: 'exact', head: true })
                .eq('customer_id', customerId)
                .not('status', 'in', '("completed","cancelled")');

            // 3. Open Quotes (draft, sent, viewed - not accepted/rejected)
            // Need to check quotes table schema or assume standard logic
            // Assuming default 'draft', 'sent', 'viewed', 'accepted', 'rejected'
            const { count: openQuotes } = await ctx.db
                .from('quotes')
                .select('id', { count: 'exact', head: true })
                .eq('customer_id', customerId)
                .in('status', ['draft', 'sent', 'viewed']);

            return {
                activeJobs: activeJobs || 0,
                openQuotes: openQuotes || 0,
                totalSpent: 0 // Placeholder for now
            };
        }),

    getActiveJobs: protectedProcedure
        .input(z.object({ limit: z.number().optional() }))
        .query(async ({ ctx, input }) => {
            let customerId = ctx.impersonatedEntity?.type === 'customer' ? ctx.impersonatedEntity.id : null;

            if (!customerId) {
                const { data: customer } = await ctx.db
                    .from('customers')
                    .select('id')
                    .eq('user_id', ctx.user.id)
                    .single();
                customerId = customer?.id;
            }

            if (!customerId) return [];

            let query = ctx.db
                .from('jobs')
                .select(`
                    *,
                    job_sites (
                        name,
                        address,
                        city
                    )
                `)
                .eq('customer_id', customerId)
                .not('status', 'in', '("completed","cancelled")')
                .order('start_time', { ascending: true });

            if (input.limit) {
                query = query.limit(input.limit);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching customer active jobs:', error);
                return [];
            }

            // Flatten/Clean if needed, similar to worker router
            return data.map(job => {
                const site = Array.isArray(job.job_sites) ? job.job_sites[0] : job.job_sites;
                return {
                    ...job,
                    job_sites: site
                };
            });
        }),

    getOpenQuotes: protectedProcedure
        .input(z.object({ limit: z.number().optional() }))
        .query(async ({ ctx, input }) => {
            let customerId = ctx.impersonatedEntity?.type === 'customer' ? ctx.impersonatedEntity.id : null;

            if (!customerId) {
                const { data: customer } = await ctx.db
                    .from('customers')
                    .select('id')
                    .eq('user_id', ctx.user.id)
                    .single();
                customerId = customer?.id;
            }

            if (!customerId) return [];

            let query = ctx.db
                .from('quotes')
                .select('*')
                .eq('customer_id', customerId)
                .in('status', ['draft', 'sent', 'viewed'])
                .order('created_at', { ascending: false });

            if (input.limit) {
                query = query.limit(input.limit);
            }

            const { data, error } = await query;

            if (error) return [];
            return data;
        }),

    getJobDetails: protectedProcedure
        .input(z.object({ jobId: z.string() }))
        .query(async ({ ctx, input }) => {
            let customerId = ctx.impersonatedEntity?.type === 'customer' ? ctx.impersonatedEntity.id : null;

            if (!customerId) {
                const { data: customer } = await ctx.db
                    .from('customers')
                    .select('id')
                    .eq('user_id', ctx.user.id)
                    .single();
                customerId = customer?.id;
            }

            if (!customerId) throw new TRPCError({ code: 'UNAUTHORIZED' });

            const { data: job } = await ctx.db
                .from('jobs')
                .select(`
                    *,
                    job_sites (*)
                `)
                .eq('id', input.jobId)
                .eq('customer_id', customerId) // Security check
                .single();

            if (!job) throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });

            return job;
        }),

    getJobSites: protectedProcedure
        .query(async ({ ctx }) => {
            let customerId = ctx.impersonatedEntity?.type === 'customer' ? ctx.impersonatedEntity.id : null;

            if (!customerId) {
                const { data: customer } = await ctx.db
                    .from('customers')
                    .select('id')
                    .eq('user_id', ctx.user.id)
                    .single();
                customerId = customer?.id;
            }

            if (!customerId) return [];

            const { data: sites } = await ctx.db
                .from('job_sites')
                .select('id, name, address, city')
                .eq('customer_id', customerId);

            return sites || [];
        }),

    requestService: protectedProcedure
        .input(z.object({
            title: z.string().min(1),
            description: z.string().optional(),
            jobSiteId: z.string().optional()
        }))
        .mutation(async ({ ctx, input }) => {
            let customerId = ctx.impersonatedEntity?.type === 'customer' ? ctx.impersonatedEntity.id : null;

            if (!customerId) {
                const { data: customer } = await ctx.db
                    .from('customers')
                    .select('id')
                    .eq('user_id', ctx.user.id)
                    .single();
                customerId = customer?.id;
            }

            if (!customerId) throw new TRPCError({ code: 'UNAUTHORIZED' });

            const { data, error } = await ctx.db
                .from('quotes')
                .insert({
                    tenant_id: ctx.tenantId,
                    customer_id: customerId,
                    title: input.title,
                    description: input.description,
                    job_site_id: input.jobSiteId || null,
                    status: 'draft',
                    total_amount: 0 // Default
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating service request:', error);
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to submit request' });
            }

            return data;
        })
});

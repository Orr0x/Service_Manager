
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const reportsRouter = createTRPCRouter({
    getAll: protectedProcedure
        .query(async ({ ctx }) => {
            // Get current worker ID (handling impersonation)
            let workerId: string | null = null;
            if (ctx.impersonatedEntity?.type === 'worker') {
                workerId = ctx.impersonatedEntity.id;
            } else if (ctx.impersonatedEntity?.type === 'contractor') {
                // Contractors might not have reports table access yet, but using same logic
                // Actually schema says worker_reports(worker_id), so only workers.
                // We'll ignore contractors for now or assume they map if needed.
                // For now, restrict to workers.
                return [];
            } else {
                const { data: worker } = await ctx.db
                    .from('workers')
                    .select('id')
                    .eq('user_id', ctx.user.id)
                    .single();
                workerId = worker?.id || null;
            }

            if (!workerId) return [];

            const { data, error } = await ctx.db
                .from('worker_reports')
                .select(`
                    *,
                    jobs (
                        title, 
                        customers ( business_name, contact_name )
                    )
                `)
                .eq('worker_id', workerId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching reports:', error);
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch reports' });
            }

            return data;
        }),

    create: protectedProcedure
        .input(z.object({
            title: z.string().min(1),
            description: z.string().min(1),
            type: z.enum(['maintenance', 'damage', 'incident', 'other']),
            jobId: z.string().optional(), // Optional
        }))
        .mutation(async ({ ctx, input }) => {
            let workerId: string | null = null;
            if (ctx.impersonatedEntity?.type === 'worker') {
                workerId = ctx.impersonatedEntity.id;
            } else {
                const { data: worker } = await ctx.db
                    .from('workers')
                    .select('id')
                    .eq('user_id', ctx.user.id)
                    .single();
                workerId = worker?.id || null;
            }

            if (!workerId) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a worker' });

            const { data, error } = await ctx.db
                .from('worker_reports')
                .insert({
                    tenant_id: ctx.tenantId,
                    worker_id: workerId,
                    title: input.title,
                    description: input.description,
                    type: input.type,
                    job_id: input.jobId,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating report:', error);
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create report' });
            }

            return data;
        })
});

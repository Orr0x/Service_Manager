import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

export const dashboardRouter = createTRPCRouter({
    getStats: protectedProcedure
        .input(z.object({
            range: z.enum(['today', 'week', 'month', 'year', 'all']).default('today')
        }))
        .query(async ({ ctx, input }) => {
            const now = new Date();
            let startDate: string | undefined;
            let endDate: string | undefined;

            switch (input.range) {
                case 'today':
                    startDate = startOfDay(now).toISOString();
                    endDate = endOfDay(now).toISOString();
                    break;
                case 'week':
                    startDate = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
                    endDate = endOfWeek(now, { weekStartsOn: 1 }).toISOString();
                    break;
                case 'month':
                    startDate = startOfMonth(now).toISOString();
                    endDate = endOfMonth(now).toISOString();
                    break;
                case 'year':
                    startDate = startOfYear(now).toISOString();
                    endDate = endOfYear(now).toISOString();
                    break;
                case 'all':
                    startDate = undefined;
                    endDate = undefined;
                    break;
            }

            const tenantId = ctx.user.user_metadata.tenant_id;

            // Helper to apply range filter
            const applyRange = (query: any, field: string) => {
                if (startDate && endDate) {
                    return query.gte(field, startDate).lte(field, endDate);
                }
                return query;
            };

            // Parallel queries
            const [
                jobsTotal,
                jobsScheduled,
                jobsInProgress,
                jobsCompleted,
                revenueData,
                quotesData,
                laborData
            ] = await Promise.all([
                // Total Jobs (in range)
                applyRange(
                    ctx.db.from('jobs').select('id', { count: 'exact' }).eq('tenant_id', tenantId),
                    'created_at' // Using created_at for "Total Jobs" metric in range
                ),

                // Scheduled (Status = Scheduled) - In Range (using start_time)
                applyRange(
                    ctx.db.from('jobs').select('id', { count: 'exact' }).eq('tenant_id', tenantId).eq('status', 'Scheduled'),
                    'start_date' // Changed from start_time to start_date based on original code's field usage
                ),

                // In Progress
                applyRange(
                    ctx.db.from('jobs').select('id', { count: 'exact' }).eq('tenant_id', tenantId).eq('status', 'In Progress'),
                    'start_date' // Changed from start_time to start_date based on original code's field usage
                ),

                // Completed
                applyRange(
                    ctx.db.from('jobs').select('id', { count: 'exact' }).eq('tenant_id', tenantId).eq('status', 'Completed'),
                    'updated_at' // Use updated_at for completion, consistent with original code's approximation
                ),

                // Revenue (Sum of Invoices in range)
                applyRange(
                    ctx.db.from('invoices').select('total_amount').eq('tenant_id', tenantId),
                    'created_at'
                ),

                // Quotes Value (Sum of Quotes in range)
                applyRange(
                    ctx.db.from('quotes').select('total_amount').eq('tenant_id', tenantId),
                    'created_at'
                ),

                // Jobs with Assignments for Labor Cost Calculation
                // We need more complex filtering here: jobs that *occur* during the range
                // For simplicity/performance MVP: Calculate labor for jobs *scheduled (start_time)* or *completed (end_time)* in range.
                // Or to match user request: "filtering should show the correct calculations" based on range.
                // Let's use jobs that have start_time in the range for now as a proxy for "active/scheduled work".
                applyRange(
                    ctx.db.from('jobs')
                        .select(`
                            start_time, 
                            end_time, 
                            job_assignments(
                                width:workers(hourly_rate)
                            )
                        `)
                        .eq('tenant_id', tenantId)
                        .not('start_time', 'is', null) // start_time IS NOT NULL (Correct syntax might vary, using filter)
                        .not('end_time', 'is', null),  // end_time IS NOT NULL
                    'start_time'
                )
            ]);

            const revenue = revenueData.data?.reduce((sum: number, inv: any) => sum + (Number(inv.total_amount) || 0), 0) || 0;
            const quotesValue = quotesData.data?.reduce((sum: number, q: any) => sum + (Number(q.total_amount) || 0), 0) || 0;

            // Calculate Labor Cost
            let laborCost = 0;
            if (laborData.data) {
                laborData.data.forEach((job: any) => {
                    const start = new Date(job.start_time).getTime();
                    const end = new Date(job.end_time).getTime();
                    const durationHours = (end - start) / (1000 * 60 * 60);

                    if (durationHours > 0 && job.job_assignments) {
                        job.job_assignments.forEach((assignment: any) => {
                            // assignment.workers is an array due to relation, take first if exists
                            // With nested select: workers(hourly_rate).
                            // The structure returned by Supabase for 'workers(hourly_rate)' 
                            // inside job_assignments might vary based on join type.
                            // Usually it's an object if 1:1 or 1:Many (worker is 1 here).
                            const worker = assignment.workers;
                            const rate = Number(worker?.hourly_rate) || 0;
                            laborCost += durationHours * rate;
                        });
                    }
                });
            }

            return {
                jobs: {
                    total: jobsTotal.count || 0,
                    scheduled: jobsScheduled.count || 0,
                    inProgress: jobsInProgress.count || 0,
                    completed: jobsCompleted.count || 0,
                },
                revenue: revenue,
                quotesValue: quotesValue,
                laborCost: laborCost
            };
        }),
});

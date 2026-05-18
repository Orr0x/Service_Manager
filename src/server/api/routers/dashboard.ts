import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

const dashboardRangeSchema = z.enum(['today', 'week', 'month', 'year', 'all', 'custom']).default('today')

export const dashboardRouter = createTRPCRouter({
    getStats: protectedProcedure
        .input(z.object({
            range: dashboardRangeSchema,
            startDate: z.string().optional(),
            endDate: z.string().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const now = new Date();
            let startDate: Date | null = null;
            let endDate: Date | null = null;

            switch (input.range) {
                case 'today':
                    startDate = startOfDay(now);
                    endDate = endOfDay(now);
                    break;
                case 'week':
                    startDate = startOfWeek(now, { weekStartsOn: 1 });
                    endDate = endOfWeek(now, { weekStartsOn: 1 });
                    break;
                case 'month':
                    startDate = startOfMonth(now);
                    endDate = endOfMonth(now);
                    break;
                case 'year':
                    startDate = startOfYear(now);
                    endDate = endOfYear(now);
                    break;
                case 'custom':
                    startDate = input.startDate ? startOfDay(new Date(input.startDate)) : null;
                    endDate = input.endDate ? endOfDay(new Date(input.endDate)) : null;
                    break;
                case 'all':
                    startDate = null;
                    endDate = null;
                    break;
            }

            const tenantId = ctx.tenantId;

            const isInRange = (value?: string | null) => {
                if (!startDate && !endDate) return true;
                if (!value) return false;

                const date = new Date(value);
                if (Number.isNaN(date.getTime())) return false;
                if (startDate && date < startDate) return false;
                if (endDate && date > endDate) return false;

                return true;
            };

            const getJobRangeDate = (job: any) => job.start_time || job.created_at;
            const getCompletedRangeDate = (job: any) => job.actual_end_time || job.end_time || job.updated_at || job.start_time;
            const toMillis = (value?: string | null) => {
                if (!value) return 0;
                const date = new Date(value);
                return Number.isNaN(date.getTime()) ? 0 : date.getTime();
            };
            const { data: jobsData, error: jobsError } = await ctx.db
                .from('jobs')
                .select(`
                    id,
                    title,
                    status,
                    created_at,
                    updated_at,
                    start_time,
                    end_time,
                    job_site_id,
                    actual_end_time,
                    job_sites (
                        name,
                        address,
                        city
                    ),
                    job_assignments (
                        worker_id,
                        workers (
                            first_name,
                            last_name,
                            hourly_rate
                        ),
                        contractors (
                            company_name,
                            contact_name
                        )
                    )
                `)
                .eq('tenant_id', tenantId)
                .neq('status', 'cancelled');

            if (jobsError) {
                throw new Error(`Failed to fetch dashboard jobs: ${jobsError.message}`);
            }

            const jobs = jobsData || [];
            const rangedJobs = jobs.filter((job) => isInRange(getJobRangeDate(job)));
            const unscheduledJobs = rangedJobs.filter((job) => isUnscheduledJob(job));
            const scheduledJobs = rangedJobs.filter((job) => job.status === 'scheduled');
            const inProgressJobs = rangedJobs.filter((job) => job.status === 'in_progress');
            const completedJobs = jobs.filter((job) => job.status === 'completed' && isInRange(getCompletedRangeDate(job)));
            const scheduledWorkerIds = new Set(
                scheduledJobs
                    .flatMap((job) => job.job_assignments || [])
                    .map((assignment) => assignment.worker_id)
                    .filter(Boolean)
            );
            const rangedJobSiteIds = new Set(rangedJobs.map((job) => job.job_site_id).filter(Boolean));

            const [
                revenueData,
                quotesData,
            ] = await Promise.all([
                applyServerRange(
                    ctx.db.from('invoices').select('total_amount').eq('tenant_id', tenantId),
                    startDate,
                    endDate,
                    'created_at'
                ),
                applyServerRange(
                    ctx.db.from('quotes').select('total_amount').eq('tenant_id', tenantId),
                    startDate,
                    endDate,
                    'created_at'
                ),
            ]);

            if (revenueData.error) {
                throw new Error(`Failed to fetch dashboard invoice totals: ${revenueData.error.message}`);
            }

            if (quotesData.error) {
                throw new Error(`Failed to fetch dashboard quote totals: ${quotesData.error.message}`);
            }

            const revenue = revenueData.data?.reduce((sum: number, inv: any) => sum + (Number(inv.total_amount) || 0), 0) || 0;
            const quotesValue = quotesData.data?.reduce((sum: number, q: any) => sum + (Number(q.total_amount) || 0), 0) || 0;

            const laborCost = rangedJobs.reduce((sum, job: any) => {
                const start = toMillis(job.start_time);
                const end = toMillis(job.end_time);
                const durationHours = start && end && end > start ? (end - start) / (1000 * 60 * 60) : 0;

                if (!durationHours) return sum;

                const assignmentCost = (job.job_assignments || []).reduce((assignmentSum: number, assignment: any) => {
                    const worker = Array.isArray(assignment.workers) ? assignment.workers[0] : assignment.workers;
                    return assignmentSum + durationHours * (Number(worker?.hourly_rate) || 0);
                }, 0);

                return sum + assignmentCost;
            }, 0);

            return {
                jobs: {
                    total: rangedJobs.length,
                    unscheduled: unscheduledJobs.length,
                    scheduled: scheduledJobs.length,
                    inProgress: inProgressJobs.length,
                    completed: completedJobs.length,
                },
                workers: {
                    scheduled: scheduledWorkerIds.size,
                },
                jobSites: {
                    inRange: rangedJobSiteIds.size,
                },
                revenue: revenue,
                quotesValue: quotesValue,
                laborCost: laborCost
            };
        }),
});

function applyServerRange(query: any, startDate: Date | null, endDate: Date | null, field: string) {
    if (startDate) {
        query = query.gte(field, startDate.toISOString());
    }

    if (endDate) {
        query = query.lte(field, endDate.toISOString());
    }

    return query;
}

function isUnscheduledJob(job: any) {
    return !job.start_time || job.status === 'draft' || job.status === 'pending'
}

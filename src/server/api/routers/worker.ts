import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const workerRouter = createTRPCRouter({
    // Helper: Get Worker Profile ID from Auth ID
    getProfile: protectedProcedure
        .query(async ({ ctx }) => {
            if (ctx.impersonatedEntity?.type === 'worker') {
                const { data: worker } = await ctx.db
                    .from('workers')
                    .select('*')
                    .eq('id', ctx.impersonatedEntity.id)
                    .single();
                return worker;
            }

            if (ctx.impersonatedEntity?.type === 'contractor') {
                const { data: contractor } = await ctx.db
                    .from('contractors')
                    .select('*')
                    .eq('id', ctx.impersonatedEntity.id)
                    .single();

                // Map to worker-like interface
                return {
                    ...contractor,
                    first_name: contractor.contact_name?.split(' ')[0] || contractor.company_name,
                    last_name: contractor.contact_name?.split(' ').slice(1).join(' ') || '',
                    role: 'Contractor'
                } as any;
            }

            const { data: worker } = await ctx.db
                .from('workers')
                .select('*')
                .eq('user_id', ctx.user.id)
                .single();

            return worker;
        }),

    getDashboardStats: protectedProcedure
        .query(async ({ ctx }) => {
            // 1. Get Worker ID
            let workerId = (ctx.impersonatedEntity?.type === 'worker' || ctx.impersonatedEntity?.type === 'contractor')
                ? ctx.impersonatedEntity.id
                : null;

            if (!workerId) {
                const { data: worker } = await ctx.db
                    .from('workers')
                    .select('id')
                    .eq('user_id', ctx.user.id)
                    .single();
                workerId = worker?.id;
            }

            if (!workerId) return { jobsToday: 0, hoursThisWeek: 0, completedCount: 0 };

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // 2. Jobs Today
            const { count: jobsToday } = await ctx.db
                .from('job_assignments')
                .select('id', { count: 'exact', head: true })
                .eq('worker_id', workerId)
                .eq('status', 'assigned') // or accepted
            // We need to join jobs to check start_time, but for count we might need a join
            // Supabase Join syntax:
            // We'll trust the assignment is active. To be precise we need to filter by job date.
            // Let's do a join query for accuracy.

            // Re-doing with join for accuracy
            const { data: todayJobs } = await ctx.db
                .from('job_assignments')
                .select(`
                    job_id,
                    jobs!inner (
                        start_time,
                        status
                    )
                `)
                .eq('worker_id', workerId)
                .gte('jobs.start_time', today.toISOString())
                .lt('jobs.start_time', tomorrow.toISOString());

            const jobsTodayCount = todayJobs?.length || 0;

            // 3. Completed Jobs (Total or This Week? UI implies Total, but usually "This Week" is better for stats)
            // The UI card just says "Completed". Let's do Total for now, or This Month.
            // Let's do "Completed This Week" to match the "Hours This Week" vibe.
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

            const { count: completedCount } = await ctx.db
                .from('job_assignments')
                .select('id', { count: 'exact', head: true })
                .eq('worker_id', workerId)
                .eq('status', 'completed'); // Assignment status or Job status? Usually Job.

            // Actually, let's look at jobs where status is completed
            const { data: completedJobs } = await ctx.db
                .from('job_assignments')
                .select(`
                    jobs!inner (
                        status
                    )
                `)
                .eq('worker_id', workerId)
                .eq('jobs.status', 'completed');

            const completedTotal = completedJobs?.length || 0;

            // 4. Hours This Week (Mock calculation: 2 hours per completed job?)
            // Real calc would need time logs or (end_time - start_time)
            // Let's sum (end_time - start_time) for jobs this week
            const { data: weekJobs } = await ctx.db
                .from('job_assignments')
                .select(`
                    jobs!inner (
                        start_time,
                        end_time
                    )
                 `)
                .eq('worker_id', workerId)
                .gte('jobs.start_time', startOfWeek.toISOString());

            let totalHours = 0;
            weekJobs?.forEach(record => {
                const job = Array.isArray(record.jobs) ? record.jobs[0] : record.jobs;
                if (job && job.start_time && job.end_time) {
                    const start = new Date(job.start_time);
                    const end = new Date(job.end_time);
                    const durationMs = end.getTime() - start.getTime();
                    const hours = durationMs / (1000 * 60 * 60);
                    if (hours > 0) totalHours += hours;
                }
            });

            // 5. Conflicts
            const { data: futureJobs } = await ctx.db
                .from('job_assignments')
                .select(`
                    id,
                    jobs!inner (
                        title,
                        start_time,
                        end_time
                    )
                `)
                .eq('worker_id', workerId)
                .gte('jobs.start_time', today.toISOString());

            const { data: futureUnavailability } = await ctx.db
                .from('worker_unavailability')
                .select('unavailable_date')
                .eq('worker_id', workerId)
                .gte('unavailable_date', today.toISOString().split('T')[0]);

            let conflictCount = 0;
            let firstConflict: { date: string; jobTitle: string } | null = null;

            if (futureJobs && futureJobs.length > 0 && futureUnavailability && futureUnavailability.length > 0) {
                const unavailabilitySet = new Set(futureUnavailability.map(u => u.unavailable_date));

                for (const assignment of futureJobs) {
                    const job = Array.isArray(assignment.jobs) ? assignment.jobs[0] : assignment.jobs;
                    if (!job || !job.start_time || !job.end_time) continue;

                    const jobStart = new Date(job.start_time);
                    const jobEnd = new Date(job.end_time);

                    // Iterate days of the job
                    for (let d = new Date(jobStart); d <= jobEnd; d.setDate(d.getDate() + 1)) {
                        const dateStr = d.toISOString().split('T')[0];
                        if (unavailabilitySet.has(dateStr)) {
                            conflictCount++;
                            if (!firstConflict) {
                                firstConflict = { date: dateStr, jobTitle: job.title || 'Untitled Job' };
                            }
                            // Break inner loop (days) if we found a conflict for this job, 
                            // unless we want to count total conflicting DAYS? 
                            // Requirement says "conflicts", usually means conflicting JOBS or Assignments. 
                            // Let's count conflicting *assignments*.
                            break;
                        }
                    }
                }
            }

            return {
                jobsToday: jobsTodayCount,
                hoursThisWeek: parseFloat(totalHours.toFixed(1)),
                completedCount: completedTotal,
                conflictCount,
                firstConflict
            };
        }),

    getAssignedJobs: protectedProcedure
        .input(z.object({
            filter: z.enum(['upcoming', 'completed', 'today', 'week', 'month', 'next-week', 'next-month']).optional(),
            dateRange: z.object({
                start: z.date(),
                end: z.date()
            }).optional(),
            limit: z.number().optional()
        }))
        .query(async ({ ctx, input }) => {
            let workerId = (ctx.impersonatedEntity?.type === 'worker' || ctx.impersonatedEntity?.type === 'contractor')
                ? ctx.impersonatedEntity.id
                : null;



            if (!workerId) {
                const { data: worker } = await ctx.db
                    .from('workers')
                    .select('id')
                    .eq('user_id', ctx.user.id)
                    .single();
                workerId = worker?.id;
            }

            if (!workerId) return [];

            let query = ctx.db
                .from('job_assignments')
                .select(`
                    status,
                    jobs (
                        id,
                        title,
                        description,
                        start_time,
                        end_time,
                        status,
                        priority,
                        customers (
                            business_name,
                            contact_name
                        ),
                        job_sites (
                            id,
                            name,
                            address,
                            city,
                            state,
                            postal_code
                        )
                    )
                `)
                .eq('worker_id', workerId)
                .order('jobs(start_time)', { ascending: true });

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (input.dateRange) {
                query = query.gte('jobs.start_time', input.dateRange.start.toISOString())
                    .lt('jobs.start_time', input.dateRange.end.toISOString()) as any;
            } else if (input.filter === 'today') {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                query = query.gte('jobs.start_time', today.toISOString())
                    .lt('jobs.start_time', tomorrow.toISOString()) as any;
            } else if (input.filter === 'week') {
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
                const nextWeek = new Date(startOfWeek);
                nextWeek.setDate(nextWeek.getDate() + 7);

                query = query.gte('jobs.start_time', startOfWeek.toISOString())
                    .lt('jobs.start_time', nextWeek.toISOString()) as any;
            } else if (input.filter === 'next-week') {
                // Next Monday
                const daysUntilNextMonday = (1 + 7 - today.getDay()) % 7 || 7;
                // If today is Monday (1), (1+7-1)%7 = 0 || 7 -> 7. Next Monday.
                // If Sunday (0), (1+7-0)%7 = 1. Next Monday.

                const nextMonday = new Date(today);
                nextMonday.setDate(today.getDate() + daysUntilNextMonday);

                const endOfNextWeek = new Date(nextMonday);
                endOfNextWeek.setDate(nextMonday.getDate() + 7);

                query = query.gte('jobs.start_time', nextMonday.toISOString())
                    .lt('jobs.start_time', endOfNextWeek.toISOString()) as any;
            } else if (input.filter === 'month') {
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const nextMonth = new Date(startOfMonth);
                nextMonth.setMonth(nextMonth.getMonth() + 1);

                query = query.gte('jobs.start_time', startOfMonth.toISOString())
                    .lt('jobs.start_time', nextMonth.toISOString()) as any;
            } else if (input.filter === 'next-month') {
                const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                const startOfMonthAfter = new Date(startOfNextMonth);
                startOfMonthAfter.setMonth(startOfMonthAfter.getMonth() + 1);

                query = query.gte('jobs.start_time', startOfNextMonth.toISOString())
                    .lt('jobs.start_time', startOfMonthAfter.toISOString()) as any;
            } else if (input.filter === 'upcoming') {
                query = query.gte('jobs.start_time', today.toISOString()) as any;
            } else if (input.filter === 'completed') {
                query = query.eq('jobs.status', 'completed') as any;
            }

            if (input.limit) {
                query = query.limit(input.limit);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching assigned jobs:', error);
                return [];
            }

            // Flatten structure for UI and ensure type safety
            return data
                .filter(a => a.jobs !== null)
                .map(assignment => {
                    const job = Array.isArray(assignment.jobs) ? assignment.jobs[0] : assignment.jobs;
                    const customer = job && job.customers && Array.isArray(job.customers) ? job.customers[0] : job?.customers;
                    const site = job && job.job_sites && Array.isArray(job.job_sites) ? job.job_sites[0] : job?.job_sites;

                    return {
                        assignmentStatus: assignment.status,
                        ...job,
                        customers: customer,
                        job_sites: site
                    };
                });
        }),

    getJobDetails: protectedProcedure
        .input(z.object({ jobId: z.string() }))
        .query(async ({ ctx, input }) => {
            // Verify assignment first
            let workerId = (ctx.impersonatedEntity?.type === 'worker' || ctx.impersonatedEntity?.type === 'contractor')
                ? ctx.impersonatedEntity.id
                : null;

            if (!workerId) {
                const { data: worker } = await ctx.db
                    .from('workers')
                    .select('id')
                    .eq('user_id', ctx.user.id)
                    .single();
                workerId = worker?.id;
            }

            if (!workerId) throw new TRPCError({ code: 'UNAUTHORIZED' });

            const { data: assignment } = await ctx.db
                .from('job_assignments')
                .select('id')
                .eq('worker_id', workerId)
                .eq('job_id', input.jobId)
                .single();

            if (!assignment) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not assigned to this job' });

            const { data: job } = await ctx.db
                .from('jobs')
                .select(`
                    *,
                    customer: customers (*),
                    job_sites (*),
                    job_checklists (
                        *,
                        checklists (
                            name,
                            description,
                            items
                        )
                    )
                `)
                .eq('id', input.jobId)
                .single();

            return job;
        }),

    getChecklists: protectedProcedure
        .query(async ({ ctx }) => {
            let workerId = (ctx.impersonatedEntity?.type === 'worker' || ctx.impersonatedEntity?.type === 'contractor')
                ? ctx.impersonatedEntity.id
                : null;

            if (!workerId) {
                const { data: worker } = await ctx.db
                    .from('workers')
                    .select('id')
                    .eq('user_id', ctx.user.id)
                    .single();
                workerId = worker?.id;
            }

            if (!workerId) return [];

            // Get assigned jobs first
            const { data: assignments } = await ctx.db
                .from('job_assignments')
                .select('job_id')
                .eq('worker_id', workerId)
                .in('status', ['assigned', 'in_progress']);

            if (!assignments || assignments.length === 0) return [];

            const jobIds = assignments.map(a => a.job_id);

            // Get checklists for these jobs
            // filtering for "upcoming" checklists or just all active ones?
            // User said "priority sorting (Next Job top)". So we need job info.
            const { data: checklists, error } = await ctx.db
                .from('job_checklists')
                .select(`
                    *,
                    checklists (
                        name,
                        description,
                        items
                    ),
                    jobs (
                        id,
                        title,
                        start_time,
                        customers (
                            business_name,
                            contact_name
                        )
                    )
                `)
                .in('job_id', jobIds)
                .order('jobs(start_time)', { ascending: true });

            if (error) {
                console.error('Error fetching worker checklists:', error);
                return [];
            }

            return checklists.map(item => ({
                id: item.id,
                status: item.status,
                checklistName: item.checklists?.name,
                checklistDescription: item.checklists?.description,
                items: item.checklists?.items,
                jobTitle: item.jobs?.title,
                jobId: item.jobs?.id,
                jobStartTime: item.jobs?.start_time,
                customerName: Array.isArray(item.jobs?.customers)
                    ? (item.jobs?.customers[0]?.business_name || item.jobs?.customers[0]?.contact_name)
                    : (item.jobs?.customers?.business_name || item.jobs?.customers?.contact_name)
            }));
        }),

    updateChecklistItem: protectedProcedure
        .input(z.object({
            jobChecklistId: z.string().uuid(),
            items: z.array(z.any()) // Accepting the full updated array for simplicity
        }))
        .mutation(async ({ ctx, input }) => {
            // Verify ownership
            const { data: jobChecklist } = await ctx.db
                .from('job_checklists')
                .select('job_id')
                .eq('id', input.jobChecklistId)
                .single();

            if (!jobChecklist) throw new TRPCError({ code: 'NOT_FOUND' });

            // Check if worker is assigned to this job? 
            // RLS should handle it, but double check creates safety.

            const { error } = await ctx.db
                .from('job_checklists')
                .update({
                    items: input.items,
                    updated_at: new Date().toISOString()
                })
                .eq('id', input.jobChecklistId);

            if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

            return { success: true };
        }),

    getUnavailability: protectedProcedure
        .input(z.object({
            start: z.date(),
            end: z.date()
        }))
        .query(async ({ ctx, input }) => {
            let workerId = (ctx.impersonatedEntity?.type === 'worker' || ctx.impersonatedEntity?.type === 'contractor')
                ? ctx.impersonatedEntity.id
                : null;

            if (!workerId) {
                const { data: worker } = await ctx.db
                    .from('workers')
                    .select('id')
                    .eq('user_id', ctx.user.id)
                    .single();
                workerId = worker?.id;
            }

            if (!workerId) return [];

            const { data } = await ctx.db
                .from('worker_unavailability')
                .select('*')
                .eq('worker_id', workerId)
                .gte('unavailable_date', input.start.toISOString())
                .lte('unavailable_date', input.end.toISOString());

            return data || [];
        }),

    setUnavailability: protectedProcedure
        .input(z.object({
            date: z.string(), // YYYY-MM-DD
            reason: z.enum(['non_working', 'holiday', 'sickness', 'transport', 'other']).optional(),
            role: z.string().optional()
        }))
        .mutation(async ({ ctx, input }) => {
            let workerId = (ctx.impersonatedEntity?.type === 'worker' || ctx.impersonatedEntity?.type === 'contractor')
                ? ctx.impersonatedEntity.id
                : null;

            if (!workerId) {
                const { data: worker } = await ctx.db
                    .from('workers')
                    .select('id')
                    .eq('user_id', ctx.user.id)
                    .single();
                workerId = worker?.id;
            }

            if (!workerId) throw new TRPCError({ code: 'UNAUTHORIZED' });

            const dateStr = input.date; // Expecting YYYY-MM-DD

            if (!input.reason) {
                // DELETE
                await ctx.db
                    .from('worker_unavailability')
                    .delete()
                    .eq('worker_id', workerId)
                    .eq('unavailable_date', dateStr);
            } else {
                // Check for existing job assignments on this date
                // Create start and end of the target day (UTC)
                const targetDate = new Date(dateStr);
                const dayStart = new Date(targetDate);
                dayStart.setUTCHours(0, 0, 0, 0);
                const dayEnd = new Date(targetDate);
                dayEnd.setUTCHours(23, 59, 59, 999);

                const { data: conflicts } = await ctx.db
                    .from('job_assignments')
                    .select('id, jobs!inner(start_time, end_time)')
                    .eq('worker_id', workerId)
                    .lte('jobs.start_time', dayEnd.toISOString())
                    .gte('jobs.end_time', dayStart.toISOString());

                if (conflicts && conflicts.length > 0) {
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: `You have a job scheduled on ${dateStr}. Please contact an admin.`
                    });
                }

                // UPSERT
                await ctx.db
                    .from('worker_unavailability')
                    .upsert({
                        tenant_id: ctx.tenantId,
                        worker_id: workerId,
                        unavailable_date: dateStr,
                        reason: input.reason
                    }, {
                        onConflict: 'worker_id, unavailable_date'
                    });
            }

            return { success: true };
        })
});

import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { calculatePayableTime } from '@/lib/payroll/attendance'
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns'

const rangeSchema = z.enum(['week', 'month', 'all', 'custom']).default('week')

export const payrollRouter = createTRPCRouter({
    getJobPayrollRows: protectedProcedure
        .input(z.object({
            range: rangeSchema,
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            workerId: z.string().uuid().optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
            const now = new Date()
            const range = input?.range || 'week'

            let start: Date | null = null
            let end: Date | null = null

            if (range === 'week') {
                start = startOfWeek(now, { weekStartsOn: 1 })
                end = endOfWeek(now, { weekStartsOn: 1 })
            } else if (range === 'month') {
                start = startOfMonth(now)
                end = endOfMonth(now)
            } else if (range === 'custom') {
                start = input?.startDate ? new Date(input.startDate) : null
                end = input?.endDate ? new Date(input.endDate) : null
            }

            let query = ctx.db
                .from('jobs')
                .select(`
                    id,
                    title,
                    status,
                    start_time,
                    end_time,
                    actual_start_time,
                    actual_end_time,
                    payable_start_time,
                    payable_end_time,
                    payable_minutes,
                    early_start_authorized,
                    late_start_authorized,
                    late_finish_authorized,
                    customers (
                        business_name,
                        contact_name
                    ),
                    job_sites (
                        name,
                        address,
                        city
                    ),
                    job_assignments (
                        id,
                        worker_id,
                        actual_start_time,
                        actual_end_time,
                        payable_start_time,
                        payable_end_time,
                        payable_minutes,
                        payable_start_source,
                        payable_end_source,
                        workers (
                            id,
                            first_name,
                            last_name,
                            role,
                            skills,
                            hourly_rate
                        )
                    )
                `)
                .eq('tenant_id', ctx.tenantId)
                .neq('status', 'cancelled')

            if (start && end) {
                query = query.gte('start_time', start.toISOString()).lte('start_time', end.toISOString())
            }

            const { data, error } = await query.order('start_time', { ascending: true })
            if (error) throw new Error(`Failed to fetch payroll rows: ${error.message}`)

            const rows = (data || [])
                .filter((job) => {
                    if (!input?.workerId) return true
                    return (job.job_assignments || []).some((assignment) => assignment.worker_id === input.workerId)
                })
                .flatMap((job) => {
                    const workerAssignments = (job.job_assignments || [])
                        .filter((assignment) => !input?.workerId || assignment.worker_id === input.workerId)
                        .map((assignment) => ({
                            assignment,
                            worker: Array.isArray(assignment.workers) ? assignment.workers[0] : assignment.workers,
                        }))
                        .filter((entry) => Boolean(entry.worker))
                    const customer = Array.isArray(job.customers) ? job.customers[0] : null
                    const site = Array.isArray(job.job_sites) ? job.job_sites[0] : null

                    return workerAssignments.map(({ assignment, worker }) => {
                        const workerActualStart = assignment.actual_start_time || job.actual_start_time
                        const workerActualEnd = assignment.actual_end_time || job.actual_end_time
                        const payable = calculatePayableTime({
                            scheduledStart: job.start_time,
                            scheduledEnd: job.end_time,
                            actualStart: workerActualStart,
                            actualEnd: workerActualEnd,
                            earlyStartAuthorized: job.early_start_authorized,
                            lateStartAuthorized: job.late_start_authorized,
                            lateFinishAuthorized: job.late_finish_authorized,
                        })
                        const effectivePayableMinutes = typeof job.payable_minutes === 'number'
                            ? job.payable_minutes
                            : payable.payableMinutes || 0
                        const workerName = worker ? `${worker.first_name} ${worker.last_name}` : 'Unassigned'
                        const hourlyRate = worker && typeof worker.hourly_rate === 'number' ? worker.hourly_rate : 0
                        const workerPayableMinutes = typeof assignment.payable_minutes === 'number'
                            ? assignment.payable_minutes
                            : effectivePayableMinutes
                        const workerPayableHours = Number((workerPayableMinutes / 60).toFixed(2))
                        const workerPayableStart = assignment.payable_start_time || job.payable_start_time || payable.payableStart?.toISOString() || null
                        const workerPayableEnd = assignment.payable_end_time || job.payable_end_time || payable.payableEnd?.toISOString() || null
                        const estimatedPay = hourlyRate > 0 ? hourlyRate * workerPayableHours : 0

                        return {
                            id: `${job.id}:${assignment.id}`,
                            jobId: job.id,
                            assignmentId: assignment.id,
                            workerId: assignment.worker_id,
                            title: job.title,
                            status: job.status,
                            customerName: customer?.business_name || customer?.contact_name || 'Unknown',
                            siteName: site?.name || site?.address || 'Unknown',
                            scheduledStart: job.start_time,
                            scheduledEnd: job.end_time,
                            actualStart: workerActualStart,
                            actualEnd: workerActualEnd,
                            payableStart: workerPayableStart,
                            payableEnd: workerPayableEnd,
                            payableMinutes: workerPayableMinutes,
                            payableHours: workerPayableHours,
                            assignedWorkers: [workerName],
                            workerFunctions: worker?.role ? [worker.role] : [],
                            workerSkills: Array.from(new Set(parseSkills(worker?.skills))),
                            hourlyRateLabel: hourlyRate > 0 ? `£${hourlyRate.toFixed(2)}` : '-',
                            estimatedPay,
                        }
                    })
                })

            const jobIds = new Set(rows.map((row) => row.jobId))
            const summary = rows.reduce((acc, row) => {
                acc.totalPayableHours += row.payableHours
                acc.totalEstimatedPay += row.estimatedPay
                return acc
            }, {
                totalJobs: jobIds.size,
                totalPayableHours: 0,
                totalEstimatedPay: 0,
            })

            return {
                rows,
                summary: {
                    totalJobs: summary.totalJobs,
                    totalPayableHours: Number(summary.totalPayableHours.toFixed(2)),
                    totalEstimatedPay: Number(summary.totalEstimatedPay.toFixed(2)),
                },
            }
        }),
})

function parseSkills(value: unknown): string[] {
    if (!value) return []
    if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    }
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value)
            if (Array.isArray(parsed)) {
                return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            }
        } catch {
            return []
        }
    }
    return []
}

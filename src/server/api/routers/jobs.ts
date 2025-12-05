import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const jobsRouter = createTRPCRouter({
    getAll: protectedProcedure
        .input(z.object({
            status: z.string().optional(),
            customerId: z.string().optional(),
            jobSiteId: z.string().optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
            let query = ctx.db
                .from('jobs')
                .select(`
          *,
          customers(business_name, contact_name),
          job_sites(name, address),
          job_assignments(
            id,
            status,
            workers(first_name, last_name, email),
            contractors(company_name, contact_name)
          )
        `)
                .eq('tenant_id', ctx.tenantId)
                .order('created_at', { ascending: false })

            if (input?.status) {
                query = query.eq('status', input.status)
            }
            if (input?.customerId) {
                query = query.eq('customer_id', input.customerId)
            }
            if (input?.jobSiteId) {
                query = query.eq('job_site_id', input.jobSiteId)
            }

            const { data, error } = await query

            if (error) {
                throw new Error(`Failed to fetch jobs: ${error.message}`)
            }

            return data
        }),

    getById: protectedProcedure
        .input(z.string())
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('jobs')
                .select(`
          *,
          customers(business_name, contact_name),
          job_sites(name, address),
          job_assignments(
            id,
            status,
            workers(first_name, last_name, email),
            contractors(company_name, contact_name)
          ),
          job_checklists(
            id,
            items,
            checklists(name)
          )
        `)
                .eq('id', input)
                .eq('tenant_id', ctx.tenantId)
                .single()

            if (error) {
                throw new Error(`Failed to fetch job: ${error.message}`)
            }

            return data
        }),

    create: protectedProcedure
        .input(z.object({
            customerId: z.string(),
            jobSiteId: z.string().optional(),
            title: z.string().min(1),
            description: z.string().optional(),
            priority: z.string().optional(),
            startTime: z.string().optional(), // ISO string
            endTime: z.string().optional(), // ISO string
            assignments: z.array(z.object({
                workerId: z.string().optional(),
                contractorId: z.string().optional(),
            })).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            // Create Job
            const { data: job, error: jobError } = await ctx.db
                .from('jobs')
                .insert({
                    tenant_id: ctx.tenantId,
                    customer_id: input.customerId,
                    job_site_id: input.jobSiteId,
                    title: input.title,
                    description: input.description,
                    priority: input.priority || 'normal',
                    start_time: input.startTime,
                    end_time: input.endTime,
                    status: 'draft',
                })
                .select()
                .single()

            if (jobError) {
                throw new Error(`Failed to create job: ${jobError.message}`)
            }

            // Create Assignments
            if (input.assignments && input.assignments.length > 0) {
                const assignmentsToInsert = input.assignments.map(a => ({
                    job_id: job.id,
                    worker_id: a.workerId,
                    contractor_id: a.contractorId,
                    status: 'assigned',
                }))

                const { error: assignError } = await ctx.db
                    .from('job_assignments')
                    .insert(assignmentsToInsert)

                if (assignError) {
                    // Log error but don't fail the whole request (job is created)
                    console.error('Failed to create assignments:', assignError)
                }
            }

            return job
        }),

    update: protectedProcedure
        .input(z.object({
            id: z.string(),
            title: z.string().optional(),
            description: z.string().optional(),
            status: z.string().optional(),
            priority: z.string().optional(),
            startTime: z.string().optional(),
            endTime: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('jobs')
                .update({
                    title: input.title,
                    description: input.description,
                    status: input.status,
                    priority: input.priority,
                    start_time: input.startTime,
                    end_time: input.endTime,
                })
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to update job: ${error.message}`)
            }

            return data
        }),

    delete: protectedProcedure
        .input(z.string())
        .mutation(async ({ ctx, input }) => {
            const { error } = await ctx.db
                .from('jobs')
                .delete()
                .eq('id', input)
                .eq('tenant_id', ctx.tenantId)

            if (error) {
                throw new Error(`Failed to delete job: ${error.message}`)
            }

            return { success: true }
        }),

    updateChecklistProgress: protectedProcedure
        .input(z.object({
            jobChecklistId: z.string().uuid(),
            items: z.array(z.any()), // JSONB array
        }))
        .mutation(async ({ ctx, input }) => {
            const { error } = await ctx.db
                .from('job_checklists')
                .update({ items: input.items })
                .eq('id', input.jobChecklistId)

            if (error) {
                throw new Error(`Failed to update checklist progress: ${error.message}`)
            }

            return { success: true }
        }),

    addChecklist: protectedProcedure
        .input(z.object({
            jobId: z.string().uuid(),
            checklistTemplateId: z.string().uuid(),
        }))
        .mutation(async ({ ctx, input }) => {
            // Fetch template items
            const { data: template, error: templateError } = await ctx.db
                .from('checklists')
                .select('items')
                .eq('id', input.checklistTemplateId)
                .single()

            if (templateError) {
                throw new Error(`Failed to fetch checklist template: ${templateError.message}`)
            }

            // Create job checklist
            const { error } = await ctx.db
                .from('job_checklists')
                .insert({
                    job_id: input.jobId,
                    checklist_template_id: input.checklistTemplateId,
                    items: template.items,
                })

            if (error) {
                throw new Error(`Failed to add checklist to job: ${error.message}`)
            }

            return { success: true }
        }),

    removeChecklist: protectedProcedure
        .input(z.object({
            jobChecklistId: z.string().uuid(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { error } = await ctx.db
                .from('job_checklists')
                .delete()
                .eq('id', input.jobChecklistId)

            if (error) {
                throw new Error(`Failed to remove checklist from job: ${error.message}`)
            }

            return { success: true }
        }),

    updateAssignments: protectedProcedure
        .input(z.object({
            jobId: z.string().uuid(),
            assignments: z.array(z.object({
                workerId: z.string().optional(),
                contractorId: z.string().optional(),
            })),
        }))
        .mutation(async ({ ctx, input }) => {
            // 1. Delete existing assignments
            const { error: deleteError } = await ctx.db
                .from('job_assignments')
                .delete()
                .eq('job_id', input.jobId)

            if (deleteError) {
                throw new Error(`Failed to clear existing assignments: ${deleteError.message}`)
            }

            // 2. Insert new assignments
            if (input.assignments.length > 0) {
                const assignmentsToInsert = input.assignments.map(a => ({
                    job_id: input.jobId,
                    worker_id: a.workerId,
                    contractor_id: a.contractorId,
                    status: 'assigned',
                }))

                const { error: insertError } = await ctx.db
                    .from('job_assignments')
                    .insert(assignmentsToInsert)

                if (insertError) {
                    throw new Error(`Failed to update assignments: ${insertError.message}`)
                }
            }

            return { success: true }
        }),
})

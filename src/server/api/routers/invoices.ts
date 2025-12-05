import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

// Define a schema for invoice items
const invoiceItemSchema = z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    total: z.number(),
})

export const invoicesRouter = createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
        const { data, error } = await ctx.db
            .from('invoices')
            .select(`
        *,
        customer:customers(first_name, last_name, company_name),
        job_site:job_sites(name, address)
      `)
            .eq('tenant_id', ctx.tenantId)
            .order('created_at', { ascending: false })

        if (error) {
            throw new Error(`Failed to fetch invoices: ${error.message}`)
        }

        return data
    }),

    getById: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('invoices')
                .select(`
          *,
          customer:customers(id, first_name, last_name, company_name, email, phone),
          job_site:job_sites(id, name, address)
        `)
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .single()

            if (error) {
                throw new Error(`Failed to fetch invoice: ${error.message}`)
            }

            return data
        }),

    create: protectedProcedure
        .input(
            z.object({
                customerId: z.string().uuid(),
                jobSiteId: z.string().uuid().optional(),
                status: z.string().min(1),
                issueDate: z.string(), // ISO date string
                dueDate: z.string(), // ISO date string
                totalAmount: z.number(),
                items: z.array(invoiceItemSchema).optional(),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('invoices')
                .insert({
                    tenant_id: ctx.tenantId,
                    customer_id: input.customerId,
                    job_site_id: input.jobSiteId,
                    status: input.status,
                    issue_date: input.issueDate,
                    due_date: input.dueDate,
                    total_amount: input.totalAmount,
                    items: input.items ? JSON.stringify(input.items) : '[]',
                    notes: input.notes,
                })
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to create invoice: ${error.message}`)
            }

            return data
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                customerId: z.string().uuid().optional(),
                jobSiteId: z.string().uuid().optional(),
                status: z.string().min(1).optional(),
                issueDate: z.string().optional(),
                dueDate: z.string().optional(),
                totalAmount: z.number().optional(),
                items: z.array(invoiceItemSchema).optional(),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('invoices')
                .update({
                    customer_id: input.customerId,
                    job_site_id: input.jobSiteId,
                    status: input.status,
                    issue_date: input.issueDate,
                    due_date: input.dueDate,
                    total_amount: input.totalAmount,
                    items: input.items ? JSON.stringify(input.items) : undefined,
                    notes: input.notes,
                })
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to update invoice: ${error.message}`)
            }

            return data
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { error } = await ctx.db
                .from('invoices')
                .delete()
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)

            if (error) {
                throw new Error(`Failed to delete invoice: ${error.message}`)
            }

            return { success: true }
        }),
})

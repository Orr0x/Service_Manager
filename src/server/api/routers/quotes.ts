import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

// Define a schema for quote items
const quoteItemSchema = z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    amount: z.number(),
})

export const quotesRouter = createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
        const { data, error } = await ctx.db
            .from('quotes')
            .select(`
        *,
        customer:customers(business_name, contact_name),
        job_site:job_sites(name)
      `)
            .eq('tenant_id', ctx.tenantId)
            .order('created_at', { ascending: false })

        if (error) {
            throw new Error(`Failed to fetch quotes: ${error.message}`)
        }

        return data
    }),

    getById: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('quotes')
                .select(`
          *,
          customer:customers(business_name, contact_name),
          job_site:job_sites(name)
        `)
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .single()

            if (error) {
                throw new Error(`Failed to fetch quote: ${error.message}`)
            }

            return data
        }),

    create: protectedProcedure
        .input(
            z.object({
                customerId: z.string().uuid(),
                jobSiteId: z.string().uuid().optional(),
                title: z.string().min(1),
                status: z.string().min(1),
                issuedDate: z.string().optional(),
                expiryDate: z.string().optional(),
                totalAmount: z.number().optional(),
                description: z.string().optional(),
                items: z.array(quoteItemSchema).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('quotes')
                .insert({
                    tenant_id: ctx.tenantId,
                    customer_id: input.customerId,
                    job_site_id: input.jobSiteId,
                    title: input.title,
                    status: input.status,
                    issued_date: input.issuedDate,
                    expiry_date: input.expiryDate,
                    total_amount: input.totalAmount,
                    description: input.description,
                    items: input.items ? JSON.stringify(input.items) : '[]',
                })
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to create quote: ${error.message}`)
            }

            return data
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                title: z.string().min(1).optional(),
                status: z.string().min(1).optional(),
                issuedDate: z.string().optional(),
                expiryDate: z.string().optional(),
                totalAmount: z.number().optional(),
                description: z.string().optional(),
                items: z.array(quoteItemSchema).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('quotes')
                .update({
                    title: input.title,
                    status: input.status,
                    issued_date: input.issuedDate,
                    expiry_date: input.expiryDate,
                    total_amount: input.totalAmount,
                    description: input.description,
                    items: input.items ? JSON.stringify(input.items) : undefined,
                })
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to update quote: ${error.message}`)
            }

            return data
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { error } = await ctx.db
                .from('quotes')
                .delete()
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)

            if (error) {
                throw new Error(`Failed to delete quote: ${error.message}`)
            }

            return { success: true }
        }),
})

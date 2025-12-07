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
    getAll: protectedProcedure
        .input(z.object({
            search: z.string().optional()
        }).optional())
        .query(async ({ ctx, input }) => {
            let query = ctx.db
                .from('quotes')
                .select(`
        *,
        customer:customers(business_name, contact_name),
        job_site:job_sites(name)
      `)
                .eq('tenant_id', ctx.tenantId)

            if (input?.search) {
                const search = input.search.toLowerCase()
                query = query.or(`title.ilike.%${search}%,status.ilike.%${search}%`)
            }

            const { data, error } = await query.order('created_at', { ascending: false })

            if (error) {
                throw new Error(`Failed to fetch quotes: ${error.message}`)
            }

            return data
        }),

    getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
        const [
            { count: totalCount },
            { count: acceptedCount },
            { count: pendingCount },
            { count: rejectedCount }
        ] = await Promise.all([
            ctx.db.from('quotes').select('*', { count: 'exact', head: true }).eq('tenant_id', ctx.tenantId),
            ctx.db.from('quotes').select('*', { count: 'exact', head: true }).eq('tenant_id', ctx.tenantId).eq('status', 'accepted'),
            ctx.db.from('quotes').select('*', { count: 'exact', head: true }).eq('tenant_id', ctx.tenantId).eq('status', 'pending'),
            ctx.db.from('quotes').select('*', { count: 'exact', head: true }).eq('tenant_id', ctx.tenantId).eq('status', 'rejected')
        ])

        return {
            total: totalCount || 0,
            accepted: acceptedCount || 0,
            pending: pendingCount || 0,
            rejected: rejectedCount || 0
        }
    }),

    getById: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('quotes')
                .select(`
          *,
          customer:customers(id, business_name, contact_name, email, phone),
          job_site:job_sites(*)
        `)
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .single()

            if (error) {
                throw new Error(`Failed to fetch quote: ${error.message}`)
            }

            return data
        }),

    getByCustomerId: protectedProcedure
        .input(z.object({ customerId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('quotes')
                .select(`
          *,
          job_site:job_sites(name)
        `)
                .eq('customer_id', input.customerId)
                .eq('tenant_id', ctx.tenantId)
                .order('created_at', { ascending: false })

            if (error) {
                throw new Error(`Failed to fetch quotes for customer: ${error.message}`)
            }

            return data
        }),

    getByJobSiteId: protectedProcedure
        .input(z.object({ jobSiteId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('quotes')
                .select(`
          *,
          customer:customers(business_name, contact_name)
        `)
                .eq('job_site_id', input.jobSiteId)
                .eq('tenant_id', ctx.tenantId)
                .order('created_at', { ascending: false })

            if (error) {
                throw new Error(`Failed to fetch quotes for job site: ${error.message}`)
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
                businessAddress: z.string().optional(),
                customerAddress: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Fetch addresses if not provided
            let businessAddress = input.businessAddress
            let customerAddress = input.customerAddress

            if (!businessAddress || !customerAddress) {
                const [tenantSettings, customer] = await Promise.all([
                    ctx.db.from('tenant_settings').select('business_address').eq('tenant_id', ctx.tenantId).single(),
                    ctx.db.from('customers').select('address, city, state, postal_code, country').eq('id', input.customerId).single()
                ])

                if (!businessAddress && tenantSettings.data?.business_address) {
                    businessAddress = tenantSettings.data.business_address
                }

                if (!customerAddress && customer.data) {
                    const c = customer.data
                    customerAddress = [c.address, c.city, c.state, c.postal_code, c.country].filter(Boolean).join(', ')
                }
            }

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
                    business_address: businessAddress,
                    customer_address: customerAddress,
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
                customerId: z.string().uuid().optional(),
                jobSiteId: z.string().uuid().optional().nullable(),
                title: z.string().min(1).optional(),
                status: z.string().min(1).optional(),
                issuedDate: z.string().optional(),
                expiryDate: z.string().optional(),
                totalAmount: z.number().optional(),
                description: z.string().optional(),
                items: z.array(quoteItemSchema).optional(),
                businessAddress: z.string().optional(),
                customerAddress: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('quotes')
                .update({
                    customer_id: input.customerId,
                    job_site_id: input.jobSiteId,
                    title: input.title,
                    status: input.status,
                    issued_date: input.issuedDate,
                    expiry_date: input.expiryDate,
                    total_amount: input.totalAmount,
                    description: input.description,
                    items: input.items ? JSON.stringify(input.items) : undefined,
                    business_address: input.businessAddress,
                    customer_address: input.customerAddress,
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

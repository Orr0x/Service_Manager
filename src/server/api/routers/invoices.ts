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
        customer:customers(contact_name, business_name),
        job_site:job_sites(name, address),
        job:jobs(title),
        quote:quotes(title, quote_number)
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
          customer:customers(id, contact_name, business_name, email, phone),
          job_site:job_sites(id, name, address),
          job:jobs(id, title),
          quote:quotes(id, title, quote_number)
        `)
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .single()

            if (error) {
                throw new Error(`Failed to fetch invoice: ${error.message}`)
            }

            return data
        }),

    getByCustomerId: protectedProcedure
        .input(z.object({ customerId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('invoices')
                .select(`
          *,
          job_site:job_sites(name),
          job:jobs(title),
          quote:quotes(quote_number)
        `)
                .eq('customer_id', input.customerId)
                .eq('tenant_id', ctx.tenantId)
                .order('created_at', { ascending: false })

            if (error) {
                throw new Error(`Failed to fetch invoices for customer: ${error.message}`)
            }

            return data
        }),

    getByJobSiteId: protectedProcedure
        .input(z.object({ jobSiteId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('invoices')
                .select(`
          *,
          customer:customers(business_name, contact_name),
          job:jobs(title),
          quote:quotes(quote_number)
        `)
                .eq('job_site_id', input.jobSiteId)
                .eq('tenant_id', ctx.tenantId)
                .order('created_at', { ascending: false })

            if (error) {
                throw new Error(`Failed to fetch invoices for job site: ${error.message}`)
            }

            return data
        }),

    getByContractId: protectedProcedure
        .input(z.object({ contractId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            // First fetch the contract to get customer_id and job_site_id
            const { data: contract, error: contractError } = await ctx.db
                .from('contracts')
                .select('customer_id, job_site_id')
                .eq('id', input.contractId)
                .single()

            if (contractError) {
                throw new Error(`Failed to fetch contract details: ${contractError.message}`)
            }

            let query = ctx.db
                .from('invoices')
                .select(`
          *,
          customer:customers(business_name, contact_name),
          job:jobs(title),
          quote:quotes(quote_number)
        `)
                .eq('customer_id', contract.customer_id)
                .eq('tenant_id', ctx.tenantId)
                .order('created_at', { ascending: false })

            if (contract.job_site_id) {
                query = query.eq('job_site_id', contract.job_site_id)
            }

            const { data, error } = await query

            if (error) {
                throw new Error(`Failed to fetch invoices for contract: ${error.message}`)
            }

            return data
        }),

    getByJobId: protectedProcedure
        .input(z.object({ jobId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('invoices')
                .select(`
          *,
          customer:customers(business_name, contact_name),
          job:jobs(title),
          quote:quotes(quote_number)
        `)
                .eq('job_id', input.jobId)
                .eq('tenant_id', ctx.tenantId)
                .order('created_at', { ascending: false })

            if (error) {
                throw new Error(`Failed to fetch invoices for job: ${error.message}`)
            }

            return data
        }),

    getByQuoteId: protectedProcedure
        .input(z.object({ quoteId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('invoices')
                .select(`
          *,
          customer:customers(business_name, contact_name),
          job:jobs(title),
          quote:quotes(quote_number)
        `)
                .eq('quote_id', input.quoteId)
                .eq('tenant_id', ctx.tenantId)
                .order('created_at', { ascending: false })

            if (error) {
                throw new Error(`Failed to fetch invoices for quote: ${error.message}`)
            }

            return data
        }),

    create: protectedProcedure
        .input(
            z.object({
                customerId: z.string().uuid(),
                jobSiteId: z.string().uuid().optional(),
                jobId: z.string().uuid().optional(),
                quoteId: z.string().uuid().optional(),
                status: z.string().min(1),
                issueDate: z.string(), // ISO date string
                dueDate: z.string(), // ISO date string
                totalAmount: z.number(),
                items: z.array(invoiceItemSchema).optional(),
                notes: z.string().optional(),
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
                .from('invoices')
                .insert({
                    tenant_id: ctx.tenantId,
                    customer_id: input.customerId,
                    job_site_id: input.jobSiteId,
                    job_id: input.jobId,
                    quote_id: input.quoteId,
                    status: input.status,
                    issue_date: input.issueDate,
                    due_date: input.dueDate,
                    total_amount: input.totalAmount,
                    items: input.items ? JSON.stringify(input.items) : '[]',
                    notes: input.notes,
                    business_address: businessAddress,
                    customer_address: customerAddress,
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
                jobId: z.string().uuid().optional(),
                quoteId: z.string().uuid().optional(),
                status: z.string().min(1).optional(),
                issueDate: z.string().optional(),
                dueDate: z.string().optional(),
                totalAmount: z.number().optional(),
                items: z.array(invoiceItemSchema).optional(),
                notes: z.string().optional(),
                businessAddress: z.string().optional(),
                customerAddress: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('invoices')
                .update({
                    customer_id: input.customerId,
                    job_site_id: input.jobSiteId,
                    job_id: input.jobId,
                    quote_id: input.quoteId,
                    status: input.status,
                    issue_date: input.issueDate,
                    due_date: input.dueDate,
                    total_amount: input.totalAmount,
                    items: input.items ? JSON.stringify(input.items) : undefined,
                    notes: input.notes,
                    business_address: input.businessAddress,
                    customer_address: input.customerAddress,
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

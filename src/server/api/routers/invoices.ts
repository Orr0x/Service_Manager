import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { logActivity } from './utils/activity'

// Define a schema for invoice items
const invoiceItemSchema = z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    total: z.number(),
})

export const invoicesRouter = createTRPCRouter({
    getAll: protectedProcedure
        .input(z.object({
            search: z.string().optional()
        }).optional())
        .query(async ({ ctx, input }) => {
            if (input?.search) {
                const { data, error } = await ctx.db.rpc('search_invoices', {
                    p_tenant_id: ctx.tenantId,
                    p_search_text: input.search
                })

                if (error) {
                    throw new Error(`Failed to search invoices: ${error.message}`)
                }

                // Map RPC result back to expected shape with nested customer
                // The RPC returns flattened columns: customer_business_name, customer_contact_name
                // Cast data to any[] to allow mapping without TS errors about unknown type
                return (data as any[]).map((inv: any) => ({
                    ...inv,
                    customers: {
                        id: inv.customer_id,
                        business_name: inv.customer_business_name,
                        contact_name: inv.customer_contact_name
                    },
                    job_site: inv.job_site_id ? { name: inv.job_site_name, address: inv.job_site_address } : null,
                    job: inv.job_id ? { title: inv.job_title } : null,
                    quote: inv.quote_id ? { title: inv.quote_title, quote_number: inv.quote_quote_number } : null,
                }))
            }

            // Standard query without search (or fallback if empty search)
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

    getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
        const [
            { count: totalCount },
            { count: paidCount },
            { count: overdueCount },
            { count: draftCount }
        ] = await Promise.all([
            ctx.db.from('invoices').select('*', { count: 'exact', head: true }).eq('tenant_id', ctx.tenantId),
            ctx.db.from('invoices').select('*', { count: 'exact', head: true }).eq('tenant_id', ctx.tenantId).eq('status', 'paid'),
            ctx.db.from('invoices').select('*', { count: 'exact', head: true }).eq('tenant_id', ctx.tenantId).eq('status', 'overdue'),
            ctx.db.from('invoices').select('*', { count: 'exact', head: true }).eq('tenant_id', ctx.tenantId).eq('status', 'draft')
        ])

        return {
            total: totalCount || 0,
            paid: paidCount || 0,
            overdue: overdueCount || 0,
            draft: draftCount || 0
        }
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

            await logActivity({
                tenantId: ctx.tenantId,
                actorId: ctx.user.id,
                actionType: 'created',
                entityType: 'invoice',
                entityId: data.id,
                details: { status: input.status, customer_id: input.customerId, amount: input.totalAmount },
                db: ctx.db
            })

            // Log to Customer Timeline
            await logActivity({
                tenantId: ctx.tenantId,
                actorId: ctx.user.id,
                actionType: 'updated',
                entityType: 'customer',
                entityId: input.customerId,
                details: { type: 'invoice_created', invoice_id: data.id, invoice_number: data.invoice_number },
                db: ctx.db
            })

            // Log to Job Timeline if linked
            if (input.jobId) {
                await logActivity({
                    tenantId: ctx.tenantId,
                    actorId: ctx.user.id,
                    actionType: 'updated',
                    entityType: 'job',
                    entityId: input.jobId,
                    details: { type: 'invoice_created', invoice_id: data.id, invoice_number: data.invoice_number },
                    db: ctx.db
                })
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

            await logActivity({
                tenantId: ctx.tenantId,
                actorId: ctx.user.id,
                actionType: 'updated',
                entityType: 'invoice',
                entityId: input.id,
                details: { status: input.status, amount: input.totalAmount },
                db: ctx.db
            })

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

            await logActivity({
                tenantId: ctx.tenantId,
                actorId: ctx.user.id,
                actionType: 'deleted',
                entityType: 'invoice',
                entityId: input.id,
                details: {},
                db: ctx.db
            })

            return { success: true }
        }),
})

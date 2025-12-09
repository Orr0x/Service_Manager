import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const customersRouter = createTRPCRouter({
    getAll: protectedProcedure
        .input(z.object({
            search: z.string().optional()
        }).optional())
        .query(async ({ ctx, input }) => {
            let query = ctx.db
                .from('customers')
                .select('*')
                .eq('tenant_id', ctx.tenantId)

            if (input?.search) {
                const search = input.search.trim()
                if (search) {
                    query = query.or(`business_name.ilike.%${search}%,contact_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,city.ilike.%${search}%`)
                }
            }

            const { data, error } = await query
                .order('business_name', { ascending: true, nullsFirst: false })
                .order('contact_name', { ascending: true })

            if (error) {
                throw new Error(`Failed to fetch customers: ${error.message}`)
            }

            return data
        }),

    getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
        const [
            { count: customersCount },
            { count: contractsCount },
            { count: sitesCount },
            { count: jobsCount }
        ] = await Promise.all([
            ctx.db.from('customers').select('*', { count: 'exact', head: true }).eq('tenant_id', ctx.tenantId),
            ctx.db.from('contracts').select('*', { count: 'exact', head: true }).eq('tenant_id', ctx.tenantId),
            ctx.db.from('job_sites').select('*', { count: 'exact', head: true }).eq('tenant_id', ctx.tenantId),
            ctx.db.from('jobs').select('*', { count: 'exact', head: true }).eq('tenant_id', ctx.tenantId)
        ])

        return {
            customers: customersCount || 0,
            contracts: contractsCount || 0,
            sites: sitesCount || 0,
            jobs: jobsCount || 0
        }
    }),

    getById: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('customers')
                .select('*')
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .single()

            if (error) {
                throw new Error(`Failed to fetch customer: ${error.message}`)
            }

            return data
        }),

    create: protectedProcedure
        .input(
            z.object({
                businessName: z.string().optional(),
                contactName: z.string().min(1),
                email: z.string().email().optional().or(z.literal('')),
                phone: z.string().optional(),
                address: z.string().optional(),
                city: z.string().optional(),
                state: z.string().optional(),
                postalCode: z.string().optional(),
                country: z.string().optional(),
                type: z.enum(['individual', 'business']),
                paymentTerms: z.string().optional(),
                engagementType: z.enum(['contract', 'pay_as_you_go']).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            console.log('Creating customer:', { tenantId: ctx.tenantId, user: ctx.user?.id, role: ctx.user?.user_metadata?.role });
            const { data, error } = await ctx.db
                .from('customers')
                .insert({
                    tenant_id: ctx.tenantId,
                    business_name: input.businessName,
                    contact_name: input.contactName,
                    email: input.email,
                    phone: input.phone,
                    address: input.address,
                    city: input.city,
                    state: input.state,
                    postal_code: input.postalCode,
                    country: input.country,
                    type: input.type,
                    payment_terms: input.paymentTerms,
                    engagement_type: input.engagementType,
                })
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to create customer: ${error.message}`)
            }

            return data
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                businessName: z.string().optional(),
                contactName: z.string().min(1).optional(),
                email: z.string().email().optional().or(z.literal('')),
                phone: z.string().optional(),
                address: z.string().optional(),
                city: z.string().optional(),
                state: z.string().optional(),
                postalCode: z.string().optional(),
                country: z.string().optional(),
                type: z.enum(['individual', 'business']).optional(),
                paymentTerms: z.string().optional(),
                engagementType: z.enum(['contract', 'pay_as_you_go']).optional(),
                isActive: z.boolean().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('customers')
                .update({
                    business_name: input.businessName,
                    contact_name: input.contactName,
                    email: input.email,
                    phone: input.phone,
                    address: input.address,
                    city: input.city,
                    state: input.state,
                    postal_code: input.postalCode,
                    country: input.country,
                    type: input.type,
                    payment_terms: input.paymentTerms,
                    engagement_type: input.engagementType,
                    is_active: input.isActive,
                })
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to update customer: ${error.message}`)
            }

            return data
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { error } = await ctx.db
                .from('customers')
                .delete()
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)

            if (error) {
                throw new Error(`Failed to delete customer: ${error.message}`)
            }

            return { success: true }
        }),
})

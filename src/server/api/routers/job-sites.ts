import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const jobSitesRouter = createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
        const { data, error } = await ctx.db
            .from('job_sites')
            .select(`
        *,
        customer:customers(business_name, contact_name)
      `)
            .eq('tenant_id', ctx.tenantId)
            .order('name', { ascending: true })

        if (error) {
            throw new Error(`Failed to fetch job sites: ${error.message}`)
        }

        return data
    }),

    getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
        const [
            { count: sitesCount },
            { count: jobsCount },
            { count: contractsCount },
            { count: checklistsCount }
        ] = await Promise.all([
            ctx.db.from('job_sites').select('*', { count: 'exact', head: true }).eq('tenant_id', ctx.tenantId),
            ctx.db.from('jobs').select('*', { count: 'exact', head: true }).eq('tenant_id', ctx.tenantId),
            ctx.db.from('contracts').select('*', { count: 'exact', head: true }).eq('tenant_id', ctx.tenantId),
            ctx.db.from('checklists').select('*', { count: 'exact', head: true }).eq('tenant_id', ctx.tenantId)
        ])

        return {
            sites: sitesCount || 0,
            jobs: jobsCount || 0,
            contracts: contractsCount || 0,
            checklists: checklistsCount || 0
        }
    }),

    getByCustomerId: protectedProcedure
        .input(z.object({ customerId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('job_sites')
                .select('*')
                .eq('customer_id', input.customerId)
                .eq('tenant_id', ctx.tenantId)
                .order('name', { ascending: true })

            if (error) {
                throw new Error(`Failed to fetch job sites for customer: ${error.message}`)
            }

            return data
        }),

    getById: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('job_sites')
                .select(`
          *,
          customer:customers(id, business_name, contact_name, email, phone)
        `)
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .single()

            if (error) {
                throw new Error(`Failed to fetch job site: ${error.message}`)
            }

            return data
        }),

    create: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid().optional(),
                customerId: z.string().uuid(),
                name: z.string().min(1),
                address: z.string().min(1),
                city: z.string().optional(),
                state: z.string().optional(),
                postalCode: z.string().optional(),
                country: z.string().optional(),
                latitude: z.number().optional(),
                longitude: z.number().optional(),
                what3words: z.string().optional(),
                accessInstructions: z.string().optional(),
                securityCodes: z.string().optional(),
                keyHolder: z.string().optional(),
                facilities: z.string().optional(),
                siteType: z.string().optional(),
                parkingInfo: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('job_sites')
                .insert({
                    id: input.id, // Use provided ID if available
                    tenant_id: ctx.tenantId,
                    customer_id: input.customerId,
                    name: input.name,
                    address: input.address,
                    city: input.city,
                    state: input.state,
                    postal_code: input.postalCode,
                    country: input.country,
                    latitude: input.latitude,
                    longitude: input.longitude,
                    what3words: input.what3words,
                    access_instructions: input.accessInstructions,
                    security_codes: input.securityCodes,
                    key_holder: input.keyHolder,
                    facilities: input.facilities,
                    site_type: input.siteType,
                    parking_info: input.parkingInfo,
                })
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to create job site: ${error.message}`)
            }

            return data
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                name: z.string().min(1).optional(),
                address: z.string().min(1).optional(),
                city: z.string().optional(),
                state: z.string().optional(),
                postalCode: z.string().optional(),
                country: z.string().optional(),
                isActive: z.boolean().optional(),
                latitude: z.number().optional(),
                longitude: z.number().optional(),
                what3words: z.string().optional(),
                accessInstructions: z.string().optional(),
                securityCodes: z.string().optional(),
                keyHolder: z.string().optional(),
                facilities: z.string().optional(),
                siteType: z.string().optional(),
                parkingInfo: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('job_sites')
                .update({
                    name: input.name,
                    address: input.address,
                    city: input.city,
                    state: input.state,
                    postal_code: input.postalCode,
                    country: input.country,
                    is_active: input.isActive,
                    latitude: input.latitude,
                    longitude: input.longitude,
                    what3words: input.what3words,
                    access_instructions: input.accessInstructions,
                    security_codes: input.securityCodes,
                    key_holder: input.keyHolder,
                    facilities: input.facilities,
                    site_type: input.siteType,
                    parking_info: input.parkingInfo,
                })
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to update job site: ${error.message}`)
            }

            return data
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { error } = await ctx.db
                .from('job_sites')
                .delete()
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)

            if (error) {
                throw new Error(`Failed to delete job site: ${error.message}`)
            }

            return { success: true }
        }),
})

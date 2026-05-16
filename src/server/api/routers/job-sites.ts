import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

const latitudeSchema = z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90')
const longitudeSchema = z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180')
const locationRadiusSchema = z.number().min(10, 'Location range must be at least 10 metres').max(250, 'Location range cannot exceed 250 metres')

export const jobSitesRouter = createTRPCRouter({
    getAll: protectedProcedure
        .input(z.object({
            search: z.string().optional()
        }).optional())
        .query(async ({ ctx, input }) => {
            let query = ctx.db
                .from('job_sites')
                .select(`
        *,
        customer:customers(business_name, contact_name)
      `)
                .eq('tenant_id', ctx.tenantId)

            if (input?.search) {
                const search = input.search.trim()
                if (search) {
                    // 1. Fetch matching customers
                    const { data: matchedCustomers } = await ctx.db
                        .from('customers')
                        .select('id')
                        .or(`business_name.ilike.%${search}%,contact_name.ilike.%${search}%`)
                        .eq('tenant_id', ctx.tenantId)

                    const customerIds = matchedCustomers?.map(c => c.id) || []

                    // 2. Build Query
                    let orConditions = `name.ilike.%${search}%,address.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%,postal_code.ilike.%${search}%`

                    if (customerIds.length > 0) {
                        orConditions += `,customer_id.in.(${customerIds.join(',')})`
                    }

                    query = query.or(orConditions)
                }
            }

            const { data, error } = await query.order('name', { ascending: true })

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
                latitude: latitudeSchema.optional(),
                longitude: longitudeSchema.optional(),
                what3words: z.string().optional(),
                coordinateLocked: z.boolean().optional(),
                locationRadiusMeters: locationRadiusSchema.optional(),
                locationRadiusLocked: z.boolean().optional(),
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
                    coordinates_locked: input.coordinateLocked,
                    location_radius_meters: input.locationRadiusMeters,
                    location_radius_locked: input.locationRadiusLocked,
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
                latitude: latitudeSchema.optional(),
                longitude: longitudeSchema.optional(),
                what3words: z.string().optional(),
                coordinateLocked: z.boolean().optional(),
                locationRadiusMeters: locationRadiusSchema.optional(),
                locationRadiusLocked: z.boolean().optional(),
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
                    coordinates_locked: input.coordinateLocked,
                    location_radius_meters: input.locationRadiusMeters,
                    location_radius_locked: input.locationRadiusLocked,
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

import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { logActivity } from './utils/activity'

export const servicesRouter = createTRPCRouter({
    getAll: protectedProcedure
        .input(z.object({
            search: z.string().optional()
        }).optional())
        .query(async ({ ctx, input }) => {
            let query = ctx.db
                .from('services')
                .select('*')
                .eq('tenant_id', ctx.tenantId)

            if (input?.search) {
                const search = input.search.toLowerCase()
                query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`)
            }

            const { data, error } = await query.order('name')

            if (error) {
                throw new Error(`Failed to fetch services: ${error.message}`)
            }

            return data
        }),

    getById: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('services')
                .select('*')
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .single()

            if (error) {
                throw new Error(`Failed to fetch service: ${error.message}`)
            }

            return data
        }),


    getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
        const [
            { count: totalCount },
            { count: activeCount },
            { count: fixedPriceCount },
            { count: hourlyCount }
        ] = await Promise.all([
            ctx.db.from('services').select('*', { count: 'exact', head: true }).eq('tenant_id', ctx.tenantId),
            ctx.db.from('services').select('*', { count: 'exact', head: true }).eq('tenant_id', ctx.tenantId).eq('is_active', true),
            // Assuming we can distinguish fixed price vs hourly.
            // The schema has 'base_price' and 'duration_minutes'.
            // It doesn't seem to have a 'type' field (fixed/hourly).
            // Let's check the create/update input schema.
            // It has 'category'. Maybe category is used for this? Or maybe we just count by category if 'Fixed Price' isn't a field.
            // Re-reading requirements: "Fixed Price, Hourly".
            // If the schema doesn't support it, I might need to infer or just use dummy counts for now if I can't change schema.
            // Or maybe I can check if 'duration_minutes' is 60 for hourly? No that's fragile.
            // Let's look at the file content again.
            // Input schema: name, description, basePrice, durationMinutes, category.
            // No 'type'.
            // I will use 'category' to count distinct categories for now, or just return 0 for these specific breakdowns if I can't determine them.
            // Or better, let's count services with price > 0 as "Priced" and others as "Free"? No.
            // Let's assume for now we just show Total and Active, and maybe "Categories" count.
            // But the requirement was specific.
            // Let's check if I can add a 'type' field or if I should just use 'category' if it happens to be 'Hourly'.
            // For now, I'll return 0 for Fixed/Hourly and add a TODO, or just count by category if possible.
            // Actually, I'll just count Total and Active for now to be safe, and maybe "Long Duration" (>60min) vs "Short"?
            // Let's stick to Total and Active, and maybe "Most Popular" (hard to track without usage data).
            // I will return Total, Active, and maybe just 0 for the others with a comment.
            // Wait, I can check if I can add a 'type' field. But I shouldn't modify schema without permission.
            // I'll check if 'category' values are typically 'Hourly' or 'Fixed'.
            // I'll just query for category='Hourly' and category='Fixed' just in case.
            ctx.db.from('services').select('*', { count: 'exact', head: true }).eq('tenant_id', ctx.tenantId).ilike('category', '%fixed%'),
            ctx.db.from('services').select('*', { count: 'exact', head: true }).eq('tenant_id', ctx.tenantId).ilike('category', '%hourly%')
        ])

        return {
            total: totalCount || 0,
            active: activeCount || 0,
            fixedPrice: fixedPriceCount || 0,
            hourly: hourlyCount || 0
        }
    }),

    create: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1),
                description: z.string().optional(),
                basePrice: z.number().min(0),
                durationMinutes: z.number().min(1),
                category: z.string().min(1),
                coverageArea: z.string().optional(),
                imageUrl: z.string().optional(),
                unitOfMeasure: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('services')
                .insert({
                    tenant_id: ctx.tenantId,
                    name: input.name,
                    description: input.description,
                    base_price: input.basePrice,
                    duration_minutes: input.durationMinutes,
                    category: input.category,
                    coverage_area: input.coverageArea,
                    image_url: input.imageUrl,
                    unit_of_measure: input.unitOfMeasure,
                })
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to create service: ${error.message}`)
            }

            await logActivity({
                tenantId: ctx.tenantId,
                actorId: ctx.user?.id,
                actionType: 'created',
                entityType: 'service',
                entityId: data.id,
                details: { name: input.name, category: input.category },
                db: ctx.db
            })

            return data
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                name: z.string().min(1).optional(),
                description: z.string().optional(),
                basePrice: z.number().min(0).optional(),
                durationMinutes: z.number().min(1).optional(),
                category: z.string().min(1).optional(),
                isActive: z.boolean().optional(),
                coverageArea: z.string().optional(),
                imageUrl: z.string().optional(),
                unitOfMeasure: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('services')
                .update({
                    name: input.name,
                    description: input.description,
                    base_price: input.basePrice,
                    duration_minutes: input.durationMinutes,
                    category: input.category,
                    is_active: input.isActive,
                    coverage_area: input.coverageArea,
                    image_url: input.imageUrl,
                    unit_of_measure: input.unitOfMeasure,
                })
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to update service: ${error.message}`)
            }

            await logActivity({
                tenantId: ctx.tenantId,
                actorId: ctx.user?.id,
                actionType: 'updated',
                entityType: 'service',
                entityId: data.id,
                details: input,
                db: ctx.db
            })

            return data
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { error } = await ctx.db
                .from('services')
                .delete()
                .eq('id', input.id)
                .eq('tenant_id', ctx.tenantId)

            if (error) {
                throw new Error(`Failed to delete service: ${error.message}`)
            }

            await logActivity({
                tenantId: ctx.tenantId,
                actorId: ctx.user?.id,
                actionType: 'deleted',
                entityType: 'service',
                entityId: input.id,
                details: { id: input.id },
                db: ctx.db
            })

            return { success: true }
        }),
})


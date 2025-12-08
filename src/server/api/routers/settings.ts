import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const settingsRouter = createTRPCRouter({
    getSettings: protectedProcedure.query(async ({ ctx }) => {
        const { data, error } = await ctx.db
            .from('tenant_settings')
            .select('*')
            .eq('tenant_id', ctx.tenantId)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            throw new Error(`Failed to fetch settings: ${error.message}`)
        }

        // Return default settings if none exist
        if (!data) {
            return {
                branding: {
                    primary_color: '#2563eb',
                    secondary_color: '#1e40af',
                    company_name: 'My Service Business',
                },
                terminology: {},
                navigation: {},
                kanban_settings: {
                    columns: {
                        draft: 'Draft',
                        unscheduled: 'Unscheduled',
                        scheduled: 'Scheduled',
                        in_progress: 'In Progress',
                        completed: 'Completed',
                    },
                },
            }
        }

        return data
    }),

    updateBranding: protectedProcedure
        .input(
            z.object({
                companyName: z.string().optional(),
                primaryColor: z.string().optional(),
                secondaryColor: z.string().optional(),
                logoUrl: z.string().optional(),
                theme: z.object({
                    mode: z.enum(['light', 'dark']).optional(),
                    sidebarBg: z.string().optional(),
                    sidebarText: z.string().optional(),
                    headerBg: z.string().optional(),
                    borderRadius: z.string().optional(),
                }).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // First check if settings exist
            const { data: existing } = await ctx.db
                .from('tenant_settings')
                .select('branding')
                .eq('tenant_id', ctx.tenantId)
                .single()

            const currentBranding = (existing?.branding as Record<string, any>) || {}

            const newBranding = {
                ...currentBranding,
                ...(input.companyName !== undefined && { company_name: input.companyName }),
                ...(input.primaryColor !== undefined && { primary_color: input.primaryColor }),
                ...(input.secondaryColor !== undefined && { secondary_color: input.secondaryColor }),
                ...(input.logoUrl !== undefined && { logo_url: input.logoUrl }),
                theme: {
                    ...(currentBranding.theme || {}),
                    ...(input.theme || {}),
                }
            }

            const { data, error } = await ctx.db
                .from('tenant_settings')
                .upsert({
                    tenant_id: ctx.tenantId,
                    branding: newBranding,
                })
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to update branding: ${error.message}`)
            }

            return data
        }),

    updateTerminology: protectedProcedure
        .input(z.record(z.string(), z.string())) // Key-value pairs of original -> new term
        .mutation(async ({ ctx, input }) => {
            const { data: existing } = await ctx.db
                .from('tenant_settings')
                .select('terminology')
                .eq('tenant_id', ctx.tenantId)
                .single()

            const currentTerminology = (existing?.terminology as Record<string, string>) || {}

            const newTerminology = {
                ...currentTerminology,
                ...input,
            }

            const { data, error } = await ctx.db
                .from('tenant_settings')
                .upsert({
                    tenant_id: ctx.tenantId,
                    terminology: newTerminology,
                })
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to update terminology: ${error.message}`)
            }

            return data
        }),

    updateNavigation: protectedProcedure
        .input(z.record(z.string(), z.object({ enabled: z.boolean(), label: z.string().optional() })))
        .mutation(async ({ ctx, input }) => {
            const { data: existing } = await ctx.db
                .from('tenant_settings')
                .select('navigation')
                .eq('tenant_id', ctx.tenantId)
                .single()

            const currentNavigation = (existing?.navigation as Record<string, any>) || {}

            const newNavigation = {
                ...currentNavigation,
                ...input,
            }

            const { data, error } = await ctx.db
                .from('tenant_settings')
                .upsert({
                    tenant_id: ctx.tenantId,
                    navigation: newNavigation,
                })
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to update navigation: ${error.message}`)
            }

            return data
        }),

    updateKanbanSettings: protectedProcedure
        .input(z.object({
            columns: z.record(z.string(), z.string()).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { data: existing } = await ctx.db
                .from('tenant_settings')
                .select('kanban_settings')
                .eq('tenant_id', ctx.tenantId)
                .single()

            const currentSettings = (existing?.kanban_settings as Record<string, any>) || {}

            // Merge columns
            const currentColumns = currentSettings.columns || {}
            const newColumns = {
                ...currentColumns,
                ...(input.columns || {}),
            }

            const newSettings = {
                ...currentSettings,
                columns: newColumns,
            }

            const { data, error } = await ctx.db
                .from('tenant_settings')
                .upsert({
                    tenant_id: ctx.tenantId,
                    kanban_settings: newSettings,
                })
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to update kanban settings: ${error.message}`)
            }

            return data
        }),
})

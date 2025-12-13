import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const configRouter = createTRPCRouter({
    getAppConfig: protectedProcedure
        .input(z.object({
            entityType: z.enum(['worker', 'contractor', 'customer', 'global']),
            entityId: z.string().optional() // If null, we are fetching global/default for that type
        }))
        .query(async ({ ctx, input }) => {
            // Fetch Global Config
            const { data: globalConfig } = await ctx.db
                .from('app_configurations')
                .select('config')
                .eq('entity_type', 'global')
                .single();

            // Fetch Type Default Config
            let typeConfig = null;
            if (input.entityType !== 'global') {
                const { data } = await ctx.db
                    .from('app_configurations')
                    .select('config')
                    .eq('entity_type', input.entityType)
                    .is('entity_id', null)
                    .single();
                typeConfig = data;
            }

            // Fetch Specific Config
            let specificConfig = null;
            if (input.entityId) {
                const { data } = await ctx.db
                    .from('app_configurations')
                    .select('config')
                    .eq('entity_type', input.entityType)
                    .eq('entity_id', input.entityId)
                    .single();
                specificConfig = data;
            }

            // Fetch Tenant Settings (for Branding)
            const { data: tenantSettings } = await ctx.db
                .from('tenant_settings')
                .select('branding')
                .eq('tenant_id', ctx.tenantId)
                .single();

            // Merge: TenantSettings (Base) < Global < Type < Specific
            const merged = {
                branding: tenantSettings?.branding || {},
                ...(globalConfig?.config as object || {}),
                ...(typeConfig?.config as object || {}),
                ...(specificConfig?.config as object || {})
            };

            return merged;
        }),

    updateAppConfig: protectedProcedure
        .input(z.object({
            entityType: z.enum(['worker', 'contractor', 'customer', 'global']),
            entityId: z.string().nullish(), // Null for defaults
            config: z.any() // JSON object, relaxed validation to fix Zod error
        }))
        .mutation(async ({ ctx, input }) => {
            if (ctx.user.user_metadata.role !== 'admin') {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can manage configuration' });
            }

            // Upsert Logic (Manual to handle partial unique indexes)
            // 1. Check if exists
            let query = ctx.db
                .from('app_configurations')
                .select('id')
                .eq('tenant_id', ctx.tenantId)
                .eq('entity_type', input.entityType);

            if (input.entityId) {
                query = query.eq('entity_id', input.entityId);
            } else {
                query = query.is('entity_id', null);
            }

            const { data: existing } = await query.single();

            const payload = {
                tenant_id: ctx.tenantId,
                entity_type: input.entityType,
                entity_id: input.entityId || null,
                config: input.config,
                updated_at: new Date().toISOString()
            };

            let error;
            if (existing) {
                // Update
                const result = await ctx.db
                    .from('app_configurations')
                    .update({ config: input.config, updated_at: new Date().toISOString() })
                    .eq('id', existing.id);
                error = result.error;
            } else {
                // Insert
                const result = await ctx.db
                    .from('app_configurations')
                    .insert(payload);
                error = result.error;
            }

            if (error) {
                console.error('Config update failed:', error);
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
            }

            return { success: true };
        })
});

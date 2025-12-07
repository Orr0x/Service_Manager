import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const certificationRouter = createTRPCRouter({
    getSettings: protectedProcedure
        .input(z.object({
            entityType: z.string()
        }))
        .query(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('certification_settings')
                .select('*')
                .eq('tenant_id', ctx.tenantId)
                .eq('entity_type', input.entityType);

            if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
            return data;
        }),

    updateSetting: protectedProcedure
        .input(z.object({
            entityType: z.string(),
            categoryKey: z.string(),
            label: z.string()
        }))
        .mutation(async ({ ctx, input }) => {
            const { error } = await ctx.db
                .from('certification_settings')
                .upsert({
                    tenant_id: ctx.tenantId,
                    entity_type: input.entityType,
                    category_key: input.categoryKey,
                    label: input.label,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'tenant_id, entity_type, category_key'
                });

            if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
            return { success: true };
        }),

    getCertifications: protectedProcedure
        .input(z.object({
            entityType: z.string(),
            entityId: z.string().uuid(),
            categoryKey: z.string().optional()
        }))
        .query(async ({ ctx, input }) => {
            let query = ctx.db
                .from('certifications')
                .select('*')
                .eq('tenant_id', ctx.tenantId)
                .eq('entity_type', input.entityType)
                .eq('entity_id', input.entityId);

            if (input.categoryKey) {
                query = query.eq('category_key', input.categoryKey);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
            return data;
        }),

    create: protectedProcedure
        .input(z.object({
            entityType: z.string(),
            entityId: z.string().uuid(),
            categoryKey: z.string(),
            fileName: z.string(),
            filePath: z.string(),
            fileType: z.string(),
            fileSize: z.number().optional()
        }))
        .mutation(async ({ ctx, input }) => {
            const { data, error } = await ctx.db
                .from('certifications')
                .insert({
                    tenant_id: ctx.tenantId,
                    entity_type: input.entityType,
                    entity_id: input.entityId,
                    category_key: input.categoryKey,
                    file_name: input.fileName,
                    file_path: input.filePath,
                    file_type: input.fileType,
                    file_size: input.fileSize,
                    uploaded_by: ctx.user.id
                })
                .select()
                .single();

            if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
            return data;
        }),

    delete: protectedProcedure
        .input(z.string().uuid())
        .mutation(async ({ ctx, input }) => {
            // First get the file path to cleanup storage if needed (optional, handled by client or trigger often easier)
            // For now, just delete the record. Secure cleanup is extensive.
            const { error } = await ctx.db
                .from('certifications')
                .delete()
                .eq('id', input)
                .eq('tenant_id', ctx.tenantId);

            if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
            return { success: true };
        })
});

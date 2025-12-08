
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

export const activityRouter = createTRPCRouter({
    getRecent: protectedProcedure
        .input(z.object({
            limit: z.number().default(10),
            range: z.enum(['today', 'week', 'month', 'year', 'all']).default('all'),
            entityType: z.string().optional(),
            entityId: z.string().uuid().optional(),
            customerId: z.string().uuid().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const now = new Date();
            let startDate: string | undefined;
            let endDate: string | undefined;

            switch (input.range) {
                case 'today':
                    startDate = startOfDay(now).toISOString();
                    endDate = endOfDay(now).toISOString();
                    break;
                case 'week':
                    startDate = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
                    endDate = endOfWeek(now, { weekStartsOn: 1 }).toISOString();
                    break;
                case 'month':
                    startDate = startOfMonth(now).toISOString();
                    endDate = endOfMonth(now).toISOString();
                    break;
                case 'year':
                    startDate = startOfYear(now).toISOString();
                    endDate = endOfYear(now).toISOString();
                    break;
                case 'all':
                    startDate = undefined;
                    endDate = undefined;
                    break;
            }

            const { entityType, entityId, customerId, limit } = input;

            let query = ctx.db
                .from('activity_logs')
                .select(`
            *,
            actor:users(first_name, last_name, email)
        `)
                .eq('tenant_id', ctx.user.user_metadata.tenant_id)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (entityType) {
                query = query.eq('entity_type', entityType)
            }

            if (entityId) {
                query = query.eq('entity_id', entityId)
            }

            if (customerId) {
                query = query.eq('customer_id', customerId)
            }

            if (startDate && endDate) {
                query = query.gte('created_at', startDate).lte('created_at', endDate);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data;
        }),
});

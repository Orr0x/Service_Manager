import { createTRPCRouter, protectedProcedure } from '../trpc'
import { z } from 'zod'

export const usersRouter = createTRPCRouter({
    me: protectedProcedure.query(async ({ ctx }) => {
        const { data: user, error } = await ctx.db
            .from('users')
            .select('*')
            .eq('id', ctx.user.id)
            .maybeSingle()

        if (error) {
            throw error
        }

        if (!user) {
            // Self-heal: Create the user in public.users if missing
            const { data: newUser, error: createError } = await ctx.db
                .from('users')
                .insert({
                    id: ctx.user.id,
                    tenant_id: ctx.tenantId,
                    email: ctx.user.email!,
                    role: (ctx.user.user_metadata.role as any) || 'admin', // Default to admin for safety or fallback
                    first_name: '',
                    last_name: '',
                })
                .select()
                .single()

            if (createError) {
                // If specific error, throw
                throw createError
            }
            return {
                ...newUser,
                email: ctx.user.email,
                role: (ctx.user.user_metadata?.role as any) || newUser?.role || 'user',
            }
        }

        return {
            ...user,
            email: ctx.user.email,
            role: (ctx.user.user_metadata?.role as any) || user?.role || 'user',
        }
    }),

    update: protectedProcedure
        .input(
            z.object({
                firstName: z.string().min(1).optional(),
                lastName: z.string().min(1).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const updates: any = {}
            if (input.firstName) updates.first_name = input.firstName
            if (input.lastName) updates.last_name = input.lastName

            const { data, error } = await ctx.db
                .from('users')
                .update(updates)
                .eq('id', ctx.user.id)
                .select()
                .single()

            if (error) {
                throw error
            }

            return data
        }),
})

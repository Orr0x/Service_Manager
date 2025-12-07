import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { createAdminClient } from '@/lib/supabase/admin'
import { TRPCError } from '@trpc/server'

export const adminRouter = createTRPCRouter({
    listUsers: protectedProcedure.query(async ({ ctx }) => {
        // Only admins can list users
        if (ctx.user.user_metadata.role !== 'admin') {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can view users' })
        }

        const { data: users, error } = await ctx.db
            .from('users')
            .select(`
                *,
                workers (id, first_name, last_name),
                contractors (id, company_name, contact_name)
            `)
            .eq('tenant_id', ctx.tenantId)
            .order('email')

        if (error) throw error
        return users
    }),

    inviteUser: protectedProcedure
        .input(z.object({
            email: z.string().email(),
            role: z.string(),
            workerId: z.string().optional(),
            contractorId: z.string().optional()
        }))
        .mutation(async ({ ctx, input }) => {
            if (ctx.user.user_metadata.role !== 'admin') {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can invite users' })
            }

            const supabaseAdmin = createAdminClient()

            // 1. Invite User via Supabase Auth
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
                input.email,
                {
                    data: {
                        role: input.role,
                        tenant_id: ctx.tenantId
                    }
                }
            )

            if (authError) {
                // Determine if user already exists
                if (authError.message.includes('already registered')) {
                    throw new TRPCError({ code: 'CONFLICT', message: 'User already registered' })
                }
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: authError.message })
            }

            const userId = authData.user.id

            // 2. Link to Worker or Contractor
            if (input.workerId) {
                await ctx.db.from('workers').update({ user_id: userId }).eq('id', input.workerId)
            } else if (input.contractorId) {
                await ctx.db.from('contractors').update({ user_id: userId }).eq('id', input.contractorId)
            }

            return { success: true, userId }
        }),

    toggleUserStatus: protectedProcedure
        .input(z.object({
            userId: z.string(),
            isActive: z.boolean()
        }))
        .mutation(async ({ ctx, input }) => {
            if (ctx.user.user_metadata.role !== 'admin') {
                throw new TRPCError({ code: 'FORBIDDEN' })
            }

            // Update local user table
            const { error } = await ctx.db
                .from('users')
                .update({ is_active: input.isActive })
                .eq('id', input.userId)

            if (error) throw error

            // Ideally we also ban/unban in Supabase Auth, but usually local check is enough if RLS uses it. 
            // For now, let's keep it simple: relying on is_active in our DB.
            // If stronger security needed, we'd use admin.updateUserById(uid, { ban_duration: ... })

            return { success: true }
        }),

    resetPassword: protectedProcedure
        .input(z.object({ email: z.string().email() }))
        .mutation(async ({ ctx, input }) => {
            if (ctx.user.user_metadata.role !== 'admin') {
                throw new TRPCError({ code: 'FORBIDDEN' })
            }

            const supabaseAdmin = createAdminClient()
            const { data, error } = await supabaseAdmin.auth.admin.generateLink({
                type: 'recovery',
                email: input.email
            })

            if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })

            // In a real app, you might return data.properties.action_link or just confirm it was sent
            return { success: true }
        }),

    getUnlinkedEntities: protectedProcedure.query(async ({ ctx }) => {
        if (ctx.user.user_metadata.role !== 'admin') {
            throw new TRPCError({ code: 'FORBIDDEN' })
        }

        const { data: workers } = await ctx.db
            .from('workers')
            .select('id, first_name, last_name, email, role')
            .eq('tenant_id', ctx.tenantId)
            .is('user_id', null)

        const { data: contractors } = await ctx.db
            .from('contractors')
            .select('id, company_name, contact_name, email')
            .eq('tenant_id', ctx.tenantId)
            .is('user_id', null)

        return {
            workers: workers || [],
            contractors: contractors || []
        }
    })
})

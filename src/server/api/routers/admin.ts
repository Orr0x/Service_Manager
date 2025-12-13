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

        const supabaseAdmin = createAdminClient()

        // 1. Fetch Existing Users
        const { data: users } = await supabaseAdmin
            .from('users')
            .select(`
                *,
                workers (id, first_name, last_name),
                contractors (id, company_name, contact_name),
                customers (id, business_name, contact_name)
            `)
            .eq('tenant_id', ctx.tenantId)
            .order('email')

        // 2. Fetch Unlinked Workers
        const { data: workers } = await ctx.db
            .from('workers')
            .select('id, first_name, last_name, email, role')
            .eq('tenant_id', ctx.tenantId)
            .is('user_id', null)

        // 3. Fetch Unlinked Contractors
        const { data: contractors } = await ctx.db
            .from('contractors')
            .select('id, company_name, contact_name, email')
            .eq('tenant_id', ctx.tenantId)
            .is('user_id', null)

        // 4. Fetch Customers (Potential Users)
        const { data: customers } = await ctx.db
            .from('customers')
            .select('id, business_name, contact_name, email, user_id')
            .eq('tenant_id', ctx.tenantId)

        // Combine into unified list
        const unifiedList = [
            ...(users?.map(u => ({
                id: u.id,
                type: 'user' as const,
                name: u.first_name ? `${u.first_name} ${u.last_name}` :
                    u.workers?.[0] ? `${u.workers[0].first_name} ${u.workers[0].last_name}` :
                        u.contractors?.[0] ? u.contractors[0].company_name :
                            u.customers?.[0] ? (u.customers[0].business_name || u.customers[0].contact_name) :
                                'Unknown User',
                email: u.email,
                role: u.role,
                status: u.is_active ? 'Active' : 'Blocked',
                linkedEntity: u.workers?.[0] ? { id: u.workers[0].id, type: 'worker', name: `${u.workers[0].first_name} ${u.workers[0].last_name}` } :
                    u.contractors?.[0] ? { id: u.contractors[0].id, type: 'contractor', name: u.contractors[0].company_name } :
                        u.customers?.[0] ? { id: u.customers[0].id, type: 'customer', name: u.customers[0].business_name || u.customers[0].contact_name } :
                            null
            })) || []),

            ...(workers?.map(w => ({
                id: w.id,
                type: 'worker' as const,
                name: `${w.first_name} ${w.last_name}`,
                email: w.email,
                role: w.role, // 'Manager' | 'Technician' etc.
                status: 'Unlinked',
                linkedEntity: null
            })) || []),

            ...(contractors?.map(c => ({
                id: c.id,
                type: 'contractor' as const,
                name: c.company_name,
                email: c.email,
                role: 'Contractor',
                status: 'Unlinked',
                linkedEntity: null
            })) || []),

            ...(customers?.filter(c => !c.user_id).map(c => ({
                id: c.id,
                type: 'customer' as const,
                name: c.business_name || c.contact_name,
                email: c.email,
                role: 'Customer',
                status: 'Unlinked',
                linkedEntity: null
            })) || [])
        ]

        return unifiedList
    }),

    inviteUser: protectedProcedure
        .input(z.object({
            email: z.string().email(),
            role: z.string(),
            workerId: z.string().optional(),
            contractorId: z.string().optional(),
            customerId: z.string().optional()
        }))
        .mutation(async ({ ctx, input }) => {
            if (ctx.user.user_metadata.role !== 'admin') {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can invite users' })
            }

            const supabaseAdmin = createAdminClient()

            let userId = ''

            // List of test domains that should bypass email invite and default to password creation
            const TEST_DOMAINS = ['client.com', 'example.com', 'sparkle.com', 'zap.com', 'flow.com', 'wood.com', 'safegas.com', 'fixall.com', 'fixit.com']
            const isTestEmail = TEST_DOMAINS.some(domain => input.email.toLowerCase().endsWith(`@${domain}`))

            if (isTestEmail) {
                // Force Create for Test Users
                const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email: input.email,
                    password: 'password123',
                    email_confirm: true,
                    user_metadata: {
                        role: input.role,
                        tenant_id: ctx.tenantId
                    }
                })

                if (!createError) {
                    userId = createData.user.id
                } else if (createError.message.toLowerCase().includes('registered')) {
                    // If created fails because exists, we need to find the ID
                    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
                    const existingUser = usersData.users.find(u => u.email?.toLowerCase() === input.email.toLowerCase())
                    if (existingUser) {
                        userId = existingUser.id
                    } else {
                        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'User exists but could not be found' })
                    }
                } else {
                    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Create failed: ${createError.message}` })
                }
            } else {
                // 1. Try Invite User via Supabase Auth (Standard Flow)
                const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
                    input.email,
                    {
                        data: {
                            role: input.role,
                            tenant_id: ctx.tenantId
                        }
                    }
                )

                if (!inviteError) {
                    userId = inviteData.user.id
                } else {
                    // Handle specific errors
                    const isInvalidEmail = inviteError.message.toLowerCase().includes('invalid') || inviteError.status === 422
                    const isAlreadyRegistered = inviteError.message.toLowerCase().includes('already registered')

                    if (isInvalidEmail) {
                        // Fallback to createUser for seed/test emails (e.g. example.com)
                        // We set a default password for these users so they can log in since they can't confirm email
                        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                            email: input.email,
                            password: 'password123',
                            email_confirm: true,
                            user_metadata: {
                                role: input.role,
                                tenant_id: ctx.tenantId
                            }
                        })

                        if (!createError) {
                            userId = createData.user.id
                        } else if (createError.message.toLowerCase().includes('registered')) {
                            // If created fails because exists, we need to find the ID
                            const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
                            const existingUser = usersData.users.find(u => u.email?.toLowerCase() === input.email.toLowerCase())
                            if (existingUser) {
                                userId = existingUser.id
                            } else {
                                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'User exists but could not be found' })
                            }
                        } else {
                            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Create failed: ${createError.message}` })
                        }
                    } else if (isAlreadyRegistered) {
                        // Fetch existing user ID
                        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
                        const existingUser = usersData.users.find(u => u.email?.toLowerCase() === input.email.toLowerCase())
                        if (existingUser) {
                            userId = existingUser.id
                        } else {
                            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'User registered but not found in list' })
                        }
                    } else {
                        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: inviteError.message })
                    }
                }
            }

            // 2. Fetch Entity Details for Name
            let firstName = ''
            let lastName = ''

            if (input.workerId) {
                const { data: w } = await ctx.db.from('workers').select('first_name, last_name').eq('id', input.workerId).single()
                if (w) {
                    firstName = w.first_name
                    lastName = w.last_name
                }
            } else if (input.contractorId) {
                const { data: c } = await ctx.db.from('contractors').select('contact_name').eq('id', input.contractorId).single()
                if (c && c.contact_name) {
                    const parts = c.contact_name.split(' ')
                    firstName = parts[0]
                    lastName = parts.slice(1).join(' ')
                }
            } else if (input.customerId) {
                const { data: c } = await ctx.db.from('customers').select('contact_name').eq('id', input.customerId).single()
                if (c && c.contact_name) {
                    const parts = c.contact_name.split(' ')
                    firstName = parts[0]
                    lastName = parts.slice(1).join(' ')
                }
            }

            // 3. Create/Update Public User Record (Upsert to handle existing)
            // Use supabaseAdmin to bypass RLS
            const { error: upsertError } = await supabaseAdmin.from('users').upsert({
                id: userId,
                tenant_id: ctx.tenantId,
                email: input.email,
                role: input.role,
                first_name: firstName,
                last_name: lastName,
                is_active: true
            })

            if (upsertError) {
                console.error('Failed to upsert public user:', upsertError)
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Failed to create public user record: ${upsertError.message}` })
            }

            // 4. Link to Worker or Contractor or Customer
            let linkError
            if (input.workerId) {
                const { error } = await supabaseAdmin.from('workers').update({ user_id: userId }).eq('id', input.workerId)
                linkError = error
            } else if (input.contractorId) {
                const { error } = await supabaseAdmin.from('contractors').update({ user_id: userId }).eq('id', input.contractorId)
                linkError = error
            } else if (input.customerId) {
                const { error } = await supabaseAdmin.from('customers').update({ user_id: userId }).eq('id', input.customerId)
                linkError = error
            }

            if (linkError) {
                console.error('Failed to link entity:', linkError)
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Failed to link entity: ${linkError.message}` })
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

        const { data: customers } = await ctx.db
            .from('customers')
            .select('id, business_name, contact_name, email')
            .eq('tenant_id', ctx.tenantId)
            .is('user_id', null)

        return {
            workers: workers || [],
            contractors: contractors || [],
            customers: customers || []
        }
    }),

    createUser: protectedProcedure
        .input(z.object({
            email: z.string().email(),
            fullName: z.string().min(1),
            role: z.enum(['worker', 'customer', 'admin']),
            password: z.string().min(6).optional()
        }))
        .mutation(async ({ ctx, input }) => {
            if (ctx.user.user_metadata.role !== 'admin') {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can create users' })
            }

            const supabaseAdmin = createAdminClient()

            // 1. Create Supabase Auth User
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: input.email,
                password: input.password || 'TemporaryPass123!', // Default if not provided, really should be required or invite flow
                email_confirm: true,
                user_metadata: {
                    role: input.role,
                    tenant_id: ctx.tenantId
                }
            })

            if (authError) {
                if (authError.message.includes('already registered')) {
                    throw new TRPCError({ code: 'CONFLICT', message: 'User already exists' })
                }
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Auth creation failed: ${authError.message}` })
            }

            const userId = authData.user.id
            const [firstName, ...lastNameParts] = input.fullName.split(' ')
            const lastName = lastNameParts.join(' ') || ''

            // 2. Ensure Public User Record Exists (Upsert)
            const { error: upsertError } = await supabaseAdmin.from('users').upsert({
                id: userId,
                tenant_id: ctx.tenantId,
                email: input.email,
                role: input.role,
                first_name: firstName,
                last_name: lastName,
                is_active: true
            })

            if (upsertError) {
                // Cleanup auth user if possible? Or just fail.
                console.error('Failed to upsert public user:', upsertError)
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create public profile' })
            }

            // 3. Create Entity (Worker/Customer) and Link
            if (input.role === 'worker') {
                const { error: workerError } = await supabaseAdmin.from('workers').insert({
                    tenant_id: ctx.tenantId,
                    user_id: userId,
                    first_name: firstName,
                    last_name: lastName,
                    email: input.email,
                    role: 'Technician' // Default role
                })
                if (workerError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Failed to create worker profile: ${workerError.message}` })
            }

            return { success: true, userId }
        }),

    updateUser: protectedProcedure
        .input(z.object({
            userId: z.string(),
            fullName: z.string().min(1),
            role: z.string() // Verify if allowed to change role? Assuming just name update primarily.
        }))
        .mutation(async ({ ctx, input }) => {
            if (ctx.user.user_metadata.role !== 'admin') {
                throw new TRPCError({ code: 'FORBIDDEN' })
            }

            const supabaseAdmin = createAdminClient()
            const [firstName, ...lastNameParts] = input.fullName.split(' ')
            const lastName = lastNameParts.join(' ') || ''

            // 1. Update Public User
            const { error: userError } = await supabaseAdmin
                .from('users')
                .update({ first_name: firstName, last_name: lastName })
                .eq('id', input.userId)

            if (userError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update user' })

            // 2. Update Linked Entity (Best Effort)
            // Determine type by checking which table has the ID

            // Try Worker
            await supabaseAdmin.from('workers')
                .update({ first_name: firstName, last_name: lastName })
                .eq('user_id', input.userId);

            // Try Customer
            await supabaseAdmin.from('customers')
                .update({ contact_name: input.fullName }) // Keep business name? maybe only contact name.
                .eq('user_id', input.userId);

            // Try Contractor
            await supabaseAdmin.from('contractors')
                .update({ contact_name: input.fullName })
                .eq('user_id', input.userId);

            return { success: true }
        })
})

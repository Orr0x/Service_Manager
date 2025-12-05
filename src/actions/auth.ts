'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function signIn(prevState: unknown, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/auth/sign-in')
}

// Admin only action to create users
export async function createUser(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const role = formData.get('role') as 'provider' | 'staff' | 'admin'
    const tenantId = formData.get('tenantId') as string

    // Verify caller is admin (TODO: Implement proper admin check)
    // For now, we assume this action is protected by the UI/Middleware

    const supabaseAdmin = createAdminClient()

    // 1. Create user in auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role, tenant_id: tenantId }
    })

    if (authError) {
        return { error: authError.message }
    }

    if (!authUser.user) {
        return { error: 'Failed to create user' }
    }

    // 2. Create user in public.users
    // Note: We use the admin client to bypass RLS for creation if needed, 
    // but usually we want to respect RLS. However, creating a user for another tenant 
    // might require admin privileges.

    const { error: dbError } = await supabaseAdmin
        .from('users')
        .insert({
            id: authUser.user.id,
            email: email,
            role: role,
            tenant_id: tenantId
        })

    if (dbError) {
        // Rollback auth user creation if DB insert fails?
        // For MVP, we'll just report error.
        return { error: `User created but DB record failed: ${dbError.message}` }
    }

    revalidatePath('/dashboard/users')
    return { success: true }
}

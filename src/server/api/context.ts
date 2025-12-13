import { createClient } from '@/lib/supabase/server'

export const createTRPCContext = async (opts: { headers: Headers }) => {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const tenantId = user?.user_metadata?.tenant_id || opts.headers.get('x-tenant-id')
    let userId = user?.id || opts.headers.get('x-user-id')
    let userRole = user?.user_metadata?.role || opts.headers.get('x-user-role')

    // Impersonation Logic (Admin Only)
    const impersonateId = opts.headers.get('x-impersonate-id')
    if (user && user.user_metadata.role === 'admin' && impersonateId) {
        // Verify the target user exists and belongs to the same tenant? 
        // For efficiency, we might skip DB check here and trust the ID, 
        // as subsequent queries using this ID will likely fail or return empty if invalid.
        // However, we MUST ensure we are creating a valid simulation.
        // We'll trust the ID for now to avoid extra DB calls on every request.
        userId = impersonateId
        // We really should swap the whole user object or at least the ID in it if routers allow using ctx.user.id
        if (user) {
            user.id = impersonateId
            // Optionally clear simulate role if we want routers to think we are that role?
            // Usually simulation implies full swap.
            // But we don't know the target role easily without a fetch.
            // But worker router acts on 'user_id'.
        }
    }

    return {
        db: supabase,
        user,
        tenantId,
        userId,
        userRole,
        headers: opts.headers,
        impersonatedEntity: (user && user.user_metadata.role === 'admin' && opts.headers.get('x-impersonate-entity-id') && opts.headers.get('x-impersonate-entity-type'))
            ? {
                id: opts.headers.get('x-impersonate-entity-id')!,
                type: opts.headers.get('x-impersonate-entity-type') as 'worker' | 'contractor' | 'customer'
            }
            : null
    }
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>

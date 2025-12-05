import { createClient } from '@/lib/supabase/server'

export const createTRPCContext = async (opts: { headers: Headers }) => {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const tenantId = user?.user_metadata?.tenant_id || opts.headers.get('x-tenant-id')
    const userId = user?.id || opts.headers.get('x-user-id')
    const userRole = user?.user_metadata?.role || opts.headers.get('x-user-role')

    return {
        db: supabase,
        user,
        tenantId,
        userId,
        userRole,
        headers: opts.headers,
    }
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>

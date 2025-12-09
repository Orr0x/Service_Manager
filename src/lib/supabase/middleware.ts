import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Do not run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // IMPORTANT: DO NOT REMOVE auth.getUser()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // 1. Unauthenticated Restrictions
    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/auth') &&
        !request.nextUrl.pathname.startsWith('/login')
    ) {
        if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/worker')) {
            const url = request.nextUrl.clone()
            url.pathname = '/auth/sign-in'
            return NextResponse.redirect(url)
        }
    }

    // 2. Role-Based Access Control (RBAC)
    if (user) {
        const role = user.user_metadata?.role || 'provider'; // Use user_metadata as that's where invite saves it

        // Protect Admin Dashboard
        if (request.nextUrl.pathname.startsWith('/dashboard')) {
            if (role !== 'admin' && role !== 'manager') {
                const url = request.nextUrl.clone()
                if (role === 'customer') {
                    url.pathname = '/customer'
                } else {
                    url.pathname = '/worker'
                }
                return NextResponse.redirect(url)
            }
        }

        // Protect Worker App
        // Customers shouldn't see worker app?
        if (request.nextUrl.pathname.startsWith('/worker')) {
            if (role === 'customer') {
                const url = request.nextUrl.clone()
                url.pathname = '/customer'
                return NextResponse.redirect(url)
            }
        }

        // Protect Customer App (Optional - maybe workers shouldn't see it?)
        // For now open
    }

    // Inject tenant context headers if user exists
    if (user && user.user_metadata?.tenant_id) {
        supabaseResponse.headers.set('x-tenant-id', user.user_metadata.tenant_id as string)
        supabaseResponse.headers.set('x-user-id', user.id)
        supabaseResponse.headers.set('x-user-role', user.user_metadata.role as string || 'provider')
    }

    return supabaseResponse
}

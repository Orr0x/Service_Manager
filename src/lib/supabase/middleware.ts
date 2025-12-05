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

    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/auth') &&
        !request.nextUrl.pathname.startsWith('/login')
    ) {
        // no user, potentially redirect to login
        // For now, we allow public access unless explicitly protected
        // But per requirements, we should probably redirect dashboard
        if (request.nextUrl.pathname.startsWith('/dashboard')) {
            const url = request.nextUrl.clone()
            url.pathname = '/auth/sign-in'
            return NextResponse.redirect(url)
        }
    }

    // Inject tenant context headers if user exists
    if (user && user.app_metadata?.tenant_id) {
        supabaseResponse.headers.set('x-tenant-id', user.app_metadata.tenant_id as string)
        supabaseResponse.headers.set('x-user-id', user.id)
        supabaseResponse.headers.set('x-user-role', user.app_metadata.role as string || 'provider')
    }

    return supabaseResponse
}

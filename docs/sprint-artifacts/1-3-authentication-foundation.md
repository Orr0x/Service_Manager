# Story 1.3: Authentication Foundation

**Status:** ready-for-dev

## Story

As a system,
we need to implement the authentication foundation with Supabase Auth,
so that users can securely sign up, sign in, and have their tenant context properly established.

## Acceptance Criteria

1. Given the database schema is created
   When authentication is implemented
   Then Supabase Auth is configured with email/password providers
2. And JWT tokens include `tenant_id` in custom claims
3. And middleware extracts tenant context for all API calls
4. And refresh token rotation is enabled
5. And rate limiting is applied to auth endpoints

## Tasks / Subtasks

- [ ] Configure Supabase Auth (AC: 1)
  - [ ] Set up email/password authentication provider
  - [ ] Configure custom SMTP settings (or use Supabase default)
  - [ ] Enable email confirmation requirement
  - [ ] Set up password policies
- [ ] Implement tenant context in JWT tokens (AC: 2)
  - [ ] Create database trigger to add tenant_id to user metadata
  - [ ] Configure JWT custom claims
  - [ ] Create helper functions for token management
- [ ] Create authentication middleware (AC: 3)
  - [ ] Implement Next.js middleware for tenant context
  - [ ] Create server-side auth helpers
  - [ ] Create client-side auth hooks
- [ ] Set up session management (AC: 4)
  - [ ] Configure refresh token rotation
  - [ ] Implement session persistence
  - [ ] Handle session expiration
- [ ] Add rate limiting and security (AC: 5)
  - [ ] Implement rate limiting for auth endpoints
  - [ ] Add CSRF protection
  - [ ] Configure secure headers

## Dev Notes

### Critical Authentication Architecture

```typescript
// lib/auth.ts - Server-side auth helper
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function createServerClient() {
  const cookieStore = cookies()

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        }
      }
    }
  )
}

// lib/auth-client.ts - Client-side auth helper
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function useAuth() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        // Ensure tenant context is included
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error
    return data
  }, [supabase])

  // ... other auth methods
}
```

### Middleware for Tenant Context

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired
  const {
    data: { session },
    error
  } = await supabase.auth.getSession()

  // Add tenant context to headers for all authenticated requests
  if (session?.user?.app_metadata?.tenant_id) {
    res.headers.set('x-tenant-id', session.user.app_metadata.tenant_id)
    res.headers.set('x-user-id', session.user.id)
    res.headers.set('x-user-role', session.user.user_metadata?.role || 'provider')
  }

  // Handle auth routes
  if (req.nextUrl.pathname.startsWith('/auth')) {
    if (!session && !req.nextUrl.pathname.includes('/sign-in')) {
      return NextResponse.redirect(new URL('/auth/sign-in', req.url))
    }
    if (session && req.nextUrl.pathname.includes('/sign-in')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Protect dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/sign-in', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*']
}
```

### Database Triggers for Tenant Context

```sql
-- Trigger to automatically set tenant_id in user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tenant_record UUID;
BEGIN
  -- Get tenant from users table (will be created during registration)
  SELECT tenant_id INTO tenant_record
  FROM users
  WHERE id = NEW.id;

  -- Add tenant context to auth metadata
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    raw_user_meta_data,
    '{tenant_id}',
    to_jsonb(tenant_record)
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Trigger after user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### Auth Configuration Requirements

```typescript
// lib/supabase-admin.ts - For server-side operations
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export default supabaseAdmin
```

### Environment Variables

```env
# Add to .env.local
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### Rate Limiting Implementation

```typescript
// middleware/rate-limiter.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter (for development)
// In production, use Redis or similar
const authAttempts = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(req: NextRequest) {
  const ip = req.ip || 'anonymous'
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxAttempts = 5

  const attempts = authAttempts.get(ip)

  if (!attempts || now > attempts.resetTime) {
    authAttempts.set(ip, { count: 1, resetTime: now + windowMs })
    return null
  }

  if (attempts.count >= maxAttempts) {
    return NextResponse.json(
      { error: 'Too many attempts' },
      { status: 429 }
    )
  }

  attempts.count++
  return null
}
```

### Session Management Best Practices

1. **Always use server components for sensitive data**
2. **Store only necessary data in JWT metadata**
3. **Implement proper session refresh**
4. **Handle edge cases (network issues, token theft)**
5. **Log auth events for security monitoring**

### Testing Strategy

```typescript
// __tests__/auth.test.ts
describe('Authentication', () => {
  it('should sign up with email/password')
  it('should confirm email address')
  it('should sign in with valid credentials')
  it('should reject invalid credentials')
  it('should refresh expired tokens')
  it('should include tenant_id in session')
  it('should handle rate limiting')
  it('should protect routes')
})
```

### Security Considerations

1. **Password Requirements**:
   - Minimum 8 characters
   - Include uppercase, lowercase, number
   - Optional: special character requirement

2. **Session Security**:
   - HttpOnly cookies
   - Secure flag in production
   - SameSite=Strict

3. **CSRF Protection**:
   - Use built-in Next.js CSRF protection
   - Verify origin headers

4. **Rate Limiting**:
   - 5 attempts per 15 minutes for auth
   - Separate limits for different endpoints

## Dev Agent Record

### Context Reference
- [DEV_HANDOVER.md](/docs/DEV_HANDOVER.md#Development Environment Setup)
- [Story 1.2](/docs/sprint-artifacts/1-2-database-schema-setup.md) - Database schema prerequisite
- [Architecture.md](/docs/architecture.md) - Security patterns

### Agent Model Used
Claude Opus 4.5 (2025-11-01)

### Debug Log References

### Completion Notes List

### File List

## Change Log

### References
- [Source: /docs/DEV_HANDOVER.md#Development Environment Setup]
- [Source: /docs/epics.md#Story 1.3]
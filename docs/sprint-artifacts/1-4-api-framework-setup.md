# Story 1.4: API Framework Setup

**Status:** ready-for-dev

## Story

As a development team,
we need to set up the tRPC API framework with proper type safety and tenant isolation,
so that all subsequent API endpoints are consistent and secure.

## Acceptance Criteria

1. Given authentication is configured
   When the API framework is set up
   Then tRPC is initialized with proper TypeScript configuration
2. And all routes automatically validate tenant_id from context
3. And error handling follows the defined patterns
4. And API documentation is auto-generated
5. And rate limiting is configured for all endpoints

## Tasks / Subtasks

- [ ] Initialize tRPC framework (AC: 1)
  - [ ] Install tRPC dependencies
  - [ ] Set up tRPC instance with superjson transformer
  - [ ] Configure error formatter
  - [ ] Create API router structure
- [ ] Implement tenant context validation (AC: 2)
  - [ ] Create tRPC context with tenant validation
  - [ ] Add middleware for tenant isolation
  - [ ] Implement automatic tenant_id injection
- [ ] Set up error handling patterns (AC: 3)
  - [ ] Define custom error types
  - [ ] Implement error boundaries
  - [ ] Create error logging
- [ ] Configure API documentation (AC: 4)
  - [ ] Set up tRPC OpenAPI documentation
  - [ ] Create API explorer UI
  - [ ] Generate TypeScript types
- [ ] Implement rate limiting (AC: 5)
  - [ ] Add rate limiting middleware
  - [ ] Configure endpoint-specific limits
  - [ ] Add monitoring for API usage

## Dev Notes

### tRPC Core Configuration

```typescript
// server/api/root.ts
import { initTRPC } from '@trpc/server'
import { ZodError } from 'zod'
import superjson from 'superjson'
import { type Context } from './context'

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter(opts) {
    const { shape, error } = opts
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null
      }
    }
  }
})

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.tenantId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      // infers that `session` and `tenantId` are non-nullable
      session: ctx.session,
      tenantId: ctx.tenantId
    }
  })
})
```

### tRPC Context with Tenant Validation

```typescript
// server/api/context.ts
import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import { type Session } from '@supabase/auth-helpers-nextjs'
import { createServerClient } from '@/lib/auth'
import { TRPCError } from '@trpc/server'

export type AuthenticatedContext = {
  session: Session
  tenantId: string
  userId: string
  userRole: string
}

export type Context = {
  session: Session | null
  tenantId: string | null
  userId: string | null
  userRole: string | null
  supabase: ReturnType<typeof createServerClient>
}

export async function createTRPCContext(
  opts: CreateNextContextOptions
): Promise<Context> {
  const { req, res } = opts
  const supabase = createServerClient(req, res)

  // Get session from Supabase
  const {
    data: { session },
    error
  } = await supabase.auth.getSession()

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get session'
    })
  }

  // Extract tenant context from headers (set by middleware)
  const tenantId = req.headers.get('x-tenant-id')
  const userId = req.headers.get('x-user-id')
  const userRole = req.headers.get('x-user-role')

  // Validate tenant context for authenticated requests
  if (session && (!tenantId || !userId)) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Missing tenant context'
    })
  }

  return {
    session,
    tenantId,
    userId,
    userRole,
    supabase
  }
}
```

### API Router Structure

```typescript
// server/api/root.ts (continued)
import { usersRouter } from './routers/users'
import { authRouter } from './routers/auth'
import { tenantsRouter } from './routers/tenants'

export const appRouter = router({
  auth: authRouter,
  users: usersRouter,
  tenants: tenantsRouter,
  // Add more routers as needed
})

export type AppRouter = typeof appRouter
```

### Example Router with Tenant Isolation

```typescript
// server/api/routers/users.ts
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { protectedProcedure, router } from '../root'

export const usersRouter = router({
  // Get current user profile
  me: protectedProcedure.query(async ({ ctx }) => {
    const { data: user, error } = await ctx.supabase
      .from('users')
      .select(`
        *,
        provider_profiles(*)
      `)
      .eq('id', ctx.userId!)
      .eq('tenant_id', ctx.tenantId!)
      .single()

    if (error || !user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found'
      })
    }

    return user
  }),

  // Update user profile
  update: protectedProcedure
    .input(
      z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data: user, error } = await ctx.supabase
        .from('users')
        .update({
          first_name: input.firstName,
          last_name: input.lastName,
          email: input.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', ctx.userId!)
        .eq('tenant_id', ctx.tenantId!)
        .select()
        .single()

      if (error || !user) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update user'
        })
      }

      return user
    }),

  // Get all users in tenant (admin only)
  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional()
      })
    )
    .use(async ({ ctx, next }) => {
      // Check if user is admin
      if (ctx.userRole !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required'
        })
      }
      return next()
    })
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('tenant_id', ctx.tenantId!)
        .order('created_at', { ascending: false })
        .range(
          (input.page - 1) * input.limit,
          input.page * input.limit - 1
        )

      if (input.search) {
        query = query.or(
          `first_name.ilike.%${input.search}%,last_name.ilike.%${input.search}%,email.ilike.%${input.search}%`
        )
      }

      const { data: users, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch users'
        })
      }

      return {
        users,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: count || 0
        }
      }
    })
})
```

### Rate Limiting Middleware

```typescript
// server/api/middleware/rate-limit.ts
import { TRPCError } from '@trpc/server'
import { type Middleware } from '@trpc/server'

interface RateLimitOptions {
  windowMs: number
  max: number
  message?: string
}

const store = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(options: RateLimitOptions): Middleware {
  return async ({ ctx, next }) => {
    const key = `${ctx.tenantId || 'anonymous'}-${ctx.userId || 'anonymous'}`
    const now = Date.now()

    const record = store.get(key)

    if (!record || now > record.resetTime) {
      store.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      })
      return next()
    }

    if (record.count >= options.max) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: options.message || 'Rate limit exceeded'
      })
    }

    record.count++
    return next()
  }
}

// Usage example
export const limitedProcedure = t.procedure.use(
  rateLimit({ windowMs: 60000, max: 100 }) // 100 requests per minute
)
```

### Error Handling Patterns

```typescript
// server/api/errors.ts
import { TRPCError } from '@trpc/server'

export class NotFoundError extends TRPCError {
  constructor(resource: string) {
    super({
      code: 'NOT_FOUND',
      message: `${resource} not found`
    })
  }
}

export class UnauthorizedError extends TRPCError {
  constructor(message = 'Unauthorized') {
    super({
      code: 'UNAUTHORIZED',
      message
    })
  }
}

export class ForbiddenError extends TRPCError {
  constructor(message = 'Forbidden') {
    super({
      code: 'FORBIDDEN',
      message
    })
  }
}

export class ValidationError extends TRPCError {
  constructor(message: string) {
    super({
      code: 'BAD_REQUEST',
      message
    })
  }
}
```

### API Documentation Setup

```typescript
// server/api/openapi.ts
import { generateOpenAPI } from 'trpc-openapi'
import { appRouter } from './root'
import { ApplyOpenAPI } from 'trpc-openapi/ApplyOpenAPI'

export const openApiSpec = generateOpenAPI({
  router: appRouter,
  title: 'Service Manager API',
  description: 'API documentation for Service Manager platform',
  version: '1.0.0',
  baseUrl: '/api/trpc',
  docsUrl: '/api/docs',
  securitySchemes: {
    bearer: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    }
  }
})

// Apply OpenAPI metadata to procedures
export const openApiProcedure = t.procedure.use(
  ApplyOpenAPI({
    method: 'GET',
    path: '/health',
    summary: 'Health check',
    tags: ['Health']
  })
)
```

### Testing Strategy

```typescript
// __tests__/api/users.test.ts
import { createTRPCMsw } from 'trpc-msw'
import { AppRouter } from '@/server/api/root'
import { setupServer } from 'msw/node'
import { rest } from 'msw'

const trpcMsw = createTRPCMsw<AppRouter>('http://localhost:3000/api/trpc')
const server = setupServer(...trpcMsw.interceptors)

describe('Users API', () => {
  beforeAll(() => server.listen())
  afterAll(() => server.close())
  afterEach(() => server.resetHandlers())

  it('should get current user', async () => {
    server.use(
      trpcMsw.users.me.query((req, res, ctx) => {
        return res(
          ctx.data({
            id: 'user-id',
            email: 'test@example.com',
            tenant_id: 'tenant-id'
          })
        )
      })
    )

    // Test implementation
  })
})
```

### Critical Security Rules

1. **Always validate tenant_id** in every database query
2. **Never trust client-provided tenant context**
3. **Use protectedProcedure** for authenticated endpoints
4. **Implement proper error messages** (don't leak sensitive info)
5. **Add input validation** with Zod schemas
6. **Log API calls** for auditing

### Performance Considerations

1. **Database indexing**: Ensure tenant_id columns are indexed
2. **Connection pooling**: Configure Supabase connection pooling
3. **Response caching**: Use React Query for client-side caching
4. **Batch operations**: Where possible, batch database operations

## Dev Agent Record

### Context Reference
- [DEV_HANDOVER.md](/docs/DEV_HANDOVER.md#API Design Pattern)
- [Story 1.3](/docs/sprint-artifacts/1-3-authentication-foundation.md) - Authentication prerequisite
- [Architecture.md](/docs/architecture.md) - API patterns

### Agent Model Used
Claude Opus 4.5 (2025-11-01)

### Debug Log References

### Completion Notes List

### File List

## Change Log

### References
- [Source: /docs/DEV_HANDOVER.md#API Design Pattern]
- [Source: /docs/epics.md#Story 1.4]
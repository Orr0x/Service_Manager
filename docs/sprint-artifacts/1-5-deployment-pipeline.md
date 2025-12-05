# Story 1.5: Deployment Pipeline

**Status:** ready-for-dev

## Story

As a team,
we need to configure the CI/CD pipeline with automatic deployments to Vercel,
so that we can continuously and reliably deploy new features.

## Acceptance Criteria

1. Given the API framework is ready
   When the deployment pipeline is configured
   Then Vercel deployment is triggered on push to main branch
2. Then environment variables are properly configured for production
3. Then database migrations run automatically on deployment
4. Then SSL certificates are automatically configured
5. Then monitoring and error tracking is integrated

## Tasks / Subtasks

- [ ] Configure Vercel project (AC: 1)
  - [ ] Create Vercel project linked to GitHub repository
  - [ ] Set up production and preview environments
  - [ ] Configure build commands and output directory
  - [ ] Set up deployment hooks and notifications
- [ ] Set up environment variables (AC: 2)
  - [ ] Create production environment variables in Vercel
  - [ ] Configure staging environment variables
  - [ ] Set up secrets management
  - [ ] Document environment variable requirements
- [ ] Configure database migrations (AC: 3)
  - [ ] Set up Supabase CLI for production
  - [ ] Create migration scripts
  - [ ] Configure automatic migration on deploy
  - [ ] Set up database backup strategy
- [ ] Configure SSL and security (AC: 4)
  - [ ] Verify automatic SSL certificate generation
  - [ ] Set up security headers
  - [ ] Configure domain customizations
- [ ] Set up monitoring (AC: 5)
  - [ ] Integrate Sentry for error tracking
  - [ ] Configure Vercel Analytics
  - [ ] Set up uptime monitoring
  - [ ] Create deployment status dashboards

## Dev Notes

### Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_APP_URL": {
      "description": "The public URL of the application"
    },
    "NEXT_PUBLIC_SUPABASE_URL": {
      "description": "Supabase project URL",
      "value": "@supabase-url"
    },
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": {
      "description": "Supabase anonymous key",
      "value": "@supabase-anon-key"
    },
    "SUPABASE_SERVICE_ROLE_KEY": {
      "description": "Supabase service role key (secret)",
      "value": "@supabase-service-key"
    },
    "NEXTAUTH_SECRET": {
      "description": "Secret for Next.js authentication",
      "value": "@nextauth-secret"
    },
    "SENTRY_DSN": {
      "description": "Sentry DSN for error tracking",
      "value": "@sentry-dsn"
    }
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_APP_ENV": "production"
    }
  }
}
```

### GitHub Actions for CI

```yaml
// .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run type-check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: .next/
```

### Database Migration Setup

```typescript
// scripts/migrate.ts
import { execSync } from 'child_process'
import { config } from 'dotenv'

config({ path: '.env.production' })

async function migrate() {
  try {
    console.log('Running database migrations...')

    // Check Supabase CLI status
    execSync('npx supabase status', { stdio: 'inherit' })

    // Push local migrations to production
    execSync('npx supabase db push', { stdio: 'inherit' })

    console.log('Migrations completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  migrate()
}

export default migrate
```

### Pre-deployment Hook

```typescript
// scripts/pre-deploy.ts
import { execSync } from 'child_process'

async function preDeploy() {
  console.log('🚀 Running pre-deployment checks...')

  try {
    // Run type checking
    console.log('Running type checks...')
    execSync('npm run type-check', { stdio: 'inherit' })

    // Run linting
    console.log('Running linting...')
    execSync('npm run lint', { stdio: 'inherit' })

    // Run tests
    console.log('Running tests...')
    execSync('npm run test', { stdio: 'inherit' })

    // Build application
    console.log('Building application...')
    execSync('npm run build', { stdio: 'inherit' })

    console.log('✅ Pre-deployment checks passed!')
  } catch (error) {
    console.error('❌ Pre-deployment checks failed!')
    process.exit(1)
  }
}

if (require.main === module) {
  preDeploy()
}
```

### Sentry Error Tracking

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_APP_ENV,
  tracesSampleRate: 1.0,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true
    })
  ]
})

// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_APP_ENV,
  tracesSampleRate: 1.0,
  debug: false
})

// next.config.js additions
const nextConfig = {
  // ... existing config
  sentry: {
    hideSourceMaps: true,
    widenClientFileUpload: true
  }
}
```

### Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth'

export async function GET() {
  try {
    const supabase = createServerClient()

    // Check database connection
    const { error } = await supabase.from('tenants').select('id').limit(1)

    if (error) {
      throw error
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NEXT_PUBLIC_APP_ENV
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Database connection failed'
      },
      { status: 503 }
    )
  }
}
```

### Deployment Scripts

```json
// package.json additions
{
  "scripts": {
    "pre-deploy": "tsx scripts/pre-deploy.ts",
    "migrate": "tsx scripts/migrate.ts",
    "deploy:prod": "vercel --prod",
    "deploy:preview": "vercel",
    "build:analyze": "ANALYZE=true npm run build"
  }
}
```

### Environment Configuration

```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']),
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional()
})

export const env = envSchema.parse(process.env)
```

### Vercel Analytics Setup

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### Deployment Checklist

1. **Before First Deploy:**
   - [ ] Configure all environment variables
   - [ ] Set up domain in Vercel dashboard
   - [ ] Configure DNS if using custom domain
   - [ ] Set up Sentry project
   - [ ] Test database migrations locally

2. **Production Deployment:**
   - [ ] Run `npm run pre-deploy`
   - [ ] Run `npm run migrate`
   - [ ] Deploy to Vercel: `npm run deploy:prod`
   - [ ] Verify SSL certificate
   - [ ] Test health check endpoint
   - [ ] Monitor error tracking

3. **Post-Deployment:**
   - [ ] Verify all functionality works
   - [ ] Check for any errors in Sentry
   - [ ] Monitor Vercel Analytics
   - [ ] Update documentation

### Monitoring and Alerting

```typescript
// lib/monitoring.ts
import { captureException, captureMessage } from '@sentry/nextjs'

export function reportError(error: Error, context?: Record<string, any>) {
  console.error(error)
  captureException(error, {
    contexts: { custom: context }
  })
}

export function reportMessage(message: string, level: 'info' | 'warning' = 'info') {
  console.log(message)
  captureMessage(message, level)
}

// Usage in API routes
try {
  // API logic
} catch (error) {
  reportError(error, {
    endpoint: '/api/example',
    method: 'POST',
    userId: ctx.userId
  })
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred'
  })
}
```

### Backup Strategy

1. **Database Backups:**
   - Enable daily backups in Supabase
   - Point-in-time recovery (7 days)
   - Weekly full exports

2. **Code Backups:**
   - GitHub repository
   - Vercel deployment history
   - CI/CD artifacts

### Security Best Practices

1. **Environment Variables:**
   - Never commit secrets to Git
   - Use Vercel's encrypted secrets
   - Rotate sensitive keys regularly

2. **Deployment Security:**
   - Enable branch protection rules
   - Require PR reviews for main branch
   - Use dependabot for security updates

3. **Runtime Security:**
   - Enable security headers
   - Implement rate limiting
   - Monitor for unusual activity

## Dev Agent Record

### Context Reference
- [DEV_HANDOVER.md](/docs/DEV_HANDOVER.md#Development Environment Setup)
- [Story 1.4](/docs/sprint-artifacts/1-4-api-framework-setup.md) - API framework prerequisite
- [Architecture.md](/docs/architecture.md) - Deployment patterns

### Agent Model Used
Claude Opus 4.5 (2025-11-01)

### Debug Log References

### Completion Notes List

### File List

## Change Log

### References
- [Source: /docs/DEV_HANDOVER.md#Development Environment Setup]
- [Source: /docs/epics.md#Story 1.5]
---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments: ['docs/prd.md']
workflowType: 'architecture'
lastStep: 5
project_name: 'Service_Manager'
user_name: 'Orrox'
date: '2025-12-04'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
- Multi-tenant provider onboarding and profile management
- Job posting, assignment, and cross-provider collaboration system
- Provider-to-provider connection requests and network building
- End customer booking interface with bundled service capabilities
- Real-time messaging and status tracking
- Payment processing with 5-8% transaction fee model
- Background verification and trust system
- Mobile worker apps with offline capability

**Non-Functional Requirements:**
- Performance: 99.9% uptime, <500ms API response times, 1-second real-time updates
- Scalability: 10,000 concurrent users, 10M+ daily transactions
- Security: Multi-tenant data isolation, end-to-end encryption, audit logging
- Mobile: App startup <3 seconds, offline capability for field workers
- Compliance: GDPR, CCPA compliance for data handling

**Scale & Complexity:**
- Primary domain: Full-stack SaaS with mobile components
- Complexity level: High (due to real-time coordination, multi-tenancy, network effects)
- Estimated architectural components: 12-15 major services

### Technical Constraints & Dependencies

**Infrastructure Dependencies:**
- PostgreSQL with row-level security for multi-tenancy
- Event-driven system for real-time updates
- Stripe API for payment processing
- AWS S3 for file/photo storage
- Google Maps API for location services
- CDN for content delivery

**Business Constraints:**
- Must validate network effects with test businesses before scaling
- 8-week MVP timeline for initial validation
- Serverless-first approach for cost efficiency

### Cross-Cutting Concerns Identified

- **Data Isolation**: Complete tenant separation in multi-tenant architecture
- **Real-time Coordination**: Job status sync across independent businesses
- **Trust & Safety**: Provider verification and rating systems
- **Network Effects**: Architecture must support viral growth mechanics
- **Mobile Offline**: Field workers need offline capability
- **Payment Processing**: Transaction fee calculations and distribution

## Starter Template Evaluation

### Primary Technology Domain

Full-stack SaaS with React/Next.js + Supabase based on project requirements analysis for multi-tenant service mesh platform

### Starter Options Considered

- **Vite + React + Supabase**: Basic setup, would need to build multi-tenancy from scratch
- **T3 Stack + Supabase**: Excellent TypeScript setup, but missing multi-tenancy scaffolding
- **Vercel SaaS Starter**: Production-ready with built-in multi-tenancy and billing

### Selected Starter: Vercel SaaS Starter Template

**Rationale for Selection:**
- Provides complete multi-tenant architecture with row-level security
- Includes Stripe billing integration (perfect for 5-8% transaction fees)
- Built with T3 stack (Next.js, TypeScript, Tailwind, tRPC)
- Production-ready with proper authentication and team management
- Designed specifically for network-effect platforms

**Supabase Infrastructure Ready:**
- Project: RSS (https://ktxnjsqgghjofwyludzm.supabase.co)
- Region: Europe
- Database: PostgreSQL with row-level security capability
- All API keys and service credentials available

**Initialization Command:**

```bash
npx create-next-app@latest service-manager --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Then configure Supabase:
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
# Set environment variables with existing credentials
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript with strict configuration
- Next.js 14 with App Router
- React 18 with Server Components

**Styling Solution:**
- Tailwind CSS with responsive design
- Custom component library structure
- Dark/light mode support

**Build Tooling:**
- Vite for development builds
- Next.js production optimization
- Automatic image optimization

**Testing Framework:**
- Jest + React Testing Library setup
- E2E testing with Playwright configured
- Type checking as part of build process

**Code Organization:**
- `/app` directory for Next.js App Router
- `/components` for reusable UI components
- `/lib` for utilities and database helpers
- `/types` for TypeScript definitions
- Multi-tenant data isolation patterns

**Development Experience:**
- Hot reloading with Fast Refresh
- TypeScript with path aliases
- Environment variable management
- Supabase local development setup

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Multi-tenant Strategy: Row-Level Security with tenant_id
- Real-time Communication: Supabase Realtime (WebSockets)
- Deployment Infrastructure: Vercel + Supabase

**Important Decisions (Shape Architecture):**
- API Design: Hybrid (tRPC for internal + REST for integrations)
- State Management: Zustand + React Query

### Data Architecture

**Multi-tenant Strategy:**
- Decision: Row-Level Security (RLS) with tenant_id column
- Rationale: Complete data isolation for independent service businesses, scalable with Supabase support
- Version: Supabase RLS (current)
- Affects: Database schema design, API security policies, data access patterns

### Real-time Communication Strategy

**Real-time Updates:**
- Decision: Supabase Realtime (WebSockets)
- Rationale: Built-in to Supabase, works with RLS, meets 1-second update requirement
- Version: Supabase Realtime (current)
- Affects: Job status updates, provider notifications, cross-business coordination

### API & Communication Patterns

**API Design:**
- Decision: Hybrid (tRPC for internal + REST for public/integrations)
- Rationale: Type safety with tRPC for internal, standard REST for third-party integrations
- Version: tRPC v10, REST (current)
- Affects: Internal API structure, public API documentation, integration strategy

### Frontend Architecture

**State Management:**
- Decision: Zustand + React Query
- Rationale: Clean separation of client/server state, excellent caching for real-time updates
- Version: Zustand v4, React Query v4 (current)
- Affects: Component state patterns, data fetching, offline synchronization

### Infrastructure & Deployment

**Deployment Strategy:**
- Decision: Vercel + Supabase
- Rationale: Serverless-first, perfect Next.js integration, global CDN for performance
- Version: Vercel (current), Supabase (current)
- Affects: CI/CD pipeline, environment configuration, scaling strategy

### Decision Impact Analysis

**Implementation Sequence:**
1. Initialize Vercel + Supabase project
2. Set up RLS policies with tenant_id
3. Configure Supabase Realtime subscriptions
4. Implement tRPC for internal APIs
5. Add REST endpoints for integrations
6. Set up Zustand + React Query state management

**Cross-Component Dependencies:**
- RLS policies must be established before real-time subscriptions
- tRPC routes depend on database schema with tenant isolation
- React Query caching strategy depends on API structure

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
8 areas where AI agents could make different choices that would break your Service Manager platform

### Naming Patterns

**Multi-tenant Data Conventions:**
- Database columns: `tenant_id` (snake_case, Supabase/PostgreSQL standard)
- TypeScript types: `tenantId` (camelCase, JavaScript/TypeScript idiomatic)
- API queries: `tenant_id` (snake_case, database layer)
- tRPC types: `tenantId` (camelCase, type layer)
- Transformation: Explicit conversion at layer boundaries

**Event System Patterns:**
- Event naming: Domain Event format `entity.action` (snake_case)
- Examples: `provider.created`, `job.updated`, `connection.requested`, `payment.processed`
- Consistent with Supabase Realtime conventions
- Clear business domain meaning

**Code Naming Conventions:**
- Components: PascalCase (UserCard, JobStatus)
- Files: kebab-case for components (user-card.tsx), PascalCase for utilities (DatabaseHelper.ts)
- Functions: camelCase (getUserData, updateJobStatus)
- Variables: camelCase (userId, jobStatus)
- Constants: UPPER_SNAKE_CASE (API_BASE_URL, MAX_RETRY_ATTEMPTS)

### Structure Patterns

**Project Organization:**
- `/app` - Next.js App Router pages and layouts
- `/components` - Reusable UI components organized by feature
- `/lib` - Utilities, database helpers, API clients
- `/types` - TypeScript type definitions
- `/hooks` - Custom React hooks
- `/stores` - Zustand store files
- `/api` - tRPC routers and REST API routes

**Multi-tenant File Patterns:**
- Each table has corresponding types file with camelCase mapping
- RLS policies use snake_case database columns
- API transformers handle case conversion between layers

### Format Patterns

**API Response Formats:**
- tRPC: Direct responses with automatic TypeScript typing
- REST: `{data: T, error?: {code: string, message: string, details?: any}}`
- Success responses: HTTP 200 with data
- Error responses: Appropriate HTTP codes with error object

**Data Exchange Formats:**
- JSON fields: camelCase in APIs, snake_case in database
- Dates: ISO 8601 strings in JSON, PostgreSQL timestamps in DB
- Booleans: true/false (not 1/0)
- IDs: UUID strings for all entities

### Communication Patterns

**Event System Patterns:**
- Domain Event naming: `entity.action` format
- Event payloads: `{event: string, data: T, tenant_id: string, timestamp: string}`
- Event versioning: Optional `version` field for breaking changes
- Async processing: Always acknowledge before processing

**State Management Patterns:**
- Zustand stores: Organized by domain (authStore, jobsStore, providersStore)
- React Query: Queries use snake_case for params, camelCase for types
- Immutable updates: Always return new state objects
- Loading states: Boolean flags per operation

### Process Patterns

**Error Handling Patterns:**
- tRPC: TRPCError with proper codes (UNAUTHORIZED, NOT_FOUND, etc.)
- REST: Semantic HTTP codes + JSON error object
- Consistent error codes across API types
- User-facing messages: Friendly, technical: detailed in logs

**Multi-tenant Process Patterns:**
- Every database query includes tenant_id filter
- API endpoints validate tenant_id from auth context
- Real-time subscriptions filtered by RLS policies
- File storage organized by tenant_id prefix

### Enforcement Guidelines

**All AI Agents MUST:**
- Use layer-specific naming conventions (snake_case in DB, camelCase in code)
- Include tenant_id in all multi-tenant operations
- Follow domain event naming pattern for real-time updates
- Use framework-appropriate error handling
- Convert between naming conventions at layer boundaries

**Pattern Enforcement:**
- TypeScript interfaces enforce naming conventions
- Database schema constraints enforce column naming
- Lint rules enforce code formatting and naming
- Code reviews check pattern compliance

### Pattern Examples

**Good Examples:**
```typescript
// Database type definition
type Job = {
  id: string;
  tenant_id: string;
  created_at: string;
  job_status: string;
}

// API type definition
type JobType = {
  id: string;
  tenantId: string;
  createdAt: string;
  jobStatus: string;
}

// API endpoint
app.get('/api/jobs/:id', async (req) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;

  const job = await db.query(
    'SELECT * FROM jobs WHERE id = $1 AND tenant_id = $2',
    [id, tenantId]
  );

  return { data: job };
});

// Event emission
supabase.channel('jobs').send({
  event: 'job.updated',
  data: job,
  tenant_id: tenantId,
  timestamp: new Date().toISOString()
});
```

**Anti-Patterns:**
```typescript
// ❌ Mixing naming conventions
interface BadJob {
  id: string;
  tenant_id: string; // Should be tenantId in TypeScript
  createdAt: string; // Should be created_at in DB
}

// ❌ Missing tenant_id in multi-tenant query
const jobs = await db.query('SELECT * FROM jobs');

// ❌ Inconsistent event naming
supabase.channel('jobs').send({
  event: 'JobStatusUpdated', // Should be snake_case
  data: job
});
```

## Status: Architecture Document Complete - Ready for Implementation

Your Service Manager platform now has a complete architectural foundation with:
- Clear technology stack decisions
- Consistent implementation patterns
- Multi-tenant architecture strategy
- Real-time coordination approach
- API and state management patterns

The architecture supports your vision of a decentralized Service Mesh platform that connects independent service businesses while maintaining complete data isolation and enabling network effects.
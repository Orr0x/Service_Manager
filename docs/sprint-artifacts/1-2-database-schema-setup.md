# Story 1.2: Database Schema Setup

**Status:** ready-for-dev

## Story

As a system,
we need to create the core database schema with proper multi-tenant isolation,
so that each provider's data is completely secure and separated.

## Acceptance Criteria

1. Given the project is initialized
   When the database schema is created
   Then all tables include `tenant_id` column for multi-tenancy
2. And Row-Level Security (RLS) policies are created for each table
3. And primary keys use UUID strings
4. And audit fields (`created_at`, `updated_at`) are included
5. And foreign key relationships are properly defined

## Tasks / Subtasks

- [ ] Create core tables with tenant isolation (AC: 1, 3, 4)
  - [ ] Create tenants table with UUID primary key
  - [ ] Create users table with tenant_id foreign key
  - [ ] Create provider_profiles table with user relationship
  - [ ] Create services table for service types
  - [ ] Create service_areas table for geographic coverage
- [ ] Implement Row-Level Security (RLS) policies (AC: 2)
  - [ ] Enable RLS on all tables
  - [ ] Create tenant isolation policies for each table
  - [ ] Create user access policies with proper roles
- [ ] Set up foreign key relationships (AC: 5)
  - [ ] Define relationships between tenants and users
  - [ ] Define relationships between users and provider_profiles
  - [ ] Define relationships for services and service_areas
- [ ] Create database migration files
  - [ ] Set up Supabase CLI configuration
  - [ ] Create initial migration file
  - [ ] Test migration locally

## Dev Notes

### Critical Multi-Tenancy Requirements
- **EVERY table MUST have tenant_id column** (except tenants table itself)
- All queries MUST filter by tenant_id
- RLS policies must enforce tenant isolation at database level
- Never expose data from other tenants

### Core Table Schemas

```sql
-- Tenants table (root of multi-tenancy)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table with tenant isolation
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'provider' CHECK (role IN ('provider', 'admin', 'staff')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- Provider profiles table
CREATE TABLE provider_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_phone TEXT,
  business_address JSONB,
  description TEXT,
  logo_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2),
  duration_minutes INTEGER,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service areas table
CREATE TABLE service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  postal_codes TEXT[], -- Array of postal codes
  cities TEXT[],
  states TEXT[],
  country TEXT NOT NULL DEFAULT 'US',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row-Level Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY "Tenants can view own tenant" ON tenants
  FOR USING (id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can view users from same tenant" ON users
  FOR USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Provider profiles visible within tenant" ON provider_profiles
  FOR USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Services visible within tenant" ON services
  FOR USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Service areas visible within tenant" ON service_areas
  FOR USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- User-specific policies
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Providers can update own profile" ON provider_profiles
  FOR UPDATE USING (user_id = auth.uid());
```

### Database Naming Conventions
- **Tables**: snake_case (e.g., `provider_profiles`)
- **Columns**: snake_case (e.g., `tenant_id`, `created_at`)
- **Indexes**: `idx_table_name_column_name`
- **Constraints**: `fk_table_name_column_name`, `chk_table_name_condition`

### Audit Fields Requirement
All tables must include:
- `created_at TIMESTAMPTZ DEFAULT NOW()` (immutable)
- `updated_at TIMESTAMPTZ DEFAULT NOW()` (with trigger)

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for each table
CREATE TRIGGER handle_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

### Supabase CLI Setup
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize project
supabase init

# Link to project (use project ID from Supabase dashboard)
supabase link --project-ref ktxnjsqgghjofwyludzm

# Start local development
supabase start
```

### Migration Structure
```
supabase/
├── migrations/
│   ├── 20240104_001_initial_schema.sql
│   └── 20240104_002_rls_policies.sql
└── seed.sql
```

### Database Connections
Use the auth helpers pattern established in Story 1.1:
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
```

### Critical Security Rules
1. NEVER bypass tenant_id filtering
2. ALWAYS use RLS policies for data access
3. Use UUIDs for all primary keys
4. Implement proper foreign key constraints
5. Add appropriate indexes for tenant_id columns

### Testing Strategy
- Test RLS policies with different user roles
- Verify tenant isolation works correctly
- Test foreign key constraints
- Validate migration rollback procedures

## Dev Agent Record

### Context Reference
- [DEV_HANDOVER.md](/docs/DEV_HANDOVER.md#Multi-Tenancy Strategy)
- [Architecture.md](/docs/architecture.md)
- [Story 1.1](/docs/sprint-artifacts/1-1-project-initialization.md) - Prerequisites

### Agent Model Used
Claude Opus 4.5 (2025-11-01)

### Debug Log References

### Completion Notes List

### File List

## Change Log

### References
- [Source: /docs/DEV_HANDOVER.md#Multi-Tenancy Strategy]
- [Source: /docs/epics.md#Story 1.2]
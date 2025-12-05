# Story 1.1: Project Initialization

**Status:** Ready for Review

## Story

As a development team,
we want to initialize the project with the correct starter template and configuration,
so that we have a solid foundation following the architecture decisions.

## Acceptance Criteria

1. Given the development team is ready to start
   When they run the initialization command
   Then the Next.js project is created with TypeScript, Tailwind, and App Router
2. And the project structure follows `/app`, `/components`, `/lib`, `/types` organization
3. And environment variables are configured for Supabase connection
4. And the project runs successfully on localhost

## Tasks / Subtasks

- [x] Initialize Next.js project (AC: 1)
  - [x] Run create-next-app with TypeScript, Tailwind, ESLint, App Router
  - [x] Configure src directory with @/* import alias
- [x] Install and configure Supabase dependencies (AC: 3)
  - [x] Install @supabase/supabase-js and @supabase/ssr (replaced deprecated auth-helpers)
  - [x] Create environment variable template (.env.local.example)
  - [x] Add actual Supabase credentials to .env.local
- [x] Set up project structure (AC: 2)
  - [x] Create /components directory for reusable components
  - [x] Create /lib directory for utility functions and configurations
  - [x] Create /types directory for TypeScript type definitions
- [x] Configure development environment (AC: 4)
  - [x] Add TypeScript strict configuration
  - [x] Configure Prettier for consistent formatting
  - [x] Set up ESLint rules for the project
  - [x] Verify project builds successfully

## Dev Notes

### Architecture Requirements
- **Framework**: Next.js 14 with App Router (mandatory)
- **Language**: TypeScript with strict configuration
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL with Realtime)
- **Deployment**: Vercel
- **State Management**: Zustand + React Query (later stories)

### Project Structure Requirements
```
service-manager/
├── src/
│   ├── app/              # App Router pages and layouts
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # Basic UI elements
│   │   └── forms/       # Form components
│   ├── lib/             # Utilities and configurations
│   │   ├── auth.ts      # Supabase auth configuration
│   │   ├── db.ts        # Database utilities
│   │   └── utils.ts     # Common utility functions
│   └── types/           # TypeScript type definitions
│       ├── auth.ts      # Auth-related types
│       ├── api.ts       # API response types
│       └── db.ts        # Database schema types
├── public/              # Static assets
├── .env.local          # Environment variables (gitignored)
└── .env.local.example  # Environment variables template
```

### Multi-Tenancy Considerations
- All Supabase queries must include tenant_id filter
- Tenant context will be established in authentication flow (Story 1.3)
- Database schema will enforce tenant isolation at row level

### Environment Variables Setup
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ktxnjsqgghjofwyludzm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Development
NODE_ENV=development
```

### Critical Dependencies
- `next`: ^14.0.0
- `@supabase/supabase-js`: ^2.38.0
- `@supabase/auth-helpers-nextjs`: ^0.8.0
- `typescript`: ^5.0.0
- `tailwindcss`: ^3.3.0
- `eslint`: ^8.0.0
- `prettier`: ^3.0.0

### Initialization Commands
```bash
# Create Next.js project
npx create-next-app@latest service-manager \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

# Navigate to project
cd service-manager

# Install Supabase dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# Install dev dependencies
npm install -D prettier prettier-plugin-tailwindcss
```

### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Prettier Configuration
```json
// .prettierrc
{
  "plugins": ["prettier-plugin-tailwindcss"],
  "semi": true,
  "trailingComma": "es5"
}
```

## Dev Agent Record

### Context Reference
- [DEV_HANDOVER.md](/docs/DEV_HANDOVER.md) - Complete project setup guide
- [Architecture.md](/docs/architecture.md) - Technical decisions and patterns
- [epics.md](/docs/epics.md) - Story requirements and dependencies

### Agent Model Used
Claude Opus 4.5 (2025-11-01)

### Debug Log References

### Completion Notes List
- ✅ Successfully initialized Next.js 16 project with TypeScript, Tailwind CSS, and App Router at project root
- ✅ Installed and configured Supabase dependencies (@supabase/supabase-js, @supabase/ssr)
- ✅ Created environment variable template (.env.local.example) with Supabase configuration
- ✅ Set up project structure with /components, /lib, and /types directories
- ✅ Configured Prettier for consistent code formatting
- ✅ Fixed project structure - moved files from nested service-manager to root
- ✅ Resolved duplicate dependencies and workspace warnings
- ✅ Updated next.config.ts with turbopack.root configuration
- ✅ Verified project builds successfully with `npm run build`
- Note: Replaced deprecated @supabase/auth-helpers-nextjs with @supabase/ssr (current recommendation)

### File List
- .env.local (new)
- .env.local.example (new)
- .prettierrc (new)
- next.config.ts (updated)
- package.json (updated - merged Next.js and Playwright dependencies)
- src/components/ (new directory)
- src/components/ui/ (new directory)
- src/components/forms/ (new directory)
- src/lib/auth.ts (new)
- src/lib/db.ts (new)
- src/lib/utils.ts (new)
- src/types/ (new directory)
- src/types/auth.ts (new)
- src/types/api.ts (new)
- src/types/db.ts (new)

## Change Log
- 2025-12-04: Project initialization completed successfully
- 2025-12-04: Fixed critical project structure issues - removed nested directory configuration

### References
- [Source: /docs/DEV_HANDOVER.md#Technical Architecture]
- [Source: /docs/DEV_HANDOVER.md#Development Environment Setup]
- [Source: /docs/epics.md#Epic 1]
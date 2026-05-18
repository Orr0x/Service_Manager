# Admin Mobile Usability Handover

**Date:** 2026-05-17
**Branch:** `admin-mobile-usability`
**Status:** Part complete
**Repo path:** `/home/orrox/projects/Service_Manager`

## Summary

The admin app was originally desktop-first. This branch contains the first mobile
usability pass so the admin area can be navigated and scanned on phone-width screens.

The work is intentionally broad but shallow: shared layout, index pages, repeated
entity lists, and basic form spacing have been improved first because those patterns
affect most admin workflows. The next agent should continue with QA and targeted
fixes on the screens that are still dense or module-specific.

## Important Context

- The user recently fixed the deployed Mapbox token by changing Vercel to use a
  public `pk.*` token.
- This branch also includes a local Mapbox safety guard so secret `sk.*` tokens are
  not passed into Mapbox GL client components.
- The current working tree is intentionally uncommitted.
- There was already a Next dev server for this repo running from an older session.
  A new server start failed because `.next/dev/lock` was already held. The active
  repo dev process was listening on port `3001` when last checked.
- The repo has pre-existing lint debt in several admin create/edit pages. Do not
  treat those as introduced by this mobile pass unless the diff shows otherwise.

## What Has Been Implemented

### Mobile shell

File:

- `src/components/dashboard/dashboard-layout-client.tsx`

Changes:

- Desktop sidebar is hidden below `md`.
- Mobile header now has a menu button.
- Mobile navigation opens in a full-height slide-over drawer.
- Mobile bottom nav exposes the high-frequency areas:
  - Dashboard
  - Jobs
  - Schedule
  - Job Sites
  - Workers
- Header height and company name behavior were tightened for small screens.
- Main content gets bottom padding so bottom navigation does not cover content.
- Desktop collapsible sidebar behavior is preserved at `md` and wider widths.

### Shared mobile list behavior

File:

- `src/hooks/use-mobile-default-view.ts`

Changes:

- New hook uses `useSyncExternalStore` with a mobile media query.
- Entity list pages default to grid/card view under `640px`.
- Manual list/grid toggle still works.
- Desktop default remains list view.

### Shared controls

Files:

- `src/components/common/search-input.tsx`
- `src/components/common/view-toggle.tsx`

Changes:

- Search input padding was adjusted so text does not collide with the clear/search
  affordance on narrow widths.
- View toggle buttons got larger touch-friendly padding.

### Admin dashboard and index pages

Representative files:

- `src/app/(admin)/dashboard/page.tsx`
- `src/app/(admin)/dashboard/customers/page.tsx`
- `src/app/(admin)/dashboard/job-sites/page.tsx`
- `src/app/(admin)/dashboard/jobs/page.tsx`
- `src/app/(admin)/dashboard/invoices/page.tsx`
- `src/app/(admin)/dashboard/quotes/page.tsx`
- `src/app/(admin)/dashboard/contracts/page.tsx`
- `src/app/(admin)/dashboard/checklists/page.tsx`
- `src/app/(admin)/dashboard/workers/page.tsx`
- `src/app/(admin)/dashboard/contractors/page.tsx`
- `src/app/(admin)/dashboard/services/page.tsx`

Changes:

- Page header layouts stack on mobile and return to horizontal layout on larger screens.
- Primary add/create actions are full-width on mobile.
- Stats cards use two columns on mobile instead of one long column.
- Mobile section spacing is tighter.
- Dashboard date range tabs scroll horizontally and keep labels from clipping.

### Repeated entity lists

Representative files:

- `src/app/(admin)/dashboard/customers/customer-list.tsx`
- `src/app/(admin)/dashboard/job-sites/job-site-list.tsx`
- `src/app/(admin)/dashboard/jobs/job-list.tsx`
- `src/app/(admin)/dashboard/invoices/invoice-list.tsx`
- `src/app/(admin)/dashboard/quotes/quote-list.tsx`
- `src/app/(admin)/dashboard/contracts/contract-list.tsx`
- `src/app/(admin)/dashboard/checklists/checklist-list.tsx`
- `src/app/(admin)/dashboard/workers/worker-list.tsx`
- `src/app/(admin)/dashboard/contractors/contractor-list.tsx`
- `src/app/(admin)/dashboard/services/services-list.tsx`

Changes:

- Lists now use `useMobileDefaultView`.
- Toolbars wrap instead of forcing horizontal overflow.
- Unused imports introduced by the switch from local `useState` were cleaned up.

### Forms and dense shells

Representative files:

- `src/app/(admin)/dashboard/*/new/page.tsx`
- `src/app/(admin)/dashboard/*/[id]/edit/page.tsx`
- `src/app/(admin)/dashboard/invoices/[id]/edit/edit-invoice-form.tsx`

Changes:

- Form spacing was reduced on mobile while retaining larger desktop spacing.
- Some broad shells use smaller mobile padding with `sm:` breakpoints for desktop.

### Mapbox token safety

Files:

- `src/lib/mapbox-token.ts`
- `src/components/job-site-location-picker.tsx`
- `src/components/job-site-location-summary.tsx`

Changes:

- Client Mapbox components now only receive public `pk.*` tokens.
- Missing or invalid tokens fall back instead of passing `sk.*` tokens to Mapbox GL.

## Verification Already Run

Commands that passed:

```bash
npm run type-check
```

```bash
npx eslint src/components/dashboard/dashboard-layout-client.tsx src/components/common/search-input.tsx src/components/common/view-toggle.tsx src/hooks/use-mobile-default-view.ts src/components/job-site-location-picker.tsx src/components/job-site-location-summary.tsx 'src/app/(admin)/dashboard/page.tsx' 'src/app/(admin)/dashboard/customers/page.tsx' 'src/app/(admin)/dashboard/customers/customer-list.tsx' 'src/app/(admin)/dashboard/job-sites/page.tsx' 'src/app/(admin)/dashboard/job-sites/job-site-list.tsx' 'src/app/(admin)/dashboard/jobs/page.tsx' 'src/app/(admin)/dashboard/jobs/job-list.tsx' 'src/app/(admin)/dashboard/invoices/page.tsx' 'src/app/(admin)/dashboard/invoices/invoice-list.tsx' 'src/app/(admin)/dashboard/quotes/page.tsx' 'src/app/(admin)/dashboard/quotes/quote-list.tsx' 'src/app/(admin)/dashboard/contracts/page.tsx' 'src/app/(admin)/dashboard/contracts/contract-list.tsx' 'src/app/(admin)/dashboard/checklists/page.tsx' 'src/app/(admin)/dashboard/checklists/checklist-list.tsx' 'src/app/(admin)/dashboard/workers/page.tsx' 'src/app/(admin)/dashboard/workers/worker-list.tsx' 'src/app/(admin)/dashboard/contractors/page.tsx' 'src/app/(admin)/dashboard/contractors/contractor-list.tsx' 'src/app/(admin)/dashboard/services/page.tsx' 'src/app/(admin)/dashboard/services/services-list.tsx'
```

Focused lint result:

- 0 errors
- 4 warnings for existing `<img>` usage in:
  - `src/components/dashboard/dashboard-layout-client.tsx`
  - `src/app/(admin)/dashboard/services/services-list.tsx`

```bash
npm run build
```

Build passed. It printed the existing `baseline-browser-mapping` age warning.

## Known Gaps

- No authenticated browser/mobile screenshot pass has been completed yet.
- Detail pages still need a systematic mobile pass, especially tab rows, action bars,
  related records, maps, attachments, scheduling, and activity sections.
- Settings, scheduling, payroll, and certification pages were not deeply reviewed.
- Tables and dense record sections should be checked for horizontal overflow.
- Existing create/edit pages contain lint debt such as `setState` in effects and
  loose `any` types. Those were not part of this mobile pass.
- `next/image` conversion was not done. Existing `<img>` warnings remain in the
  mobile shell and services list.

## Recommended Next Plan

1. Review the diff on branch `admin-mobile-usability` before editing.
2. Start or reuse the local dev server. If `.next/dev/lock` is held, identify the
   running Next process before starting another one.
3. Log in as an admin and test at these viewport widths:
   - 375 x 667
   - 390 x 844
   - 430 x 932
   - 768 x 1024
   - desktop width
4. Check these core admin paths first:
   - `/dashboard`
   - `/dashboard/job-sites`
   - `/dashboard/job-sites/[id]`
   - `/dashboard/jobs`
   - `/dashboard/jobs/[id]`
   - `/dashboard/schedule`
   - `/dashboard/workers`
   - `/dashboard/customers`
5. For every tested page, check:
   - no desktop sidebar overlap on mobile
   - no unexpected horizontal page scroll
   - nav drawer opens/closes and all links are reachable
   - bottom nav does not cover important controls
   - primary actions are tappable
   - list/grid toggles still work
   - cards and stats do not clip labels or numbers
6. Fix issues in shared components first, then page-specific CSS.
7. Run:
   - `npm run type-check`
   - focused lint for files touched in the second pass
   - `npm run build`
8. Update this handover or the plan doc with final QA results before merge.

## Files Most Likely Needed Next

- Plan: `docs/admin-mobile-usability-plan.md`
- Layout: `src/components/dashboard/dashboard-layout-client.tsx`
- Mobile view hook: `src/hooks/use-mobile-default-view.ts`
- Main dashboard: `src/app/(admin)/dashboard/page.tsx`
- Job site detail: `src/app/(admin)/dashboard/job-sites/[id]/page.tsx`
- Job detail: `src/app/(admin)/dashboard/jobs/[id]/job-detail.tsx`
- Schedule: `src/app/(admin)/dashboard/schedule/page.tsx`
- Mapbox token helper: `src/lib/mapbox-token.ts`

## Suggested Definition Of Done

- Mobile QA completed on core admin paths.
- Detail pages and dense module pages have no major horizontal overflow.
- Mobile drawer and bottom nav work on every admin page.
- Desktop layout remains unchanged at `md` and above.
- `npm run type-check` passes.
- Focused lint for changed files has no errors.
- `npm run build` passes.
- Documentation is updated from "part complete" to "complete" or clearly lists
  remaining follow-up tickets.

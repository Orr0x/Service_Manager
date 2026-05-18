# Admin Mobile Usability Plan

## Current Status

**Status:** Part complete as of 2026-05-17.

The first mobile usability pass has been implemented on branch `admin-mobile-usability`.
It covers the shared admin shell, the main dashboard, core admin index pages, repeated
entity lists, and a light spacing pass on create/edit form shells. The work has passed
type-check, a focused lint pass for the mobile work surfaces, and a production build.

This is not yet complete because it still needs a real device/browser QA pass and a
second pass on detail pages, complex forms, tables, and dense module-specific screens.

## Goals

- Make the admin app usable on phone-width screens without taking away the desktop workflow.
- Keep the admin experience work-focused: dense enough for operations, but with touch-friendly navigation and actions.
- Improve the shared layout and repeated list patterns first, because those affect most admin screens.

## Layout Design

### Mobile Shell

- Replace the always-visible desktop sidebar with a mobile header menu button.
- Open navigation in a full-height slide-over drawer with the same branding and navigation items.
- Keep the current collapsible sidebar for desktop and tablet landscape widths.
- Add a compact bottom navigation bar on mobile for the highest-frequency admin areas:
  - Dashboard
  - Jobs
  - Schedule
  - Job Sites
  - Workers
- Reduce mobile header height and keep the company name truncated so it cannot force horizontal scrolling.
- Add bottom padding to the mobile main area so the bottom navigation does not cover content.

### Page Structure

- Stack page titles, supporting copy, and primary actions on narrow screens.
- Make primary actions full-width on mobile, with icon and label kept together.
- Use tighter mobile spacing between dashboard sections.
- Keep card radius at 8px or less for operational UI surfaces.

### Lists And Index Pages

- Prefer card/grid view on mobile for entity lists; keep list view available via the existing toggle.
- Keep desktop list view as the default on larger screens.
- Make list toolbars wrap cleanly when titles, toggles, and filters compete for width.
- Preserve full-row tap targets on mobile.

### Forms And Details

- Reduce fixed large padding in form shells on mobile.
- Let tab rows and wide related-record sections scroll horizontally where dense data is unavoidable.
- Keep any table views inside horizontal overflow containers.

## Implementation Order

1. Done: Build the mobile shell in `DashboardLayoutClient`.
2. Done: Add shared hooks/components for mobile-friendly repeated patterns.
3. Done: Apply responsive header and stat-grid classes to the main admin index pages.
4. Done: Switch repeated entity lists to mobile card defaults.
5. Done: Run type-check, focused lint, and production build.
6. Next: QA on real mobile widths and authenticated admin flows.
7. Next: Fix remaining mobile usability issues on detail pages, dense forms, settings, scheduling, payroll, and certification.
8. Next: Decide whether to convert existing `<img>` usage in the touched mobile surfaces to `next/image`.

## Acceptance Checks

- Part complete: At 375px width, the admin content should start at the left edge and not be hidden behind the desktop sidebar.
- Part complete: Navigation is reachable through a mobile drawer and a compact bottom nav.
- Part complete: Primary actions on core index pages are full-width on mobile.
- Part complete: Entity list pages show cards by default on mobile.
- Part complete: Existing desktop sidebar behavior is preserved at `md` and wider viewports.
- Pending QA: Confirm the above on an authenticated admin session in Chromium mobile emulation and on a real phone if possible.
- Pending QA: Confirm no mobile horizontal overflow on dashboard, entity list pages, create/edit pages, and detail tabs.
- Pending QA: Confirm Mapbox/geolocation cards still render correctly after the public-token fix.

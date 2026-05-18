# Data Table Search, Sort, Filter, and Grouping Plan

Date: 2026-05-18

## Goal

Every table-like data surface should have a consistent way to search, sort, filter, and group records. Desktop can use dense tables/lists, while mobile should prefer cards grouped into readable sections.

## Inventory

Priority admin data views:
- Jobs: `src/app/(admin)/dashboard/jobs/job-list.tsx`
- Scheduling list: `src/app/(admin)/dashboard/schedule/list-view.tsx`
- Payroll: `src/app/(admin)/dashboard/payroll/page.tsx`
- Job Sites: `src/app/(admin)/dashboard/job-sites/job-site-list.tsx`
- Customers: `src/app/(admin)/dashboard/customers/customer-list.tsx`
- Workers: `src/app/(admin)/dashboard/workers/worker-list.tsx`
- Contractors: `src/app/(admin)/dashboard/contractors/contractor-list.tsx`
- Invoices: `src/app/(admin)/dashboard/invoices/invoice-list.tsx`
- Quotes: `src/app/(admin)/dashboard/quotes/quote-list.tsx`
- Contracts: `src/app/(admin)/dashboard/contracts/contract-list.tsx`
- Checklists: `src/app/(admin)/dashboard/checklists/checklist-list.tsx`
- Services: `src/app/(admin)/dashboard/services/services-list.tsx`
- Settings Users: `src/app/(admin)/dashboard/settings/users/page.tsx`
- Settings Modules: `src/app/(admin)/dashboard/settings/modules/page.tsx`
- Settings Forms: `src/app/(admin)/dashboard/settings/forms/page.tsx`

Embedded line-item tables:
- Quote detail/new/edit item tables
- Invoice detail/new/edit item tables

Worker/customer portal list-like views:
- Worker jobs, schedule, reports, locations, checklists
- Customer jobs

## Standard Contract

Each operational data view should support:
- Search across obvious identifying fields.
- Sort by the primary visible columns.
- Filter by entity-specific status/date/type/owner fields.
- Group by useful operational dimensions.
- Clear empty/loading states.
- Desktop table or list plus mobile card layout.
- State that can move to URL params over time.

Recommended state shape:

```ts
{
  search?: string
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  filters?: Record<string, string>
  groupBy?: string
  page?: number
  pageSize?: number
}
```

## Grouping Candidates

Jobs:
- Status
- Date
- Customer
- Job site
- Assigned worker

Scheduling:
- Date
- Worker
- Job site
- Status

Payroll:
- Worker
- Job
- Date
- Customer
- Job site

Job Sites:
- Customer
- City
- Active status
- Site type

Customers:
- Type
- Status
- City/area

Workers/Contractors:
- Role/function
- Status
- Skill/specialty

Invoices/Quotes/Contracts:
- Status
- Customer
- Month
- Job site

Checklists:
- Template/category
- Completion status
- Job site
- Customer

## Implementation Order

1. Add shared client-side data-view helpers and controls. **Done.**
2. Migrate Jobs, Payroll, and Job Sites first. **Done.**
3. Migrate Scheduling list. **Done.**
4. Migrate Customers, Workers, Contractors.
5. Migrate Invoices, Quotes, Contracts, Checklists, Services.
6. Review settings and embedded line-item tables.
7. Move large-data sort/filter/group operations server-side where needed.

## First-Pass Implementation Notes

The first pass can be client-side because existing pages already load their visible result sets. Server-side sorting/filtering should follow for high-growth tables such as jobs, payroll, invoices, quotes, and scheduling.

For grouped views:
- Desktop list/table sections use collapsible-looking group headers, counts, and summaries.
- Mobile cards use the same group headers as section dividers.
- Sorting applies within each group.
- Export should use the currently filtered/sorted rows.

## Completed First Pass

Shared pieces:
- `src/components/common/data-view-controls.tsx`
- `src/lib/data-view.ts`

Migrated views:
- Jobs: refine search, status filter, sort, direction, and grouping by status/date/customer/job site.
- Payroll: refine search, existing range/worker filters, sort, direction, grouping by worker/job/date/customer/job site, and grouped totals for rows/hours/pay.
- Job Sites: refine search, sort, direction, and grouping by customer/city/status.
- Scheduling list: refine search, status filter, sort, direction, and grouping by date/status/worker/job site.

Remaining next pass:
- Customers, Workers, Contractors.
- Invoices, Quotes, Contracts.
- Checklists and Services.
- Settings tables and embedded invoice/quote line-item tables.

-- Worker Unavailability Table
drop table if exists public.worker_unavailability;

create table public.worker_unavailability (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) not null,
  worker_id uuid references public.workers(id) on delete cascade not null,
  unavailable_date date not null,
  reason text not null check (reason in ('non_working', 'holiday', 'sickness', 'transport', 'other')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for efficient lookup and uniqueness per day
create unique index idx_worker_unavailability_day 
  on public.worker_unavailability (worker_id, unavailable_date);

-- Enable RLS
alter table public.worker_unavailability enable row level security;

-- Policies
create policy "Workers can view own unavailability"
  on public.worker_unavailability for select
  using (
    exists (
      select 1 from public.workers w
      where w.id = worker_unavailability.worker_id
      and w.user_id = auth.uid()
    )
    or
    exists (
        select 1 from public.users
        where users.id = auth.uid()
        and users.role = 'admin'
    )
  );

create policy "Workers can insert own unavailability"
  on public.worker_unavailability for insert
  with check (
    exists (
      select 1 from public.workers w
      where w.id = worker_unavailability.worker_id
      and w.user_id = auth.uid()
    )
    or
    exists (
        select 1 from public.users
        where users.id = auth.uid()
        and users.role = 'admin'
    )
  );

create policy "Workers can update own unavailability"
  on public.worker_unavailability for update
  using (
    exists (
        select 1 from public.workers w
        where w.id = worker_unavailability.worker_id
        and w.user_id = auth.uid()
    )
    or
    exists (
        select 1 from public.users
        where users.id = auth.uid()
        and users.role = 'admin'
    )
  );

create policy "Workers can delete own unavailability"
  on public.worker_unavailability for delete
  using (
    exists (
        select 1 from public.workers w
        where w.id = worker_unavailability.worker_id
        and w.user_id = auth.uid()
    )
    or
    exists (
        select 1 from public.users
        where users.id = auth.uid()
        and users.role = 'admin'
    )
  );

-- Re-enable RLS
alter table public.worker_unavailability enable row level security;

-- Drop existing policies to be safe
drop policy if exists "Workers can view own unavailability" on public.worker_unavailability;
drop policy if exists "Workers can insert own unavailability" on public.worker_unavailability;
drop policy if exists "Workers can update own unavailability" on public.worker_unavailability;
drop policy if exists "Workers can delete own unavailability" on public.worker_unavailability;

-- Create robust policies using JWT claims for Admin check to avoid table RLS recursion
-- Admin Check: (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'

create policy "Workers and Admins can view unavailability"
  on public.worker_unavailability for select
  using (
    -- Worker check: Link via workers table
    exists (
      select 1 from public.workers w
      where w.id = worker_unavailability.worker_id
      and w.user_id = auth.uid()
    )
    or
    -- Admin check: via JWT
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "Workers and Admins can insert unavailability"
  on public.worker_unavailability for insert
  with check (
    exists (
      select 1 from public.workers w
      where w.id = worker_unavailability.worker_id
      and w.user_id = auth.uid()
    )
    or
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "Workers and Admins can update unavailability"
  on public.worker_unavailability for update
  using (
    exists (
      select 1 from public.workers w
      where w.id = worker_unavailability.worker_id
      and w.user_id = auth.uid()
    )
    or
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "Workers and Admins can delete unavailability"
  on public.worker_unavailability for delete
  using (
    exists (
      select 1 from public.workers w
      where w.id = worker_unavailability.worker_id
      and w.user_id = auth.uid()
    )
    or
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

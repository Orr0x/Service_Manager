create table if not exists public.app_configurations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) not null,
  entity_type text not null check (entity_type in ('worker', 'contractor', 'customer', 'global')),
  entity_id uuid, -- Nullable. If null, this is the default config for the entity_type.
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure unique defaults per type (where entity_id is null)
create unique index if not exists idx_app_configs_defaults 
  on public.app_configurations (tenant_id, entity_type) 
  where entity_id is null;

-- Ensure unique specific configs
create unique index if not exists idx_app_configs_specific 
  on public.app_configurations (tenant_id, entity_type, entity_id) 
  where entity_id is not null;

-- Enable RLS
alter table public.app_configurations enable row level security;

-- Policies
create policy "Admins full access to app_configurations"
  on public.app_configurations for all
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );

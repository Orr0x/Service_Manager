-- Job Sites table
CREATE TABLE job_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Main Office", "Warehouse B"
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER handle_job_sites_updated_at BEFORE UPDATE ON job_sites FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE job_sites ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Robust, using public.users)
CREATE POLICY "Job sites visible within tenant" ON job_sites
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can create job sites" ON job_sites
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update job sites" ON job_sites
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete job sites" ON job_sites
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

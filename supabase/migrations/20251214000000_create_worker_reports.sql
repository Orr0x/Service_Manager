-- Create worker_reports table
CREATE TABLE worker_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL, -- Optional link to a job
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('maintenance', 'damage', 'incident', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_worker_reports_worker ON worker_reports(worker_id);
CREATE INDEX idx_worker_reports_job ON worker_reports(job_id);
CREATE INDEX idx_worker_reports_tenant ON worker_reports(tenant_id);

-- Enable RLS
ALTER TABLE worker_reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Worker reports visible to own tenant admins" ON worker_reports
  FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Workers can view own reports" ON worker_reports
  FOR SELECT USING (
    worker_id IN (
        SELECT id FROM public.workers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workers can create reports" ON worker_reports
  FOR INSERT WITH CHECK (
    worker_id IN (
        SELECT id FROM public.workers WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER handle_worker_reports_updated_at BEFORE UPDATE ON worker_reports FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

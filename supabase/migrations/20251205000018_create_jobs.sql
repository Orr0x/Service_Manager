-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  job_site_id UUID REFERENCES job_sites(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, in_progress, completed, cancelled
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER handle_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can select jobs" ON jobs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert jobs" ON jobs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update jobs" ON jobs
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete jobs" ON jobs
  FOR DELETE USING (auth.role() = 'authenticated');


-- Job Assignments table
CREATE TABLE job_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Internal Worker
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE, -- External Contractor
  status TEXT NOT NULL DEFAULT 'assigned', -- assigned, accepted, declined
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT job_assignments_assignee_check CHECK (
    (user_id IS NOT NULL AND contractor_id IS NULL) OR
    (user_id IS NULL AND contractor_id IS NOT NULL)
  )
);

-- Trigger for updated_at
CREATE TRIGGER handle_job_assignments_updated_at BEFORE UPDATE ON job_assignments FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE job_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can select job_assignments" ON job_assignments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert job_assignments" ON job_assignments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update job_assignments" ON job_assignments
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete job_assignments" ON job_assignments
  FOR DELETE USING (auth.role() = 'authenticated');


-- Job Checklists table
CREATE TABLE job_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  checklist_template_id UUID REFERENCES checklists(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of items with completed status
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER handle_job_checklists_updated_at BEFORE UPDATE ON job_checklists FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE job_checklists ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can select job_checklists" ON job_checklists
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert job_checklists" ON job_checklists
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update job_checklists" ON job_checklists
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete job_checklists" ON job_checklists
  FOR DELETE USING (auth.role() = 'authenticated');

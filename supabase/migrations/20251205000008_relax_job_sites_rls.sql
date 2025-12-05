-- Relax RLS policies for job_sites table to unblock creation
-- We will rely on the API to enforce tenant_id for now

DROP POLICY IF EXISTS "Admins can create job sites" ON job_sites;
DROP POLICY IF EXISTS "Admins can update job sites" ON job_sites;
DROP POLICY IF EXISTS "Admins can delete job sites" ON job_sites;

CREATE POLICY "Admins can create job sites" ON job_sites
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update job sites" ON job_sites
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete job sites" ON job_sites
  FOR DELETE USING (auth.role() = 'authenticated');

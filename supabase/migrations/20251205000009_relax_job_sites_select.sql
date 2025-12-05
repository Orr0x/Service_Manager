-- Relax SELECT policy for job_sites to ensure INSERT RETURNING works
-- This matches the relaxed INSERT policy

DROP POLICY IF EXISTS "Job sites visible within tenant" ON job_sites;

CREATE POLICY "Job sites visible within tenant" ON job_sites
  FOR SELECT USING (auth.role() = 'authenticated');

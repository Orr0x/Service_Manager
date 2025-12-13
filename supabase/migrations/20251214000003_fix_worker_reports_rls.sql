-- Fix RLS policies for worker_reports to allow Admins to insert/manage

-- Drop existing restrictive INSERT policy
DROP POLICY IF EXISTS "Workers can create reports" ON worker_reports;

-- Create comprehensive INSERT policy
CREATE POLICY "Workers and Admins can create reports" ON worker_reports
  FOR INSERT WITH CHECK (
    -- Allow matching worker
    (worker_id IN (
        SELECT id FROM public.workers WHERE user_id = auth.uid()
    ))
    OR
    -- Allow Admins (e.g. for impersonation or admin actions)
    (EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    ))
  );

-- Also fix Update/Delete policies just in case
DROP POLICY IF EXISTS "Workers can view own reports" ON worker_reports;

CREATE POLICY "Workers and Admins can select reports" ON worker_reports
  FOR SELECT USING (
    (worker_id IN (
        SELECT id FROM public.workers WHERE user_id = auth.uid()
    ))
    OR
    (EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    ))
  );

-- Ensure Admins can update/delete
CREATE POLICY "Admins can update delete reports" ON worker_reports
  FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    )
  );

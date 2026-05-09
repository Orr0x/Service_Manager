-- Add attendance, location gate, and payroll review support for jobs.

ALTER TABLE tenant_settings
  ADD COLUMN IF NOT EXISTS attendance_settings JSONB DEFAULT '{
    "start_distance_meters": 250,
    "start_window_before_minutes": 0,
    "start_window_after_minutes": 30,
    "require_location_to_start": true,
    "require_location_to_complete": false,
    "max_location_accuracy_meters": 100,
    "allow_admin_location_override": true
  }'::jsonb;

UPDATE tenant_settings
SET attendance_settings = COALESCE(attendance_settings, '{}'::jsonb) || '{
  "start_distance_meters": 250,
  "start_window_before_minutes": 0,
  "start_window_after_minutes": 30,
  "require_location_to_start": true,
  "require_location_to_complete": false,
  "max_location_accuracy_meters": 100,
  "allow_admin_location_override": true
}'::jsonb
WHERE attendance_settings IS NULL
   OR attendance_settings = '{}'::jsonb;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payable_start_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payable_end_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payable_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS start_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS start_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS start_location_accuracy_meters DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS start_distance_meters DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS end_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS end_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS end_location_accuracy_meters DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS end_distance_meters DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS early_start_authorized BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS late_start_authorized BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS late_finish_authorized BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_override_authorized BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payroll_adjustment_notes TEXT,
  ADD COLUMN IF NOT EXISTS payroll_adjusted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payroll_adjusted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_jobs_actual_start_time ON jobs(actual_start_time);
CREATE INDEX IF NOT EXISTS idx_jobs_payable_minutes ON jobs(payable_minutes);

CREATE TABLE IF NOT EXISTS job_payroll_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  adjusted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  previous_values JSONB DEFAULT '{}'::jsonb,
  new_values JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_payroll_adjustments_job_created
  ON job_payroll_adjustments(job_id, created_at DESC);

ALTER TABLE job_payroll_adjustments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'job_payroll_adjustments'
      AND policyname = 'Users can view payroll adjustments in their tenant'
  ) THEN
    CREATE POLICY "Users can view payroll adjustments in their tenant"
      ON job_payroll_adjustments FOR SELECT
      USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'job_payroll_adjustments'
      AND policyname = 'Users can insert payroll adjustments in their tenant'
  ) THEN
    CREATE POLICY "Users can insert payroll adjustments in their tenant"
      ON job_payroll_adjustments FOR INSERT
      WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));
  END IF;
END $$;

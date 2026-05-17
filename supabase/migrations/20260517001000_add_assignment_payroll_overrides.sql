-- Allow each worker assignment on a job to have its own payable payroll window.

ALTER TABLE job_assignments
  ADD COLUMN IF NOT EXISTS payable_start_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payable_end_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payable_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS payable_start_source TEXT NOT NULL DEFAULT 'job'
    CHECK (payable_start_source IN ('job', 'scheduled', 'actual', 'custom')),
  ADD COLUMN IF NOT EXISTS payable_end_source TEXT NOT NULL DEFAULT 'job'
    CHECK (payable_end_source IN ('job', 'scheduled', 'actual', 'custom')),
  ADD COLUMN IF NOT EXISTS payroll_adjustment_notes TEXT,
  ADD COLUMN IF NOT EXISTS payroll_adjusted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payroll_adjusted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_job_assignments_payable_minutes
  ON job_assignments(payable_minutes);

-- Track how an admin chose payable start and end times for payroll review.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS payable_start_source TEXT NOT NULL DEFAULT 'calculated'
    CHECK (payable_start_source IN ('calculated', 'scheduled', 'actual', 'custom')),
  ADD COLUMN IF NOT EXISTS payable_end_source TEXT NOT NULL DEFAULT 'calculated'
    CHECK (payable_end_source IN ('calculated', 'scheduled', 'actual', 'custom'));

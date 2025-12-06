-- Add new columns to workers table
ALTER TABLE workers
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS area_postcode TEXT,
ADD COLUMN IF NOT EXISTS area_radius INTEGER,
ADD COLUMN IF NOT EXISTS has_own_transport BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS licenses TEXT;

-- Create worker_unavailability table for blocked days
CREATE TABLE IF NOT EXISTS worker_unavailability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for worker_unavailability
ALTER TABLE worker_unavailability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select worker_unavailability" ON worker_unavailability
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert worker_unavailability" ON worker_unavailability
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update worker_unavailability" ON worker_unavailability
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete worker_unavailability" ON worker_unavailability
  FOR DELETE USING (auth.role() = 'authenticated');

-- Add new columns to contractors table
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS area_postcode TEXT,
ADD COLUMN IF NOT EXISTS area_radius INTEGER,
ADD COLUMN IF NOT EXISTS has_own_transport BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS licenses TEXT;

-- Create contractor_unavailability table for blocked days
CREATE TABLE IF NOT EXISTS contractor_unavailability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for contractor_unavailability
ALTER TABLE contractor_unavailability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select contractor_unavailability" ON contractor_unavailability
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert contractor_unavailability" ON contractor_unavailability
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update contractor_unavailability" ON contractor_unavailability
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete contractor_unavailability" ON contractor_unavailability
  FOR DELETE USING (auth.role() = 'authenticated');

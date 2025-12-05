-- Contractors table (External)
CREATE TABLE contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  specialties JSONB DEFAULT '[]'::jsonb, -- Array of strings e.g. ["HVAC", "Roofing"]
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'blacklisted'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER handle_contractors_updated_at BEFORE UPDATE ON contractors FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Relaxed for authenticated users)
CREATE POLICY "Authenticated users can select contractors" ON contractors
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert contractors" ON contractors
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update contractors" ON contractors
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete contractors" ON contractors
  FOR DELETE USING (auth.role() = 'authenticated');

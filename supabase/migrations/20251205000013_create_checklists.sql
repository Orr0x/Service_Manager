-- Checklists table
CREATE TABLE checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  items JSONB DEFAULT '[]'::jsonb, -- Array of checklist items { text: string, isCompleted: boolean }
  is_template BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER handle_checklists_updated_at BEFORE UPDATE ON checklists FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Relaxed for authenticated users)
CREATE POLICY "Authenticated users can select checklists" ON checklists
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert checklists" ON checklists
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update checklists" ON checklists
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete checklists" ON checklists
  FOR DELETE USING (auth.role() = 'authenticated');

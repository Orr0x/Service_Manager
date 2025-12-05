-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'job', 'customer', etc.
  entity_id UUID NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER handle_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can select notes" ON notes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert notes" ON notes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update notes" ON notes
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete notes" ON notes
  FOR DELETE USING (auth.role() = 'authenticated');


-- Attachments table
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'job', 'customer', etc.
  entity_id UUID NOT NULL,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER handle_attachments_updated_at BEFORE UPDATE ON attachments FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can select attachments" ON attachments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert attachments" ON attachments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update attachments" ON attachments
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete attachments" ON attachments
  FOR DELETE USING (auth.role() = 'authenticated');

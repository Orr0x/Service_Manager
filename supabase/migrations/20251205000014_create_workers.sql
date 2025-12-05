-- Workers table (Internal Staff)
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Optional link to actual user account
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'Technician', -- 'Manager', 'Technician', 'Admin', 'Support'
  skills JSONB DEFAULT '[]'::jsonb, -- Array of strings e.g. ["Plumbing", "Electrical"]
  hourly_rate DECIMAL(10, 2),
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'on_leave'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER handle_workers_updated_at BEFORE UPDATE ON workers FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Relaxed for authenticated users)
CREATE POLICY "Authenticated users can select workers" ON workers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert workers" ON workers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update workers" ON workers
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete workers" ON workers
  FOR DELETE USING (auth.role() = 'authenticated');

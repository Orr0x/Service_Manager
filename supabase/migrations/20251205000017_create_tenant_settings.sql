-- Tenant Settings table
CREATE TABLE tenant_settings (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  branding JSONB DEFAULT '{"primary_color": "#2563eb", "secondary_color": "#1e40af", "company_name": "My Service Business"}'::jsonb,
  terminology JSONB DEFAULT '{}'::jsonb,
  navigation JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER handle_tenant_settings_updated_at BEFORE UPDATE ON tenant_settings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can select tenant_settings" ON tenant_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert tenant_settings" ON tenant_settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tenant_settings" ON tenant_settings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Custom Field Options table
CREATE TABLE custom_field_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity TEXT NOT NULL, -- e.g., 'job', 'customer'
  field TEXT NOT NULL, -- e.g., 'status', 'category'
  options JSONB DEFAULT '[]'::jsonb, -- Array of { label, value, color }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER handle_custom_field_options_updated_at BEFORE UPDATE ON custom_field_options FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE custom_field_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can select custom_field_options" ON custom_field_options
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert custom_field_options" ON custom_field_options
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update custom_field_options" ON custom_field_options
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete custom_field_options" ON custom_field_options
  FOR DELETE USING (auth.role() = 'authenticated');

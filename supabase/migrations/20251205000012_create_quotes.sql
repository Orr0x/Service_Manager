-- Quotes table
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  job_site_id UUID REFERENCES job_sites(id) ON DELETE SET NULL,
  quote_number SERIAL, -- Simple auto-increment for now, scoped to table not tenant (simplification)
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'rejected', 'expired'
  issued_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  total_amount DECIMAL(10, 2) DEFAULT 0.00,
  description TEXT,
  items JSONB DEFAULT '[]'::jsonb, -- Store line items as JSON for flexibility
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER handle_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Relaxed for authenticated users)
CREATE POLICY "Authenticated users can select quotes" ON quotes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert quotes" ON quotes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update quotes" ON quotes
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete quotes" ON quotes
  FOR DELETE USING (auth.role() = 'authenticated');

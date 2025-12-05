-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  business_name TEXT, -- Optional, for business customers
  contact_name TEXT NOT NULL, -- Required for both
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  type TEXT NOT NULL CHECK (type IN ('individual', 'business')),
  payment_terms TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER handle_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Customers visible within tenant" ON customers
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Admins can create customers" ON customers
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    (auth.jwt() ->> 'role')::text = 'admin'
  );

CREATE POLICY "Admins can update customers" ON customers
  FOR UPDATE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    (auth.jwt() ->> 'role')::text = 'admin'
  );

CREATE POLICY "Admins can delete customers" ON customers
  FOR DELETE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    (auth.jwt() ->> 'role')::text = 'admin'
  );

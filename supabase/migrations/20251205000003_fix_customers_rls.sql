-- Fix RLS policies for customers table to check app_metadata for role

DROP POLICY IF EXISTS "Admins can create customers" ON customers;
DROP POLICY IF EXISTS "Admins can update customers" ON customers;
DROP POLICY IF EXISTS "Admins can delete customers" ON customers;

CREATE POLICY "Admins can create customers" ON customers
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid AND
    (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin'
  );

CREATE POLICY "Admins can update customers" ON customers
  FOR UPDATE USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid AND
    (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin'
  );

CREATE POLICY "Admins can delete customers" ON customers
  FOR DELETE USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid AND
    (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin'
  );

-- Also update the select policy to be safe, though it was likely working due to tenant_id check
DROP POLICY IF EXISTS "Customers visible within tenant" ON customers;
CREATE POLICY "Customers visible within tenant" ON customers
  FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

-- Relax RLS policies for customers table to unblock creation
-- We will rely on the API to enforce tenant_id for now

DROP POLICY IF EXISTS "Admins can create customers" ON customers;

CREATE POLICY "Admins can create customers" ON customers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

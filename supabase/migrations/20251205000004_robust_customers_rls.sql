-- Fix RLS policies to check public.users table directly
-- This avoids issues with JWT metadata not being updated immediately or incorrect paths

DROP POLICY IF EXISTS "Admins can create customers" ON customers;
DROP POLICY IF EXISTS "Admins can update customers" ON customers;
DROP POLICY IF EXISTS "Admins can delete customers" ON customers;
DROP POLICY IF EXISTS "Customers visible within tenant" ON customers;

-- Policy for SELECT: Allow any user in the tenant to view customers
CREATE POLICY "Customers visible within tenant" ON customers
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Policy for INSERT: Allow admins in the tenant to create customers
CREATE POLICY "Admins can create customers" ON customers
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy for UPDATE: Allow admins in the tenant to update customers
CREATE POLICY "Admins can update customers" ON customers
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy for DELETE: Allow admins in the tenant to delete customers
CREATE POLICY "Admins can delete customers" ON customers
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

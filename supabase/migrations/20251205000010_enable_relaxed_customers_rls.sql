-- Re-enable RLS on customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Admins can create customers" ON customers;
DROP POLICY IF EXISTS "Admins can update customers" ON customers;
DROP POLICY IF EXISTS "Admins can delete customers" ON customers;
DROP POLICY IF EXISTS "Customers visible within tenant" ON customers;

-- Create relaxed policies (Authenticated users can perform all actions)
-- This matches the working configuration for job_sites

CREATE POLICY "Authenticated users can select customers" ON customers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert customers" ON customers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update customers" ON customers
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete customers" ON customers
  FOR DELETE USING (auth.role() = 'authenticated');

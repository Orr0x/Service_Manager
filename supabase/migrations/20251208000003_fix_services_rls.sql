-- 1. Ensure RLS is enabled
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- 2. CRITICAL: Grant permissions to authenticated users
-- RLS policies only filter rows; they don't grant the fundamental right to Insert/Update.
-- If this was missing, RLS errors would still occur.
GRANT ALL ON TABLE services TO authenticated;
GRANT ALL ON TABLE services TO service_role;

-- 3. Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Users can insert services for their tenant" ON services;
DROP POLICY IF EXISTS "Users can update services for their tenant" ON services;
DROP POLICY IF EXISTS "Users can delete services for their tenant" ON services;
DROP POLICY IF EXISTS "Services visible within tenant" ON services;

-- 4. Create Policies using Table Lookup (Golden Standard)
-- This pattern is used by the working 'customers' table.

-- VIEW
CREATE POLICY "Services visible within tenant" ON services
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

-- INSERT
CREATE POLICY "Users can insert services for their tenant" ON services
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

-- UPDATE
CREATE POLICY "Users can update services for their tenant" ON services
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

-- DELETE
CREATE POLICY "Users can delete services for their tenant" ON services
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Ensure authenticated users can view their own profile regardless of tenant_id
-- This prevents issues where a tenant_id mismatch hides the user row
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

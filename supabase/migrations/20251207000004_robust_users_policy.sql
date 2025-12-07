-- Ensure authenticated users have permission to insert into users table
GRANT INSERT ON TABLE public.users TO authenticated;

-- Drop the policy if it exists to ensure we have a clean slate
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Re-create the policy with explicit role assignment
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Also ensure they can update their own profile (existing, but good to verify)
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

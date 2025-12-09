-- Fix permissions for auth schema to ensure GoTrue can access it
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role, dashboard_user;
-- Note: supabase_auth_admin might not exist in all environments, so we handle it gracefully or skip.
-- Standard Supabase roles usually include: postgres, anon, authenticated, service_role.

-- Grant table access
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, service_role, dashboard_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, service_role, dashboard_user;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO postgres, service_role, dashboard_user;

-- Secure the trigger function with explicit search_path
CREATE OR REPLACE FUNCTION public.handle_user_tenant_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Update auth.users metadata
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{tenant_id}',
    to_jsonb(NEW.tenant_id)
  )
  WHERE id = NEW.id;

  -- Also set the role in app_metadata
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(NEW.role)
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_user_tenant_sync ON public.users;
CREATE TRIGGER on_user_tenant_sync
  AFTER INSERT OR UPDATE OF tenant_id, role ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_tenant_sync();

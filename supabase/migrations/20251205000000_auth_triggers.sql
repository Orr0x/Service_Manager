-- Function to sync tenant_id from public.users to auth.users metadata
-- This ensures that when a user is created/updated in public.users, their auth metadata is updated
-- allowing the tenant_id to be present in the JWT.

CREATE OR REPLACE FUNCTION public.handle_user_tenant_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Trigger on public.users changes
DROP TRIGGER IF EXISTS on_user_tenant_sync ON public.users;
CREATE TRIGGER on_user_tenant_sync
  AFTER INSERT OR UPDATE OF tenant_id, role ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_tenant_sync();

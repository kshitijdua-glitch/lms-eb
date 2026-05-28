
-- Set search_path on remaining functions
ALTER FUNCTION public.touch_updated_at() SET search_path = public;
ALTER FUNCTION public.compute_lead_foir() SET search_path = public;
ALTER FUNCTION public.block_audit_mutation() SET search_path = public;

-- Revoke public execute on SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.can_access_lead(uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.sync_lead_stage_from_slp() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.bump_lead_activity() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.enforce_post_slp_locks() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.write_audit() FROM public, anon;

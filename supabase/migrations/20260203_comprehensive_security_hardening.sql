-- ============================================================
-- COMPREHENSIVE SECURITY HARDENING MIGRATION
-- ============================================================
-- Issues fixed:
-- 1. CRITICAL: get_user_emails leaked emails without auth check
-- 2. CRITICAL: delete_test_user functions callable by anon
-- 3. HIGH: All SECURITY DEFINER functions executable by anon
-- 4. HIGH: anon had write permissions on all tables
-- ============================================================

-- ============================================================
-- PART 1: Revoke ALL permissions from anon role on all tables
-- ============================================================
-- anon should have zero access to user data tables

REVOKE ALL ON public.dismissed_pattern_insights FROM anon;
REVOKE ALL ON public.dismissed_suggestions FROM anon;
REVOKE ALL ON public.household_invitations FROM anon;
REVOKE ALL ON public.household_members FROM anon;
REVOKE ALL ON public.households FROM anon;
REVOKE ALL ON public.notification_logs FROM anon;
REVOKE ALL ON public.plant_journal_entries FROM anon;
REVOKE ALL ON public.plant_seasonal_schedules FROM anon;
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.push_notification_tokens FROM anon;
REVOKE ALL ON public.seasonal_review_notifications FROM anon;
REVOKE ALL ON public.user_plants FROM anon;
REVOKE ALL ON public.user_watering_preferences FROM anon;
REVOKE ALL ON public.watering_records FROM anon;

-- ============================================================
-- PART 2: Restrict SECURITY DEFINER function execution
-- ============================================================

-- get_user_emails: authenticated only (also fixed to verify authorization)
REVOKE EXECUTE ON FUNCTION public.get_user_emails(uuid[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_emails(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_emails(uuid[]) TO authenticated;

-- delete_test_user: service_role only (for E2E tests)
REVOKE EXECUTE ON FUNCTION public.delete_test_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_test_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_test_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.delete_test_user() TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_test_user(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_test_user(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_test_user(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.delete_test_user(uuid) TO service_role;

-- Household functions: authenticated only
REVOKE EXECUTE ON FUNCTION public.create_household(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_household(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_household(text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.invite_to_household(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.invite_to_household(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.invite_to_household(uuid, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.accept_household_invitation(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.accept_household_invitation(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.accept_household_invitation(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.decline_household_invitation(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decline_household_invitation(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.decline_household_invitation(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.leave_household(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.leave_household(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.leave_household(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_my_household_ids() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_household_ids() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_household_ids() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_household_memberships(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_household_memberships(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_household_memberships(uuid) TO authenticated;

-- Utility/maintenance functions: service_role only
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_dismissals() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_dismissals() FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_dismissals() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_dismissals() TO service_role;

-- Trigger functions: service_role only
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;

-- update_postponement_tracking: authenticated and service_role
REVOKE EXECUTE ON FUNCTION public.update_postponement_tracking() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_postponement_tracking() FROM anon;
GRANT EXECUTE ON FUNCTION public.update_postponement_tracking() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_postponement_tracking() TO service_role;

-- ============================================================
-- PART 3: Fix get_user_emails to verify authorization
-- ============================================================
-- CRITICAL FIX: The old function returned ANY user's email without
-- checking if the caller was authorized to see it.
-- 
-- New behavior:
-- - Must be authenticated (anon gets empty result)
-- - Can only see emails for:
--   1. Their own account
--   2. Members of households they belong to

CREATE OR REPLACE FUNCTION public.get_user_emails(user_ids uuid[])
RETURNS TABLE(id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  caller_id uuid;
  allowed_user_ids uuid[];
BEGIN
  -- Get the caller's ID
  caller_id := auth.uid();
  
  -- If not authenticated, return empty
  IF caller_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Build list of user IDs the caller is allowed to see:
  -- 1. The caller themselves
  -- 2. Members of any household the caller belongs to
  SELECT array_agg(DISTINCT allowed_id) INTO allowed_user_ids
  FROM (
    -- The caller themselves
    SELECT caller_id AS allowed_id
    UNION
    -- All members of caller's households
    SELECT hm.user_id AS allowed_id
    FROM household_members hm
    WHERE hm.household_id IN (
      SELECT hm2.household_id 
      FROM household_members hm2 
      WHERE hm2.user_id = caller_id
    )
  ) allowed;
  
  -- Only return emails for users that are both:
  -- 1. In the requested user_ids array
  -- 2. In the allowed_user_ids array (authorized)
  RETURN QUERY
  SELECT u.id, u.email::text
  FROM auth.users u
  WHERE u.id = ANY(user_ids)
    AND u.id = ANY(allowed_user_ids);
END;
$function$;

-- Add comment explaining the security model
COMMENT ON FUNCTION public.get_user_emails(uuid[]) IS 
  'Returns emails for requested user IDs, but only those the caller is authorized to see (self or household members). Requires authentication.';

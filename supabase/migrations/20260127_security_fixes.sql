-- Fix RLS on household_members
DROP POLICY IF EXISTS "Users can manage household members" ON "public"."household_members";

CREATE POLICY "Users can view household members" ON "public"."household_members"
AS PERMISSIVE FOR SELECT
TO public
USING (
  household_id IN (
    SELECT household_id
    FROM household_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins and owners can remove members" ON "public"."household_members"
AS PERMISSIVE FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM household_members requestor
    WHERE requestor.household_id = household_members.household_id
    AND requestor.user_id = auth.uid()
    AND requestor.role IN ('owner', 'admin')
  )
);

-- Fix mutable search path for functions
ALTER FUNCTION public.cleanup_expired_dismissals() SET search_path = public;
ALTER FUNCTION public.update_push_token_updated_at() SET search_path = public;
ALTER FUNCTION public.update_plant_journal_entries_updated_at() SET search_path = public;
ALTER FUNCTION public.delete_test_user() SET search_path = public;
ALTER FUNCTION public.delete_test_user(uuid) SET search_path = public;

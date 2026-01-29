-- Fix infinite recursion in RLS policies by introducing a security definer function
-- to safely look up user's household memberships.

-- 1. Create a secure function to get current user's household IDs
-- This function runs with elevated privileges (SECURITY DEFINER) to bypass RLS
-- on household_members table, breaking the recursion loop.
CREATE OR REPLACE FUNCTION public.get_my_household_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT household_id
  FROM household_members
  WHERE user_id = auth.uid()
$$;

-- 2. Update household_members policy to use the safe function
DROP POLICY IF EXISTS "Users can view household members" ON "public"."household_members";

CREATE POLICY "Users can view household members" ON "public"."household_members"
AS PERMISSIVE FOR SELECT
TO public
USING (
  household_id IN ( SELECT public.get_my_household_ids() )
);

-- 3. Update households policy (assuming it might also be using the unsafe pattern)
-- We'll just recreate the select policy for households to be safe and efficient
DROP POLICY IF EXISTS "Users can view their households" ON "public"."households";
-- Also drop potentially other named policies that do the same thing
DROP POLICY IF EXISTS "Users can view joined households" ON "public"."households";

CREATE POLICY "Users can view their households" ON "public"."households"
FOR SELECT TO public
USING (
  id IN ( SELECT public.get_my_household_ids() )
);

-- Fix security vulnerability: Change plants_with_watering_info from SECURITY DEFINER to SECURITY INVOKER
-- This ensures the view respects the caller's RLS policies and permissions
--
-- Issues fixed:
-- 1. View was using SECURITY DEFINER (security_invoker=false) with postgres owner
--    This could bypass RLS on underlying tables (user_plants, watering_records, household_members)
-- 2. Overly permissive grants - anon role had full access including INSERT, UPDATE, DELETE
-- 3. All roles had write permissions on what should be a read-only view

-- Drop and recreate the view with SECURITY INVOKER
DROP VIEW IF EXISTS public.plants_with_watering_info;

CREATE VIEW public.plants_with_watering_info
WITH (security_invoker = true)
AS
SELECT 
    up.id,
    up.user_id,
    up.nickname,
    up.plant_type,
    up.image,
    up.room,
    up.suggested_watering_days,
    up.is_outdoor_plant,
    up.household_id,
    up.created_at,
    up.updated_at,
    up.alternative_names,
    wr.watered_at AS last_watered_at,
    wr.notes AS last_watering_notes,
    CASE
        WHEN wr.watered_at IS NOT NULL THEN now()::date - wr.watered_at::date
        ELSE NULL::integer
    END AS days_since_watering
FROM user_plants up
LEFT JOIN LATERAL (
    SELECT wr_1.watered_at, wr_1.notes
    FROM watering_records wr_1
    WHERE wr_1.plant_id = up.id 
      AND wr_1.watered_at <= now() 
      AND (wr_1.notes IS NULL OR wr_1.notes !~~ '%POSTPONEMENT:%'::text)
    ORDER BY wr_1.watered_at DESC
    LIMIT 1
) wr ON true
WHERE up.user_id = auth.uid() 
   OR (up.household_id IN (
       SELECT household_members.household_id
       FROM household_members
       WHERE household_members.user_id = auth.uid()
   ));

-- Revoke all existing grants to ensure clean slate
REVOKE ALL ON public.plants_with_watering_info FROM PUBLIC;
REVOKE ALL ON public.plants_with_watering_info FROM anon;
REVOKE ALL ON public.plants_with_watering_info FROM authenticated;
REVOKE ALL ON public.plants_with_watering_info FROM service_role;

-- Grant SELECT only to authenticated users (read-only view access)
GRANT SELECT ON public.plants_with_watering_info TO authenticated;

-- Grant SELECT to service_role for backend operations
GRANT SELECT ON public.plants_with_watering_info TO service_role;

-- Add comment documenting the security model
COMMENT ON VIEW public.plants_with_watering_info IS 'View showing plants with watering info. Uses SECURITY INVOKER to respect caller RLS. Filter: user_id = auth.uid() OR household membership.';

-- Fix 500 error in plants_with_watering_info view by avoiding RLS recursion
-- We change the view to be security_definer (using owner permissions) 
-- but explicitly filter by user access rights inside the view.

DROP VIEW IF EXISTS public.plants_with_watering_info;

CREATE VIEW public.plants_with_watering_info
WITH (security_invoker=false) -- Use owner permissions (bypassing RLS on underlying tables)
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
    WHEN wr.watered_at IS NOT NULL THEN (now()::date - wr.watered_at::date)
    ELSE NULL::integer
  END AS days_since_watering
FROM user_plants up
LEFT JOIN LATERAL (
  SELECT 
    wr_1.watered_at,
    wr_1.notes
  FROM watering_records wr_1
  WHERE wr_1.plant_id = up.id 
    AND wr_1.watered_at <= now() 
    AND (wr_1.notes IS NULL OR wr_1.notes NOT LIKE '%POSTPONEMENT:%')
  ORDER BY wr_1.watered_at DESC
  LIMIT 1
) wr ON true
WHERE
  -- Security check: User owns the plant
  up.user_id = auth.uid()
  OR
  -- Security check: User is member of the household
  up.household_id IN (
    SELECT household_id
    FROM household_members
    WHERE user_id = auth.uid()
  );

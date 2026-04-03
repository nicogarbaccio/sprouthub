-- Add last_fertilized_date to user_plants for fertilization tracking
ALTER TABLE user_plants
  ADD COLUMN IF NOT EXISTS last_fertilized_date TIMESTAMPTZ DEFAULT NULL;

-- Recreate the plants_with_watering_info view to include the new column.
-- The view explicitly lists columns (not SELECT *), so it must be dropped and recreated.
DROP VIEW IF EXISTS public.plants_with_watering_info;

CREATE VIEW public.plants_with_watering_info
WITH (security_invoker=false)
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
  up.last_fertilized_date,
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
  up.user_id = auth.uid()
  OR
  up.household_id IN (
    SELECT household_id
    FROM household_members
    WHERE user_id = auth.uid()
  );

-- Recreate the plants view to:
--   1. Filter postponements by record_type rather than a notes LIKE pattern.
--   2. Drop days_since_watering, which computed `now()::date - watered_at::date` in the
--      database timezone. That drifts by a day from the user's own calendar day, so it
--      disagreed with the plant cards. Application code derives days elapsed from
--      last_watered_at via getDaysSince instead, and nothing reads this column anymore.
--   3. Drop last_fertilized_date, superseded by fertilization_records and the
--      last_fertilized_at column. Verified that all six legacy values exist in
--      fertilization_records before dropping the underlying column below.

DROP VIEW IF EXISTS public.plants_with_watering_info;

CREATE VIEW public.plants_with_watering_info
WITH (security_invoker=true)
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
  fr.fertilized_at AS last_fertilized_at,
  fr.notes AS last_fertilization_notes
FROM public.user_plants up
LEFT JOIN LATERAL (
  SELECT wr_1.watered_at, wr_1.notes
  FROM public.watering_records wr_1
  WHERE wr_1.plant_id = up.id
    AND wr_1.watered_at <= now()
    AND wr_1.record_type <> 'postponement'
  ORDER BY wr_1.watered_at DESC
  LIMIT 1
) wr ON true
LEFT JOIN LATERAL (
  SELECT fr_1.fertilized_at, fr_1.notes
  FROM public.fertilization_records fr_1
  WHERE fr_1.plant_id = up.id
    AND fr_1.fertilized_at <= now()
  ORDER BY fr_1.fertilized_at DESC
  LIMIT 1
) fr ON true
WHERE
  up.user_id = auth.uid()
  OR up.household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = auth.uid()
  );

-- Safe only after the view above no longer references it.
ALTER TABLE public.user_plants DROP COLUMN IF EXISTS last_fertilized_date;

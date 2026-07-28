-- Expose the newest fertilization from fertilization_records, the same way last_watered_at
-- is derived from watering_records. This makes the records table the single source of
-- truth and leaves user_plants.last_fertilized_date as a deprecated, unread column.
--
-- Also restores security_invoker=true, which 20260409 (add_fertilization_to_user_plants)
-- accidentally reverted when it recreated the view, undoing the hardening added in
-- 20260203_fix_plants_view_security_invoker. Verified against the user_plants SELECT
-- policy, which matches this view's WHERE clause exactly, so owned and household plants
-- remain visible and anon is denied.
--
-- days_since_watering is intentionally retained for backwards compatibility but is
-- deprecated: it resolves the calendar day in the database timezone, which drifts from the
-- user's local day. Application code derives days elapsed from the timestamps instead.

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
  up.last_fertilized_date,
  wr.watered_at AS last_watered_at,
  wr.notes AS last_watering_notes,
  CASE
    WHEN wr.watered_at IS NOT NULL THEN (now()::date - wr.watered_at::date)
    ELSE NULL::integer
  END AS days_since_watering,
  fr.fertilized_at AS last_fertilized_at,
  fr.notes AS last_fertilization_notes
FROM public.user_plants up
LEFT JOIN LATERAL (
  SELECT wr_1.watered_at, wr_1.notes
  FROM public.watering_records wr_1
  WHERE wr_1.plant_id = up.id
    AND wr_1.watered_at <= now()
    AND (wr_1.notes IS NULL OR wr_1.notes NOT LIKE '%POSTPONEMENT:%')
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

-- Rest periods: some species need no regular watering for a season (Lithops in winter,
-- Cyclamen in summer, Caladium while the tuber is stored). The app offers to pause a plant's
-- watering reminders until the season ends. While watering_paused_until is in the future the
-- plant is never due or overdue; on that date it becomes due. See
-- src/utils/watering/schedule.ts and src/utils/watering/restPeriod.ts.
--
-- A calendar date (not a timestamp) so the pause ends on the same day for the user regardless
-- of timezone, matching how due-ness is computed.

ALTER TABLE public.user_plants
  ADD COLUMN IF NOT EXISTS watering_paused_until date;

COMMENT ON COLUMN public.user_plants.watering_paused_until IS
  'While in the future, watering reminders are paused for a rest period; the plant is due on this date.';

-- Expose the column through the view the app and the push job read. The new column is
-- appended so CREATE OR REPLACE keeps the view (and its security_invoker setting) in place;
-- the body is otherwise identical to 20260729011718 clean_up_deprecated_watering_columns.
CREATE OR REPLACE VIEW public.plants_with_watering_info
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
  fr.notes AS last_fertilization_notes,
  up.watering_paused_until
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
WHERE up.user_id = auth.uid()
   OR up.household_id IN (
     SELECT household_members.household_id
     FROM household_members
     WHERE household_members.user_id = auth.uid()
   );

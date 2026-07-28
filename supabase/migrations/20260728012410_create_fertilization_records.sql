-- Fertilization history, mirroring watering_records.
--
-- Previously fertilization was tracked only as user_plants.last_fertilized_date, a single
-- overwritten timestamp. That made it impossible to derive real fertilization intervals,
-- gave no audit trail or undo, and let household members silently overwrite each other.
-- It is also why the reminder banner had to invent a flat 60-day rule: there was no data
-- to compute a per-plant schedule from.

CREATE TABLE IF NOT EXISTS public.fertilization_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id uuid NOT NULL REFERENCES public.user_plants(id) ON DELETE CASCADE,
  fertilized_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  -- What was applied, e.g. "balanced liquid fertilizer (half strength)".
  fertilizer_type text,
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Primary access pattern: newest fertilization for a plant.
CREATE INDEX IF NOT EXISTS fertilization_records_plant_id_fertilized_at_idx
  ON public.fertilization_records (plant_id, fertilized_at DESC);

ALTER TABLE public.fertilization_records ENABLE ROW LEVEL SECURITY;

-- Policies mirror watering_records: read/write for plants the user owns or shares via a
-- household; updates restricted to the person who logged the record.
CREATE POLICY "Users can view fertilization records for accessible plants"
  ON public.fertilization_records
  FOR SELECT
  USING (
    plant_id IN (
      SELECT user_plants.id FROM public.user_plants
      WHERE user_plants.user_id = (SELECT auth.uid())
         OR user_plants.household_id IN (
              SELECT household_members.household_id FROM public.household_members
              WHERE household_members.user_id = (SELECT auth.uid())
            )
    )
  );

CREATE POLICY "Users can create fertilization records for accessible plants"
  ON public.fertilization_records
  FOR INSERT
  WITH CHECK (
    plant_id IN (
      SELECT user_plants.id FROM public.user_plants
      WHERE user_plants.user_id = (SELECT auth.uid())
         OR user_plants.household_id IN (
              SELECT household_members.household_id FROM public.household_members
              WHERE household_members.user_id = (SELECT auth.uid())
            )
    )
  );

CREATE POLICY "Users can update their own fertilization records"
  ON public.fertilization_records
  FOR UPDATE
  USING (performed_by = (SELECT auth.uid()));

CREATE POLICY "Users can delete fertilization records for their plants"
  ON public.fertilization_records
  FOR DELETE
  USING (
    plant_id IN (
      SELECT user_plants.id FROM public.user_plants
      WHERE user_plants.user_id = (SELECT auth.uid())
         OR user_plants.household_id IN (
              SELECT household_members.household_id FROM public.household_members
              WHERE household_members.user_id = (SELECT auth.uid())
            )
    )
  );

-- Backfill from the column being replaced so no history is lost.
INSERT INTO public.fertilization_records (plant_id, fertilized_at, notes, performed_by)
SELECT up.id, up.last_fertilized_date, 'Imported from last_fertilized_date', up.user_id
FROM public.user_plants up
WHERE up.last_fertilized_date IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.fertilization_records fr WHERE fr.plant_id = up.id
  );

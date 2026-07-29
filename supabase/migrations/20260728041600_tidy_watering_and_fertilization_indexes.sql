-- Mirror the covering index watering_records already has on performed_by. Flagged by the
-- performance advisor after fertilization_records was added.
CREATE INDEX IF NOT EXISTS fertilization_records_performed_by_idx
  ON public.fertilization_records (performed_by);

-- idx_watering_records_plant_id is now redundant: the new
-- (plant_id, record_type, watered_at DESC) index has plant_id as its leading column, so it
-- serves plant_id-only lookups and the foreign key's cascade deletes equally well. Keeping both
-- just adds write overhead.
DROP INDEX IF EXISTS public.idx_watering_records_plant_id;

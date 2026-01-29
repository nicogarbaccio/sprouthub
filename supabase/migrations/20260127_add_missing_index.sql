-- Add index for foreign key to improve join performance
CREATE INDEX IF NOT EXISTS idx_plant_journal_entries_related_watering_record_id
ON public.plant_journal_entries (related_watering_record_id);

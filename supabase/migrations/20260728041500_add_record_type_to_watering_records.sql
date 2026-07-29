-- Promote the postponement marker from a substring in free-text notes to a real column.
--
-- Postponements are stored as rows in watering_records dated in the future, distinguished only
-- by a 'POSTPONEMENT:' substring inside `notes`. Every query deriving intervals, streaks,
-- counts or averages has to remember to exclude them, across roughly eight call sites. One had
-- already forgotten (evaluateSchedulePerformance counted them as real waterings), and a user
-- typing "POSTPONEMENT:" into a note would have been silently misread as one.
--
-- The notes marker is intentionally still written alongside this column for now: it is
-- human-readable in the watering history UI, and it keeps any stale cached client working.
-- Reads treat record_type as authoritative and fall back to the marker.

ALTER TABLE public.watering_records
  ADD COLUMN IF NOT EXISTS record_type text NOT NULL DEFAULT 'watering';

ALTER TABLE public.watering_records
  DROP CONSTRAINT IF EXISTS watering_records_record_type_check;

ALTER TABLE public.watering_records
  ADD CONSTRAINT watering_records_record_type_check
  CHECK (record_type IN ('watering', 'postponement'));

-- Backfill from the marker.
UPDATE public.watering_records
SET record_type = 'postponement'
WHERE notes LIKE '%POSTPONEMENT:%'
  AND record_type <> 'postponement';

-- Serves the two dominant access patterns: newest real watering for a plant, and pending
-- postponements for a plant. Replaces sequential scans with a LIKE filter.
CREATE INDEX IF NOT EXISTS watering_records_plant_id_record_type_watered_at_idx
  ON public.watering_records (plant_id, record_type, watered_at DESC);

COMMENT ON COLUMN public.watering_records.record_type IS
  'Discriminator: ''watering'' for a real watering, ''postponement'' for a deferral. Queries deriving intervals or counts must exclude postponements.';

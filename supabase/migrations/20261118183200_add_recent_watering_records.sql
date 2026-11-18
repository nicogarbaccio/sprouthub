-- The latest N watering records for each of several plants in one call.
-- The dashboard's suggestion analysis used to send one request per plant for this
-- ("last 15 records"), which a plain .in() query can't express per plant.
-- SECURITY INVOKER so watering_records' RLS still decides which plants the caller sees.
create or replace function public.recent_watering_records(
  p_plant_ids uuid[],
  p_per_plant integer default 15
)
returns table (
  plant_id uuid,
  id uuid,
  watered_at timestamptz,
  notes text,
  record_type text
)
language sql
stable
security invoker
set search_path = public
as $$
  select r.plant_id, r.id, r.watered_at, r.notes, r.record_type
  from unnest(p_plant_ids) as p(pid)
  cross join lateral (
    select wr.plant_id, wr.id, wr.watered_at, wr.notes, wr.record_type
    from public.watering_records wr
    where wr.plant_id = p.pid
    order by wr.watered_at desc
    limit p_per_plant
  ) r;
$$;

revoke all on function public.recent_watering_records(uuid[], integer) from public, anon;
grant execute on function public.recent_watering_records(uuid[], integer) to authenticated;

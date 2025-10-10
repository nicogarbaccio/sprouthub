# Database Security Fixes

## SECURITY DEFINER View Fix (October 2, 2025)

### Issue Summary
The `plants_with_watering_info` view was defined with `SECURITY DEFINER`, which caused queries against the view to execute with the permissions and RLS context of the view's owner (postgres), not the calling user. This created a security vulnerability that could potentially bypass Row Level Security policies.

### Security Risks
1. **RLS Bypass**: Users querying the view could potentially see rows they shouldn't have access to
2. **Privilege Escalation**: Grants on the view could effectively grant owner-level access to underlying tables
3. **Hard-to-Audit Behavior**: Access was mediated by the owner's privileges rather than the user's permissions

### Resolution
**Migration**: `fix_plants_view_security_invoker_v2` (October 2, 2025)

The view was recreated with the `security_invoker=true` option to ensure it respects RLS policies for the querying user:

```sql
CREATE VIEW public.plants_with_watering_info
WITH (security_invoker=true) AS
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
  wr.watered_at AS last_watered_at,
  wr.notes AS last_watering_notes,
  CASE
    WHEN wr.watered_at IS NOT NULL THEN now()::date - wr.watered_at::date
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
) wr ON true;
```

### Verification
- ✅ View now has `security_invoker=true` option explicitly set
- ✅ Security advisory cleared (ERROR-level warning removed)
- ✅ RLS policies on `user_plants` and `watering_records` tables are now properly enforced
- ✅ Users can only see plants they have access to through RLS policies

### Impact
- **User Experience**: No changes to functionality or user experience
- **Performance**: No performance impact
- **Security**: Significantly improved security posture by properly enforcing RLS policies
- **Backwards Compatibility**: Fully backwards compatible with existing application code

### Best Practices
Moving forward, all views should:
1. Use `security_invoker=true` by default to respect RLS policies
2. Only use `SECURITY DEFINER` if absolutely necessary and with proper safeguards
3. Be documented with clear security implications
4. Be regularly audited using Supabase security advisors

### Related Resources
- [Supabase Database Linter - SECURITY DEFINER Views](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)
- [PostgreSQL 15+ Security Invoker Views](https://www.postgresql.org/docs/15/sql-createview.html)
- Migration: `supabase/migrations/YYYYMMDDHHMMSS_fix_plants_view_security_invoker_v2.sql`


-- Optimize RLS policies by wrapping auth.uid() in a subquery

-- 1. household_members
DROP POLICY IF EXISTS "Users can view household members" ON "public"."household_members";
CREATE POLICY "Users can view household members" ON "public"."household_members"
AS PERMISSIVE FOR SELECT TO public
USING (
  household_id IN (
    SELECT household_id
    FROM household_members
    WHERE user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Admins and owners can remove members" ON "public"."household_members";
CREATE POLICY "Admins and owners can remove members" ON "public"."household_members"
AS PERMISSIVE FOR DELETE TO public
USING (
  EXISTS (
    SELECT 1
    FROM household_members requestor
    WHERE requestor.household_id = household_members.household_id
    AND requestor.user_id = (SELECT auth.uid())
    AND requestor.role IN ('owner', 'admin')
  )
);

-- 2. dismissed_suggestions
DROP POLICY IF EXISTS "Users can view their own dismissed suggestions" ON "public"."dismissed_suggestions";
CREATE POLICY "Users can view their own dismissed suggestions" ON "public"."dismissed_suggestions"
FOR SELECT TO public USING ( (SELECT auth.uid()) = user_id );

DROP POLICY IF EXISTS "Users can insert their own dismissed suggestions" ON "public"."dismissed_suggestions";
CREATE POLICY "Users can insert their own dismissed suggestions" ON "public"."dismissed_suggestions"
FOR INSERT TO public WITH CHECK ( (SELECT auth.uid()) = user_id );

DROP POLICY IF EXISTS "Users can update their own dismissed suggestions" ON "public"."dismissed_suggestions";
CREATE POLICY "Users can update their own dismissed suggestions" ON "public"."dismissed_suggestions"
FOR UPDATE TO public USING ( (SELECT auth.uid()) = user_id );

DROP POLICY IF EXISTS "Users can delete their own dismissed suggestions" ON "public"."dismissed_suggestions";
CREATE POLICY "Users can delete their own dismissed suggestions" ON "public"."dismissed_suggestions"
FOR DELETE TO public USING ( (SELECT auth.uid()) = user_id );

-- 3. push_notification_tokens
DROP POLICY IF EXISTS "Users can view their own push tokens" ON "public"."push_notification_tokens";
CREATE POLICY "Users can view their own push tokens" ON "public"."push_notification_tokens"
FOR SELECT TO public USING ( (SELECT auth.uid()) = user_id );

DROP POLICY IF EXISTS "Users can insert their own push tokens" ON "public"."push_notification_tokens";
CREATE POLICY "Users can insert their own push tokens" ON "public"."push_notification_tokens"
FOR INSERT TO public WITH CHECK ( (SELECT auth.uid()) = user_id );

DROP POLICY IF EXISTS "Users can update their own push tokens" ON "public"."push_notification_tokens";
CREATE POLICY "Users can update their own push tokens" ON "public"."push_notification_tokens"
FOR UPDATE TO public USING ( (SELECT auth.uid()) = user_id ) WITH CHECK ( (SELECT auth.uid()) = user_id );

DROP POLICY IF EXISTS "Users can delete their own push tokens" ON "public"."push_notification_tokens";
CREATE POLICY "Users can delete their own push tokens" ON "public"."push_notification_tokens"
FOR DELETE TO public USING ( (SELECT auth.uid()) = user_id );

-- 4. notification_logs
DROP POLICY IF EXISTS "Users can view their own notification logs" ON "public"."notification_logs";
CREATE POLICY "Users can view their own notification logs" ON "public"."notification_logs"
FOR SELECT TO public USING ( (SELECT auth.uid()) = user_id );

-- 5. plant_journal_entries
DROP POLICY IF EXISTS "Users can view own journal entries" ON "public"."plant_journal_entries";
CREATE POLICY "Users can view own journal entries" ON "public"."plant_journal_entries"
FOR SELECT TO public USING ( user_id = (SELECT auth.uid()) );

DROP POLICY IF EXISTS "Users can insert own journal entries" ON "public"."plant_journal_entries";
CREATE POLICY "Users can insert own journal entries" ON "public"."plant_journal_entries"
FOR INSERT TO public WITH CHECK ( user_id = (SELECT auth.uid()) );

DROP POLICY IF EXISTS "Users can update own journal entries" ON "public"."plant_journal_entries";
CREATE POLICY "Users can update own journal entries" ON "public"."plant_journal_entries"
FOR UPDATE TO public USING ( user_id = (SELECT auth.uid()) );

DROP POLICY IF EXISTS "Users can delete own journal entries" ON "public"."plant_journal_entries";
CREATE POLICY "Users can delete own journal entries" ON "public"."plant_journal_entries"
FOR DELETE TO public USING ( user_id = (SELECT auth.uid()) );

-- 6. dismissed_pattern_insights
DROP POLICY IF EXISTS "Users can view dismissed insights for their plants" ON "public"."dismissed_pattern_insights";
CREATE POLICY "Users can view dismissed insights for their plants" ON "public"."dismissed_pattern_insights"
FOR SELECT TO public USING (
  EXISTS (
    SELECT 1 FROM user_plants
    WHERE user_plants.id = dismissed_pattern_insights.user_plant_id
    AND user_plants.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can insert dismissed insights for their plants" ON "public"."dismissed_pattern_insights";
CREATE POLICY "Users can insert dismissed insights for their plants" ON "public"."dismissed_pattern_insights"
FOR INSERT TO public WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_plants
    WHERE user_plants.id = dismissed_pattern_insights.user_plant_id
    AND user_plants.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can delete dismissed insights for their plants" ON "public"."dismissed_pattern_insights";
CREATE POLICY "Users can delete dismissed insights for their plants" ON "public"."dismissed_pattern_insights"
FOR DELETE TO public USING (
  EXISTS (
    SELECT 1 FROM user_plants
    WHERE user_plants.id = dismissed_pattern_insights.user_plant_id
    AND user_plants.user_id = (SELECT auth.uid())
  )
);

-- 7. watering_records
DROP POLICY IF EXISTS "Users can delete watering records for their plants" ON "public"."watering_records";
CREATE POLICY "Users can delete watering records for their plants" ON "public"."watering_records"
FOR DELETE TO public USING (
  plant_id IN (
    SELECT user_plants.id FROM user_plants
    WHERE user_plants.user_id = (SELECT auth.uid())
    OR user_plants.household_id IN (
      SELECT household_members.household_id
      FROM household_members
      WHERE household_members.user_id = (SELECT auth.uid())
    )
  )
);

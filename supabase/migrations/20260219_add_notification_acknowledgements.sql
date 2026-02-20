-- Notification acknowledgements table
-- Tracks which notifications a user has dismissed/acknowledged, synced across devices
-- Replaces the per-device localStorage-based acknowledgement tracking

CREATE TABLE notification_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  plant_id UUID REFERENCES user_plants(id) ON DELETE CASCADE,
  acknowledged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_type, plant_id, acknowledged_date)
);

-- RLS
ALTER TABLE notification_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own acknowledgements"
  ON notification_acknowledgements FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own acknowledgements"
  ON notification_acknowledgements FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own acknowledgements"
  ON notification_acknowledgements FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- Index for the primary lookup pattern: fetch today's acks for a user
CREATE INDEX idx_notification_ack_user_date
  ON notification_acknowledgements (user_id, acknowledged_date);

-- Revoke anon access (follows existing security pattern from 20260203_comprehensive_security_hardening.sql)
REVOKE ALL ON notification_acknowledgements FROM anon;

-- Migration: Add Push Notification Tokens Support
-- Description: Adds table to store user device push notification tokens
-- and preferences for when to send push notifications

-- Create push_notification_tokens table to store device tokens
CREATE TABLE IF NOT EXISTS push_notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
  device_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Prevent duplicate tokens per user
  UNIQUE(user_id, token)
);

-- Create index for faster lookups by user
CREATE INDEX idx_push_tokens_user_id ON push_notification_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON push_notification_tokens(is_active) WHERE is_active = true;

-- Add push notification preferences to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS push_notification_time TIME DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS push_notification_timezone TEXT DEFAULT 'America/New_York';

-- Create notification_logs table to track sent notifications (for debugging and preventing duplicates)
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  plant_id UUID REFERENCES user_plants(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  error_message TEXT,

  -- Metadata for the notification content
  metadata JSONB
);

-- Create index for notification logs
CREATE INDEX idx_notification_logs_user_sent ON notification_logs(user_id, sent_at DESC);
CREATE INDEX idx_notification_logs_plant ON notification_logs(plant_id);

-- Enable Row Level Security
ALTER TABLE push_notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_notification_tokens
-- Users can only manage their own tokens
CREATE POLICY "Users can view their own push tokens"
  ON push_notification_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push tokens"
  ON push_notification_tokens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens"
  ON push_notification_tokens FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens"
  ON push_notification_tokens FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for notification_logs
-- Users can only view their own notification logs
CREATE POLICY "Users can view their own notification logs"
  ON notification_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can insert notification logs (for Edge Function)
CREATE POLICY "Service role can insert notification logs"
  ON notification_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_push_token_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON push_notification_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_push_token_updated_at();

-- Add helpful comments
COMMENT ON TABLE push_notification_tokens IS 'Stores device push notification tokens for users';
COMMENT ON TABLE notification_logs IS 'Tracks sent push notifications for debugging and preventing duplicates';
COMMENT ON COLUMN profiles.push_notifications_enabled IS 'Whether user wants to receive push notifications';
COMMENT ON COLUMN profiles.push_notification_time IS 'Preferred time to receive daily watering reminder notifications';
COMMENT ON COLUMN profiles.push_notification_timezone IS 'User timezone for scheduling notifications';

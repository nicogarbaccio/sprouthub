-- Create table for calendar-based seasonal notifications
-- This table tracks user responses to calendar-based seasonal change notifications
-- (independent of weather-based seasonal detection)

CREATE TABLE IF NOT EXISTS calendar_seasonal_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season TEXT NOT NULL CHECK (season IN ('spring', 'summer', 'fall', 'winter')),
  year INTEGER NOT NULL,
  dismissed_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one notification record per user/season/year
  UNIQUE(user_id, season, year)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_calendar_seasonal_notifications_user_season
  ON calendar_seasonal_notifications(user_id, season, year);

-- Add RLS policies
ALTER TABLE calendar_seasonal_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own calendar seasonal notifications"
  ON calendar_seasonal_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own notifications
CREATE POLICY "Users can insert own calendar seasonal notifications"
  ON calendar_seasonal_notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own notifications
CREATE POLICY "Users can update own calendar seasonal notifications"
  ON calendar_seasonal_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own calendar seasonal notifications"
  ON calendar_seasonal_notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_calendar_seasonal_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calendar_seasonal_notifications_updated_at
  BEFORE UPDATE ON calendar_seasonal_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_seasonal_notifications_updated_at();

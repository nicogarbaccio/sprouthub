-- Create table to track dismissed schedule suggestions
-- This allows dismissals to sync across devices instead of being stored only in localStorage

CREATE TABLE IF NOT EXISTS dismissed_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES user_plants(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT NOT NULL CHECK (reason IN ('user_dismissed', 'applied', 'auto_expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Composite unique constraint to prevent duplicate dismissals
  UNIQUE(user_id, plant_id)
);

-- Create index for faster lookups by user
CREATE INDEX idx_dismissed_suggestions_user ON dismissed_suggestions(user_id);

-- Create index for faster lookups by plant
CREATE INDEX idx_dismissed_suggestions_plant ON dismissed_suggestions(plant_id);

-- Create index for expiry cleanup
CREATE INDEX idx_dismissed_suggestions_expires ON dismissed_suggestions(expires_at);

-- Add RLS policies
ALTER TABLE dismissed_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own dismissed suggestions
CREATE POLICY "Users can view their own dismissed suggestions"
  ON dismissed_suggestions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dismissed suggestions"
  ON dismissed_suggestions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dismissed suggestions"
  ON dismissed_suggestions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dismissed suggestions"
  ON dismissed_suggestions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON dismissed_suggestions TO authenticated;

-- Function to clean up expired dismissals (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_dismissals()
RETURNS void AS $$
BEGIN
  DELETE FROM dismissed_suggestions
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

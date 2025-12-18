-- Create table to track dismissed pattern insights
-- This allows users to permanently dismiss watering pattern suggestions
-- so they don't get nagged with the same suggestions repeatedly

CREATE TABLE IF NOT EXISTS dismissed_pattern_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_plant_id UUID NOT NULL REFERENCES user_plants(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Composite unique constraint to prevent duplicate dismissals
  UNIQUE(user_plant_id, insight_type)
);

-- Create index for faster lookups by plant
CREATE INDEX idx_dismissed_insights_plant ON dismissed_pattern_insights(user_plant_id);

-- Add RLS policies
ALTER TABLE dismissed_pattern_insights ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own plant's dismissed insights
CREATE POLICY "Users can view dismissed insights for their plants"
  ON dismissed_pattern_insights
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_plants
      WHERE user_plants.id = dismissed_pattern_insights.user_plant_id
      AND user_plants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert dismissed insights for their plants"
  ON dismissed_pattern_insights
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_plants
      WHERE user_plants.id = dismissed_pattern_insights.user_plant_id
      AND user_plants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete dismissed insights for their plants"
  ON dismissed_pattern_insights
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_plants
      WHERE user_plants.id = dismissed_pattern_insights.user_plant_id
      AND user_plants.user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON dismissed_pattern_insights TO authenticated;

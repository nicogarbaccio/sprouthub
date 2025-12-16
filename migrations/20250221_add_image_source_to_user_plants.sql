-- Add image_source column to user_plants table
ALTER TABLE user_plants ADD COLUMN IF NOT EXISTS image_source TEXT;

-- Comment on column
COMMENT ON COLUMN user_plants.image_source IS 'Credit or source URL for the plant image';


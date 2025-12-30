-- Add onboarding_completed column to profiles table
-- This flag tracks whether a user has completed the initial onboarding flow

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Set existing users as having completed onboarding (they've already been using the app)
UPDATE profiles
SET onboarding_completed = true
WHERE onboarding_completed IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN profiles.onboarding_completed IS 'Tracks whether user has completed the initial onboarding flow';

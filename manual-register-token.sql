-- Manual Device Token Registration
-- Use this if auto-registration isn't working

-- Step 1: Get your OneSignal Player ID
-- Go to: https://dashboard.onesignal.com/
-- Click your SproutHub app
-- Go to Audience > Subscriptions
-- Click on your subscription
-- Copy the Player ID

-- Step 2: Run this SQL with your Player ID
-- Replace 'YOUR_PLAYER_ID_HERE' with the actual ID from OneSignal

INSERT INTO push_notification_tokens (
  user_id,
  token,
  device_type,
  device_name,
  is_active,
  created_at,
  updated_at
)
VALUES (
  '7985e7bf-31ba-4f66-ac0f-1d67bee53072',  -- Your user ID
  'YOUR_PLAYER_ID_HERE',  -- Replace with your OneSignal Player ID
  'web',
  'Web Browser',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (user_id, token)
DO UPDATE SET
  is_active = true,
  updated_at = NOW();

-- Step 3: Verify it was saved
SELECT
  token,
  device_type,
  device_name,
  is_active,
  created_at
FROM push_notification_tokens
WHERE user_id = '7985e7bf-31ba-4f66-ac0f-1d67bee53072';

-- Step 4: Test again
-- Run ./test-notification.sh again
-- You should now see notifications_sent: 1 !

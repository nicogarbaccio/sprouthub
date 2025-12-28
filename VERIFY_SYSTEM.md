# ✅ Push Notification System Verification

You said the notification hit! Let's verify the complete end-to-end flow is working.

## Step 1: Verify You're Subscribed in OneSignal

1. Go to your OneSignal dashboard: https://dashboard.onesignal.com/
2. Select your SproutHub app
3. Go to **Audience** > **Subscriptions**
4. You should see yourself listed as a subscriber

## Step 2: Register Device Token in Database

Even though notifications are working through OneSignal, we need to save the token to our database for the Edge Function to work.

### Option A: Manual Registration (Quick Test)

Run this in Supabase SQL Editor:

```sql
-- Get your OneSignal Player ID from the OneSignal dashboard
-- Then insert it manually for testing:

INSERT INTO push_notification_tokens (user_id, token, device_type, device_name, is_active)
VALUES (
  '7985e7bf-31ba-4f66-ac0f-1d67bee53072',  -- Your user ID
  'YOUR_ONESIGNAL_PLAYER_ID_HERE',  -- From OneSignal dashboard
  'web',
  'Web Browser',
  true
)
ON CONFLICT (user_id, token) DO NOTHING;
```

### Option B: Auto-Registration (Proper Way)

The OneSignal web service should auto-register. Let's debug:

1. Open browser console (F12)
2. Log out and log back in
3. Look for these messages:
   - "Initializing OneSignal Web Push..."
   - "OneSignal Player ID: [ID]"
   - "✅ Push token saved to database successfully!"

If you see errors, paste them here.

## Step 3: Test End-to-End Flow

Once the token is in the database, test the complete flow:

```bash
./test-notification.sh
```

### Expected Results:

1. **Edge Function runs** ✅
2. **Finds test plant** ✅
3. **Finds your push token** ✅
4. **Sends via OneSignal** ✅
5. **You receive notification** ✅
6. **Log created in database** ✅

### Verify Each Step:

**Check Edge Function Response:**
```json
{
  "success": true,
  "notifications_sent": 1,
  "notifications_failed": 0,
  "users_processed": 1
}
```

**Check Database Logs:**
```sql
SELECT
  nl.sent_at,
  nl.notification_type,
  nl.status,
  up.nickname,
  nl.metadata
FROM notification_logs nl
JOIN user_plants up ON nl.plant_id = up.id
ORDER BY nl.sent_at DESC
LIMIT 5;
```

Should show:
- `status: 'sent'`
- `notification_type: 'overdue_watering'`
- `plant_name: '🧪 Test Thirsty Plant'`

**Check Token Usage:**
```sql
SELECT
  token,
  device_type,
  last_used_at,
  is_active
FROM push_notification_tokens
WHERE user_id = '7985e7bf-31ba-4f66-ac0f-1d67bee53072';
```

Should show `last_used_at` was just updated.

## Step 4: How Did You Receive the Notification?

Please let me know:

A. **Did you send a test notification from OneSignal dashboard?**
   - Dashboard > Messages > New Push > Send Test

B. **Did you run the `./test-notification.sh` script?**
   - What was the response?

C. **Something else?**

## Step 5: Clean Up Test Data

Once verified, remove the test plant:

```sql
DELETE FROM user_plants WHERE nickname = '🧪 Test Thirsty Plant';
DELETE FROM notification_logs WHERE plant_id = 'dfb88197-1b97-4c35-a251-96bb57f18e85';
```

## 🎯 What Should Happen Going Forward

Once everything is set up correctly:

1. **User logs in** → Device token saved to database
2. **Cron runs daily at 9 AM UTC** → Edge Function checks plants
3. **Plants overdue** → Function sends push via OneSignal
4. **User receives notification** → Even when app is closed!

---

## Next: Set Up the Cron Job

If everything above works, the final step is scheduling the daily cron job:

```sql
SELECT cron.schedule(
  'send-plant-notifications-daily',
  '0 9 * * *',  -- Daily at 9 AM UTC
  $$
  SELECT
    net.http_post(
      url:='https://ufhjudswppdqupjbqbwm.supabase.co/functions/v1/send-plant-notifications',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body:=jsonb_build_object()
    ) as request_id;
  $$
);
```

**Replace `YOUR_SERVICE_ROLE_KEY`** with your actual key from:
https://supabase.com/dashboard/project/ufhjudswppdqupjbqbwm/settings/api

---

**How did you receive the notification?** Let me know and we'll verify the complete flow!

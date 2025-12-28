# 🚀 Final Setup Steps - Push Notifications

You're almost done! Here are the remaining steps to get push notifications fully working.

## ✅ What You've Already Done

- [x] Set up OneSignal account
- [x] Added OneSignal credentials to `.env.local`
- [x] Added `OneSignalSDKWorker.js` to public folder
- [x] Database migration applied
- [x] Edge Function deployed

## 🔧 Step 1: Add Environment Variables to Supabase Edge Functions

You have two options:

### Option A: Using Supabase CLI (Recommended)

Run these commands in your terminal:

```bash
# Set OneSignal App ID
npx supabase secrets set ONESIGNAL_APP_ID=5db8206d-53e2-4cfc-a001-a97f630bafc1

# Set OneSignal API Key
npx supabase secrets set ONESIGNAL_API_KEY=os_v2_app_lw4ca3kt4jgpziabvf7wgc5pygp47acrmmae5vubrlv5fp2i5miavqre73acywjktklsfwsniz5glbvwnxdaididi6r5jytiyu4neoq

# Link to your project first if you haven't already
npx supabase link --project-ref ufhjudswppdqupjbqbwm
```

### Option B: Using Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/ufhjudswppdqupjbqbwm
2. Navigate to **Edge Functions** (left sidebar)
3. Click on the **Settings** or **Secrets** tab
4. Add these two secrets:
   - Key: `ONESIGNAL_APP_ID`, Value: `5db8206d-53e2-4cfc-a001-a97f630bafc1`
   - Key: `ONESIGNAL_API_KEY`, Value: `os_v2_app_lw4ca3kt4jgpziabvf7wgc5pygp47acrmmae5vubrlv5fp2i5miavqre73acywjktklsfwsniz5glbvwnxdaididi6r5jytiyu4neoq`

---

## 📅 Step 2: Set Up Daily Cron Job

Run this SQL in **Supabase SQL Editor**:

```sql
-- Schedule daily notifications at 9 AM UTC
SELECT cron.schedule(
  'send-plant-notifications-daily',
  '0 9 * * *',  -- Every day at 9 AM UTC
  $$
  SELECT
    net.http_post(
      url:='https://ufhjudswppdqupjbqbwm.supabase.co/functions/v1/send-plant-notifications',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY_HERE'
      ),
      body:=jsonb_build_object()
    ) as request_id;
  $$
);
```

**Important**: Replace `YOUR_SERVICE_ROLE_KEY_HERE` with your actual service role key.

**Where to find your service role key**:
1. Go to https://supabase.com/dashboard/project/ufhjudswppdqupjbqbwm/settings/api
2. Find **service_role** under "Project API keys"
3. Click to reveal the key
4. Copy and replace in the SQL above

**Cron Schedule Options**:
- `0 9 * * *` - Every day at 9 AM UTC
- `0 8 * * *` - Every day at 8 AM UTC
- `0 12 * * *` - Every day at 12 PM UTC
- `0 6,18 * * *` - Twice daily at 6 AM and 6 PM UTC

---

## 🧪 Step 3: Test the Edge Function

Before waiting for the cron job, let's test the function manually:

### Test with curl:

```bash
# Replace YOUR_SERVICE_ROLE_KEY with your actual key
curl -X POST 'https://ufhjudswppdqupjbqbwm.supabase.co/functions/v1/send-plant-notifications' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

**Expected Response** (if you have plants that need watering):
```json
{
  "success": true,
  "notifications_sent": 1,
  "notifications_failed": 0,
  "users_processed": 1
}
```

**If you don't have plants needing water yet**, the response will show:
```json
{
  "success": true,
  "notifications_sent": 0,
  "notifications_failed": 0,
  "users_processed": 1
}
```

---

## 🔍 Step 4: Verify Everything Works

### Check Edge Function Logs

1. Go to https://supabase.com/dashboard/project/ufhjudswppdqupjbqbwm/functions/send-plant-notifications/logs
2. Look for log entries like:
   - "Starting plant notification job..."
   - "Found X users with push notifications enabled"
   - "✓ Sent notification to user..."

### Check Notification Logs Table

Run this SQL to see if notifications were logged:

```sql
SELECT
  nl.*,
  p.first_name,
  up.nickname as plant_name
FROM notification_logs nl
JOIN profiles p ON nl.user_id = p.id
JOIN user_plants up ON nl.plant_id = up.id
ORDER BY nl.sent_at DESC
LIMIT 10;
```

### Check Push Tokens Table

Verify your device token is registered:

```sql
SELECT
  pnt.device_type,
  pnt.device_name,
  pnt.is_active,
  pnt.created_at,
  p.first_name,
  p.email
FROM push_notification_tokens pnt
JOIN profiles p ON pnt.user_id = p.id
WHERE pnt.is_active = true;
```

---

## 📱 Step 5: Enable Push Notifications in Your App

### For Development/Testing:

1. **Open your app** in a browser (https://localhost:8080 or your dev URL)
2. **Log in** to your account
3. The app will automatically request push notification permission
4. **Click "Allow"** when prompted
5. Check the browser console for: `"Push notifications initialized successfully"`
6. Go to **Settings > Notifications** to verify the Push Notifications card appears

### For iOS App:

You'll need to:
1. Open Xcode: `npx cap open ios`
2. Add **Push Notifications** capability
3. Add **Background Modes** capability → enable "Remote notifications"
4. Run `npx cap sync ios`
5. Build and test on a physical device (push doesn't work in simulator)

### For Android App:

You'll need to:
1. Ensure `google-services.json` is in `android/app/`
2. Run `npx cap sync android`
3. Build and test on a physical device

---

## 🧩 Step 6: Create a Test Plant (Optional)

To test notifications immediately, create a plant that needs watering:

```sql
-- Insert a test plant that's overdue for watering
INSERT INTO user_plants (user_id, nickname, plant_type, suggested_watering_days)
VALUES (
  'YOUR_USER_ID',  -- Replace with your user ID from auth.users
  'Test Thirsty Plant',
  'Monstera',
  7
);

-- Add a watering record from 10 days ago
INSERT INTO watering_records (plant_id, watered_at)
SELECT id, NOW() - INTERVAL '10 days'
FROM user_plants
WHERE nickname = 'Test Thirsty Plant';
```

Now when you trigger the Edge Function, it should send you a notification!

---

## ✅ Final Checklist

- [ ] Environment variables added to Supabase Edge Functions
- [ ] Cron job scheduled in Supabase
- [ ] Manually tested Edge Function with curl
- [ ] Checked Edge Function logs for success
- [ ] Verified push token registered in database
- [ ] Enabled push notifications in app
- [ ] Received test notification (optional)

---

## 🎉 You're Done!

Once you complete these steps, your push notification system is fully operational:

- ✅ Users will receive daily notifications for plants that need watering
- ✅ Notifications work even when the app is closed
- ✅ Users can customize notification time and timezone in Settings
- ✅ All notification attempts are logged for debugging

---

## 🆘 Troubleshooting

### "OneSignal not configured" in logs
- Make sure environment variables are set in Supabase Edge Functions
- Redeploy the function after adding secrets: `npx supabase functions deploy send-plant-notifications`

### "No active push tokens" in logs
- User needs to log into the app and allow push notifications
- Check `push_notification_tokens` table to verify token exists

### "No plants needing water" in logs
- This is expected if all plants are watered on schedule
- Create a test plant (see Step 6) to verify notifications work

### Notifications not received on device
- Check OneSignal dashboard for delivery status
- Verify device token is correct in `push_notification_tokens` table
- Ensure notification permissions are granted in device settings
- Check `notification_logs` table for error messages

---

## 📊 Monitoring

### Daily Health Check

Run this query to see notification activity:

```sql
SELECT
  DATE(sent_at) as date,
  status,
  COUNT(*) as count
FROM notification_logs
GROUP BY DATE(sent_at), status
ORDER BY date DESC
LIMIT 30;
```

### User Notification Preferences

See who has push notifications enabled:

```sql
SELECT
  COUNT(*) FILTER (WHERE push_notifications_enabled = true) as enabled,
  COUNT(*) FILTER (WHERE push_notifications_enabled = false) as disabled,
  COUNT(*) as total
FROM profiles;
```

---

**Need help?** Check the other documentation:
- [PUSH_NOTIFICATIONS_SETUP.md](./PUSH_NOTIFICATIONS_SETUP.md) - Complete technical guide
- [DEPLOYMENT_COMPLETE.md](./DEPLOYMENT_COMPLETE.md) - What was deployed
- [PUSH_NOTIFICATIONS_QUICK_START.md](./PUSH_NOTIFICATIONS_QUICK_START.md) - Quick reference

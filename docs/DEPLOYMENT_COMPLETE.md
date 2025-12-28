# 🎉 Push Notifications - Deployment Complete!

## ✅ What Was Deployed (via Supabase MCP)

### 1. Database Migration Applied
**Migration**: `add_push_notification_tokens`

**Tables Created**:
- ✅ `push_notification_tokens` - Stores device push tokens
  - Columns: id, user_id, token, device_type, device_name, created_at, updated_at, last_used_at, is_active
  - RLS enabled with proper policies
  - Unique constraint on (user_id, token)

- ✅ `notification_logs` - Tracks sent notifications
  - Columns: id, user_id, notification_type, plant_id, sent_at, status, error_message, metadata
  - RLS enabled with proper policies

**Profiles Table Updated**:
- ✅ `push_notifications_enabled` (boolean, default: true)
- ✅ `push_notification_time` (time, default: '09:00:00')
- ✅ `push_notification_timezone` (text, default: 'America/New_York')

**Database Objects Created**:
- ✅ Indexes for performance
- ✅ RLS policies for security
- ✅ Trigger function for `updated_at` column
- ✅ Table comments for documentation

### 2. Edge Function Deployed
**Function Name**: `send-plant-notifications`
**Version**: 1
**Status**: ACTIVE ✅
**JWT Verification**: Enabled

**What it does**:
- Queries all users with push notifications enabled
- Fetches plants using `plants_with_watering_info` view
- Calculates which plants need watering (overdue or due today)
- Sends push notifications via OneSignal
- Logs all notification attempts to `notification_logs`
- Updates token `last_used_at` timestamps

## 📋 Next Steps to Go Live

### 1. Set Up OneSignal (Required)

```bash
# 1. Sign up at https://onesignal.com (free)
# 2. Create a new app
# 3. Configure iOS and Android platforms
# 4. Get your credentials
```

### 2. Add Environment Variables to Supabase

In your Supabase Dashboard > Edge Functions > Secrets:

```bash
ONESIGNAL_APP_ID=your_app_id_here
ONESIGNAL_API_KEY=your_rest_api_key_here
```

### 3. Set Up Cron Job

Run this SQL in Supabase SQL Editor:

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

Replace `YOUR_SERVICE_ROLE_KEY` with your actual service role key from:
Supabase Dashboard > Project Settings > API > service_role (secret)

### 4. Configure Mobile Apps

**iOS (Xcode)**:
1. Open project in Xcode: `npx cap open ios`
2. Add "Push Notifications" capability
3. Add "Background Modes" → enable "Remote notifications"
4. Sync: `npx cap sync ios`

**Android**:
1. Add `google-services.json` to `android/app/`
2. Sync: `npx cap sync android`

### 5. Test the System

**Test Edge Function Manually**:
```bash
curl -X POST 'https://ufhjudswppdqupjbqbwm.supabase.co/functions/v1/send-plant-notifications' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'
```

**Check the logs**:
```sql
-- View recent notification logs
SELECT
  nl.*,
  p.first_name,
  up.nickname as plant_name
FROM notification_logs nl
JOIN profiles p ON nl.user_id = p.id
JOIN user_plants up ON nl.plant_id = up.id
ORDER BY nl.sent_at DESC
LIMIT 20;
```

**Verify push tokens**:
```sql
-- Check registered devices
SELECT
  pnt.device_type,
  pnt.device_name,
  pnt.is_active,
  pnt.created_at,
  p.first_name,
  p.push_notifications_enabled
FROM push_notification_tokens pnt
JOIN profiles p ON pnt.user_id = p.id
WHERE pnt.is_active = true;
```

## 🔍 Verification Checklist

- [x] Database migration applied successfully
- [x] New tables created with RLS
- [x] Profiles table updated with push preferences
- [x] Edge Function deployed and active
- [ ] OneSignal account created
- [ ] Environment variables configured
- [ ] Cron job scheduled
- [ ] iOS app configured for push
- [ ] Android app configured for push
- [ ] Tested on physical device
- [ ] Verified notification delivery

## 📊 Current Status

**Database**: ✅ Ready
**Edge Function**: ✅ Deployed
**Client Code**: ✅ Ready (already implemented)
**Settings UI**: ✅ Ready (already implemented)

**Pending**: OneSignal setup, environment variables, cron job

## 🆘 Troubleshooting

### Edge Function Logs
View logs in: Supabase Dashboard > Edge Functions > send-plant-notifications > Logs

### Database Queries

**Check if migration ran**:
```sql
SELECT * FROM information_schema.tables
WHERE table_name IN ('push_notification_tokens', 'notification_logs');
```

**Test notification logic**:
```sql
-- See which users would get notifications
SELECT
  p.id,
  p.first_name,
  p.push_notifications_enabled,
  COUNT(up.id) as plant_count
FROM profiles p
LEFT JOIN user_plants up ON p.id = up.user_id
WHERE p.push_notifications_enabled = true
GROUP BY p.id, p.first_name, p.push_notifications_enabled;
```

## 📚 Documentation

- **Setup Guide**: [PUSH_NOTIFICATIONS_SETUP.md](./PUSH_NOTIFICATIONS_SETUP.md)
- **Quick Start**: [PUSH_NOTIFICATIONS_QUICK_START.md](./PUSH_NOTIFICATIONS_QUICK_START.md)
- **Summary**: [PUSH_NOTIFICATIONS_SUMMARY.md](./PUSH_NOTIFICATIONS_SUMMARY.md)

## 🎓 What Happens When a User Logs In

1. User logs into app
2. `AuthContext` detects sign-in event
3. `pushNotificationService.initialize()` is called
4. App requests push notification permission
5. If granted, device token is registered
6. Token saved to `push_notification_tokens` table
7. User can customize settings in Settings > Notifications

## 🎯 How Daily Notifications Work

1. Cron job triggers Edge Function at 9 AM UTC
2. Function queries users with `push_notifications_enabled = true`
3. For each user:
   - Fetches plants from `plants_with_watering_info` view
   - Calculates watering schedule
   - Identifies overdue/due-today plants
   - Fetches active push tokens
   - Sends notification via OneSignal
   - Logs result to `notification_logs`
4. User receives notification on their device
5. Tapping notification opens app to My Plants page

## 💰 Cost

**Current**: $0/month (everything on free tiers)

**At Scale** (10K+ users):
- OneSignal: $9/month
- Supabase: $25/month (if needed)

---

**Deployed on**: December 27, 2025
**Project**: SproutHub (ufhjudswppdqupjbqbwm)
**Edge Function ID**: 08d47bd0-4d9b-4a37-8b76-6df9c1f3508c

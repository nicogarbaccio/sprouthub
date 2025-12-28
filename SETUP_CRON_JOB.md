# 🕐 Setting Up the Cron Job

## Summary

The Edge Function now supports **timezone-aware notifications** at 7 AM for each user!

### How It Works:

1. **Cron runs every hour** (to check all timezones)
2. **Edge Function checks each user's timezone**
3. **Only sends if it's 7 AM in their timezone**

---

## Deploy Updated Edge Function

The Edge Function has been updated with timezone checking. Deploy it:

### Option 1: Via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/ufhjudswppdqupjbqbwm/functions/send-plant-notifications
2. Click **Deploy new version**
3. Upload: `supabase/functions/send-plant-notifications/index.ts`

### Option 2: Via Supabase CLI (if you have it linked)

```bash
supabase functions deploy send-plant-notifications --project-ref ufhjudswppdqupjbqbwm
```

---

## Create the Cron Job

Run this SQL in Supabase SQL Editor:

```sql
-- Create hourly cron job to check for notifications
SELECT cron.schedule(
  'hourly-plant-notifications',
  '0 * * * *',  -- Every hour on the hour
  $$
  SELECT
    net.http_post(
      url := 'https://ufhjudswppdqupjbqbwm.supabase.co/functions/v1/send-plant-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

---

## Why Hourly?

The cron runs **every hour**, but the Edge Function intelligently:

1. Checks each user's `push_notification_timezone`
2. Calculates what time it is in their timezone
3. Only sends if it's between 7:00-7:59 AM in their local time

**Examples:**
- User in EST (America/New_York): Gets notification at 7 AM EST (12 PM UTC)
- User in PST (America/Los_Angeles): Gets notification at 7 AM PST (3 PM UTC)
- User in GMT (Europe/London): Gets notification at 7 AM GMT (7 AM UTC)

---

## Verify It's Working

### Check cron job was created:

```sql
SELECT * FROM cron.job WHERE jobname = 'hourly-plant-notifications';
```

### Check cron execution history:

```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'hourly-plant-notifications')
ORDER BY start_time DESC
LIMIT 10;
```

### Test it manually right now:

```bash
./test-notification.sh
```

Should return:
- If it's 7 AM in your timezone: `notifications_sent: 1`
- If it's NOT 7 AM: `notifications_sent: 0` (and log will say "not their notification time yet")

---

## Update Your Notification Time

Users can change their notification time and timezone in settings (once you build that UI):

```sql
UPDATE profiles
SET
  push_notification_time = '08:00:00',  -- 8 AM
  push_notification_timezone = 'America/Los_Angeles'  -- PST
WHERE id = 'your-user-id';
```

---

## Current Setup:

✅ Edge Function updated with timezone checking
✅ Default notification time: 7:00 AM
✅ Default timezone: America/New_York (EST)
⏳ Cron job: **Needs to be created** (run the SQL above)

---

## After Creating Cron:

The system will automatically:
- Run every hour
- Check all users
- Send notifications at 7 AM in each user's timezone
- Log all attempts to `notification_logs` table

🎉 Fully automated plant watering notifications!

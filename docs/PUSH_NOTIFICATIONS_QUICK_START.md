# Push Notifications - Quick Start Guide

## 🚀 TL;DR - Get Started in 5 Minutes

### 1. Run Database Migration
```bash
supabase db push
```

### 2. Sign Up for OneSignal
- Go to https://onesignal.com/
- Create free account
- Create new app
- Get your **App ID** and **REST API Key**

### 3. Deploy Edge Function
```bash
# Set environment variables in Supabase Dashboard
ONESIGNAL_APP_ID=your_app_id
ONESIGNAL_API_KEY=your_api_key

# Deploy function
supabase functions deploy send-plant-notifications
```

### 4. Set Up Daily Cron
Run this SQL in Supabase SQL Editor:

```sql
SELECT cron.schedule(
  'send-plant-notifications-daily',
  '0 9 * * *',  -- Daily at 9 AM UTC
  $$
  SELECT
    net.http_post(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-plant-notifications',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body:=jsonb_build_object()
    ) as request_id;
  $$
);
```

Replace `YOUR_PROJECT_REF` and `YOUR_SERVICE_ROLE_KEY` with your values.

### 5. Configure Mobile Apps

**iOS (Xcode):**
- Add "Push Notifications" capability
- Add "Background Modes" → "Remote notifications"
- Run: `npx cap sync ios`

**Android:**
- Add `google-services.json` to `android/app/`
- Run: `npx cap sync android`

### 6. Test It!
```bash
# Create a test plant that needs watering
# Then manually trigger the function:
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-plant-notifications' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'
```

---

## 📋 Checklist Before Production

- [ ] Database migration applied
- [ ] OneSignal account created and configured
- [ ] Edge Function deployed with credentials
- [ ] Cron job scheduled
- [ ] iOS push capability enabled
- [ ] Android Firebase configured
- [ ] Tested on physical devices
- [ ] Settings UI working

---

## 🎯 What's Already Done

✅ **Database schema** - Migration created\
✅ **Edge Function** - Server-side notification logic\
✅ **Client service** - Auto-initializes on login\
✅ **Settings UI** - User controls for time/timezone\
✅ **Type definitions** - Full TypeScript support\
✅ **Documentation** - Complete setup guides

---

## 💰 Cost Breakdown

**Free Tier (0-10K users):**
- OneSignal: Free
- Supabase Edge Functions: Free (500K invocations/month)
- Daily cron: ~30 invocations/month

**Total: $0/month** 🎉

**Paid Tier (10K+ users):**
- OneSignal: $9/month
- Supabase: $25/month (if needed)

---

## 📚 Full Documentation

- **Complete Guide**: [PUSH_NOTIFICATIONS_SETUP.md](./PUSH_NOTIFICATIONS_SETUP.md)
- **Overview**: [PUSH_NOTIFICATIONS_SUMMARY.md](./PUSH_NOTIFICATIONS_SUMMARY.md)
- **Main README**: [../README.md](../README.md#notification-system)

---

## 🆘 Common Issues

**"Push notifications not supported"**
- Web: Use HTTPS (not HTTP)
- iOS: Enable capability in Xcode
- Android: Add google-services.json

**"Permission denied"**
- User must allow in system settings
- Check Settings > [Your App] > Notifications

**"Notifications not received"**
- Check `notification_logs` table
- Verify Edge Function logs
- Ensure `push_notifications_enabled = true` in profiles
- Confirm plants actually need watering

---

## 🔗 Quick Links

- [OneSignal Dashboard](https://onesignal.com/login)
- [Supabase Dashboard](https://app.supabase.com/)
- [Edge Function Logs](https://app.supabase.com/project/_/functions)
- [Database Editor](https://app.supabase.com/project/_/editor)

---

## 🎓 How It Works (Simple)

```
User logs in
    ↓
Device token saved
    ↓
Cron runs daily at 9 AM UTC
    ↓
Edge Function checks plants
    ↓
OneSignal sends notifications
    ↓
User gets reminder on phone!
```

---

**Questions?** See the full documentation linked above or check the troubleshooting section in [PUSH_NOTIFICATIONS_SETUP.md](./PUSH_NOTIFICATIONS_SETUP.md).

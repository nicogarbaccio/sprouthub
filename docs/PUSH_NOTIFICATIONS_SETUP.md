# Push Notifications Setup Guide

This guide explains how to set up and deploy the server-side push notification system for SproutHub.

## Overview

The push notification system consists of:

1. **Database Schema** - Tables for storing push tokens and notification logs
2. **Supabase Edge Function** - Server-side function that checks plants and sends notifications
3. **Client-side Service** - Capacitor plugin for registering devices and receiving notifications
4. **Push Notification Provider** - OneSignal (or FCM/APNS) for delivering notifications

## Architecture

```
┌─────────────────────┐
│   Mobile/Web App    │
│  (Capacitor App)    │
└──────────┬──────────┘
           │ Register Token
           ▼
┌─────────────────────┐
│  Supabase Database  │
│ push_notification_  │
│      tokens         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Supabase Cron      │ ◄── Runs Daily
│  (Edge Function)    │
└──────────┬──────────┘
           │ Check Plants
           │ Send Notifications
           ▼
┌─────────────────────┐
│    OneSignal API    │
│  (Push Provider)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   User's Device     │
│  (iOS/Android/Web)  │
└─────────────────────┘
```

## Step 1: Run Database Migration

Apply the database migration to create the necessary tables:

```bash
# If using Supabase CLI locally
supabase db push

# Or apply the migration directly in Supabase Dashboard
# Go to SQL Editor and run: migrations/20251227_add_push_notification_tokens.sql
```

This creates:
- `push_notification_tokens` - Stores device tokens
- `notification_logs` - Tracks sent notifications
- `profiles` columns - `push_notifications_enabled`, `push_notification_time`, `push_notification_timezone`

## Step 2: Set Up Push Notification Provider

You have several options for the push notification provider:

### Option A: OneSignal (Recommended - Free Tier Available)

1. **Create OneSignal Account**
   - Go to https://onesignal.com/
   - Create a free account
   - Create a new app

2. **Configure Platforms**
   - **iOS**: Upload your iOS Push Certificate (.p12 file)
   - **Android**: Add your Firebase Server Key
   - **Web**: Configure web push settings

3. **Get API Credentials**
   - Navigate to Settings > Keys & IDs
   - Copy your `App ID` and `REST API Key`

### Option B: Firebase Cloud Messaging (FCM)

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Cloud Messaging
3. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
4. Get your Server Key from Project Settings > Cloud Messaging

### Option C: Native iOS/Android (Advanced)

For native push notifications without a third-party service, you'll need to:
- Set up Apple Push Notification Service (APNS) certificates
- Configure Firebase Cloud Messaging for Android
- Modify the Edge Function to send directly to APNS/FCM

## Step 3: Deploy Supabase Edge Function

1. **Set Environment Variables**

   In your Supabase project dashboard, go to Settings > Edge Functions and add:

   ```bash
   ONESIGNAL_APP_ID=your_app_id_here
   ONESIGNAL_API_KEY=your_rest_api_key_here
   ```

2. **Deploy the Function**

   ```bash
   # Using Supabase CLI
   supabase functions deploy send-plant-notifications

   # Or use the Supabase Dashboard
   # Copy the contents of supabase/functions/send-plant-notifications/index.ts
   # and paste it in the Edge Functions section
   ```

3. **Test the Function**

   Test manually first before setting up cron:

   ```bash
   curl -L -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-plant-notifications' \
     -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
     --data '{}'
   ```

## Step 4: Set Up Cron Schedule

Configure a cron job to run the Edge Function daily:

### Option A: Supabase Cron (Recommended)

Add to your Supabase project using SQL:

```sql
-- Run daily at 9 AM UTC
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

**Note**: The function will send notifications to users at their preferred local time by checking the `push_notification_time` and `push_notification_timezone` columns.

### Option B: GitHub Actions (Alternative)

Create `.github/workflows/plant-notifications.yml`:

```yaml
name: Send Plant Notifications

on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  send-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -L -X POST '${{ secrets.SUPABASE_URL }}/functions/v1/send-plant-notifications' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}' \
            --data '{}'
```

## Step 5: Configure Mobile Apps

### iOS Configuration

1. **Enable Push Notifications Capability**

   In Xcode:
   - Select your project target
   - Go to Signing & Capabilities
   - Click "+ Capability"
   - Add "Push Notifications"
   - Add "Background Modes" and enable "Remote notifications"

2. **Update `ios/App/App/Info.plist`**

   If using OneSignal, add:

   ```xml
   <key>OneSignal_AppId</key>
   <string>YOUR_ONESIGNAL_APP_ID</string>
   ```

3. **Run Capacitor Sync**

   ```bash
   npx cap sync ios
   ```

### Android Configuration

1. **Add Google Services**

   Place `google-services.json` in `android/app/`

2. **Update `android/app/build.gradle`**

   ```gradle
   dependencies {
       // ... other dependencies
       implementation 'com.google.firebase:firebase-messaging:23.0.0'
   }
   ```

3. **Run Capacitor Sync**

   ```bash
   npx cap sync android
   ```

### Web Configuration (PWA)

For web push notifications, you need:

1. **Create `firebase-messaging-sw.js` in `/public`**

   ```javascript
   importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
   importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

   firebase.initializeApp({
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   });

   const messaging = firebase.messaging();
   ```

2. **Update `vite.config.ts`** to include the service worker

## Step 6: Test the System

### 1. Test Device Registration

1. Log in to the app
2. Check browser console for: `"Push notifications initialized successfully"`
3. Verify in Supabase database:
   ```sql
   SELECT * FROM push_notification_tokens WHERE user_id = 'YOUR_USER_ID';
   ```

### 2. Test Notification Delivery

1. Create a test plant that needs watering:
   ```sql
   UPDATE user_plants
   SET last_watered = NOW() - INTERVAL '10 days',
       suggested_watering_days = 7
   WHERE user_id = 'YOUR_USER_ID';
   ```

2. Manually trigger the Edge Function:
   ```bash
   curl -L -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-plant-notifications' \
     -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'
   ```

3. Check notification logs:
   ```sql
   SELECT * FROM notification_logs WHERE user_id = 'YOUR_USER_ID' ORDER BY sent_at DESC;
   ```

### 3. Test Settings UI

1. Go to Settings > Notifications tab
2. Verify you can see the Push Notifications card
3. Toggle push notifications on/off
4. Change notification time and timezone
5. Check the changes persist in the database

## Monitoring & Debugging

### View Notification Logs

```sql
SELECT
  nl.sent_at,
  nl.notification_type,
  nl.status,
  up.common_name,
  p.first_name,
  nl.error_message
FROM notification_logs nl
LEFT JOIN user_plants up ON nl.plant_id = up.id
LEFT JOIN profiles p ON nl.user_id = p.id
ORDER BY nl.sent_at DESC
LIMIT 50;
```

### Check Active Push Tokens

```sql
SELECT
  pnt.device_type,
  pnt.device_name,
  pnt.created_at,
  pnt.last_used_at,
  p.first_name,
  p.email
FROM push_notification_tokens pnt
JOIN profiles p ON pnt.user_id = p.id
WHERE pnt.is_active = true
ORDER BY pnt.created_at DESC;
```

### View Edge Function Logs

In Supabase Dashboard:
1. Go to Edge Functions
2. Select `send-plant-notifications`
3. Click on "Logs" tab
4. Filter by time range and log level

## Cost Considerations

### OneSignal Pricing
- **Free Tier**: Up to 10,000 subscribers, unlimited notifications
- **Growth Plan**: $9/month for up to 100,000 subscribers
- Perfect for initial launch

### Supabase Pricing
- **Free Tier**: 500,000 Edge Function invocations/month
- **Pro Plan**: $25/month for 2 million invocations
- With daily cron: 30 invocations/month (well within free tier)

### Alternative: Direct APNS/FCM
- **Free**: Unlimited notifications
- **Complexity**: Requires managing certificates and more complex code
- **Recommended for**: Large-scale apps with >100k users

## Security Best Practices

1. **Never commit API keys** - Use environment variables
2. **Validate tokens** - The Edge Function already checks user authentication
3. **Rate limiting** - OneSignal handles this automatically
4. **RLS policies** - Already configured in migration for `push_notification_tokens`
5. **Token rotation** - Tokens are automatically updated when users re-register

## Troubleshooting

### "Push notifications not supported"
- **Web**: Ensure you're using HTTPS (not HTTP)
- **iOS**: Check that Push Notifications capability is enabled
- **Android**: Verify `google-services.json` is in the correct location

### "Permission denied"
- **iOS**: User must allow in system settings (Settings > SproutHub > Notifications)
- **Web**: User must click "Allow" on browser prompt
- **Android**: Check notification permissions in app settings

### "Notifications not received"
- Check `notification_logs` table for errors
- Verify Edge Function logs in Supabase dashboard
- Ensure user has `push_notifications_enabled = true` in profiles
- Check that user's plants actually need watering
- Verify OneSignal credentials are correct in Edge Function environment

### "Token registration failed"
- Check browser/app console for errors
- Verify Supabase RLS policies allow token insertion
- Ensure user is authenticated when calling `pushNotificationService.initialize()`

## Future Enhancements

1. **Smart Scheduling** - Send notifications based on user's typical app usage patterns
2. **Rich Notifications** - Include plant images in push notifications
3. **Action Buttons** - "Mark as watered" directly from notification
4. **Geofencing** - Remind users when they arrive home
5. **Plant-specific reminders** - Different times for indoor vs outdoor plants
6. **Multi-language support** - Localized notification messages

## Files Reference

- **Migration**: `/migrations/20251227_add_push_notification_tokens.sql`
- **Edge Function**: `/supabase/functions/send-plant-notifications/index.ts`
- **Client Service**: `/src/services/pushNotificationService.ts`
- **Auth Integration**: `/src/contexts/AuthContext.tsx`
- **Settings UI**: `/src/components/settings/PushNotificationSettings.tsx`
- **Database Types**: `/src/integrations/supabase/types.ts`

## Support

For issues or questions:
1. Check Supabase Edge Function logs
2. Review `notification_logs` table
3. Verify OneSignal dashboard for delivery status
4. Check device/browser notification permissions

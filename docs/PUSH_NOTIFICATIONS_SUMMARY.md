# Push Notifications - Implementation Summary

## What Changed

The notification system has been upgraded from **polling-based in-app notifications** to **server-side push notifications** that work even when the app is closed.

## Benefits

✅ **Instant Notifications** - No more waiting for the app to check\
✅ **Background Delivery** - Notifications work even when app is closed\
✅ **Battery Efficient** - No constant polling or background processes\
✅ **App Store Ready** - Uses standard push notification practices\
✅ **Reliable** - Server-side scheduling ensures notifications are sent\
✅ **Customizable** - Users can set their preferred notification time

## Quick Start

### For Development

1. **Run the database migration**:
   ```bash
   # Apply the migration to add push notification tables
   supabase db push
   ```

2. **Install dependencies** (already done):
   ```bash
   npm install @capacitor/push-notifications
   ```

3. **Test locally**:
   - Log into the app
   - Push notifications will auto-initialize
   - Check Settings > Notifications to configure

### For Production Deployment

Follow the complete guide: [`PUSH_NOTIFICATIONS_SETUP.md`](./PUSH_NOTIFICATIONS_SETUP.md)

**Required steps**:
1. Set up OneSignal account (or FCM/APNS)
2. Deploy Supabase Edge Function
3. Configure cron job for daily notifications
4. Configure mobile app platforms (iOS/Android)

## File Changes

### New Files Created

| File | Purpose |
|------|---------|
| [`migrations/20251227_add_push_notification_tokens.sql`](../migrations/20251227_add_push_notification_tokens.sql) | Database schema for push tokens |
| [`supabase/functions/send-plant-notifications/index.ts`](../supabase/functions/send-plant-notifications/index.ts) | Edge Function that sends notifications |
| [`src/services/pushNotificationService.ts`](../src/services/pushNotificationService.ts) | Client-side push notification service |
| [`src/components/settings/PushNotificationSettings.tsx`](../src/components/settings/PushNotificationSettings.tsx) | Settings UI for push notifications |
| [`docs/PUSH_NOTIFICATIONS_SETUP.md`](./PUSH_NOTIFICATIONS_SETUP.md) | Complete deployment guide |

### Modified Files

| File | Change |
|------|--------|
| [`src/contexts/AuthContext.tsx`](../src/contexts/AuthContext.tsx) | Auto-initialize push notifications on login |
| [`src/integrations/supabase/types.ts`](../src/integrations/supabase/types.ts) | Added types for new tables |
| [`src/components/settings/NotificationsTab.tsx`](../src/components/settings/NotificationsTab.tsx) | Added push notification settings UI |
| [`package.json`](../package.json) | Added `@capacitor/push-notifications@^7.0.4` |

## How It Works

```
1. User logs into app
   ↓
2. Push notification service initializes
   ↓
3. Device token registered in database
   ↓
4. Supabase Cron runs daily (9 AM UTC by default)
   ↓
5. Edge Function checks all users' plants
   ↓
6. For plants needing water, sends push notification
   ↓
7. OneSignal delivers to user's device
   ↓
8. User receives notification even when app is closed!
```

## Database Schema

### New Tables

**`push_notification_tokens`** - Stores device push tokens
```sql
- id (uuid)
- user_id (uuid, foreign key)
- token (text) - Device FCM/APNS token
- device_type (enum: ios/android/web)
- device_name (text)
- is_active (boolean)
- created_at, updated_at, last_used_at (timestamps)
```

**`notification_logs`** - Tracks sent notifications (for debugging)
```sql
- id (uuid)
- user_id (uuid, foreign key)
- notification_type (text)
- plant_id (uuid, foreign key)
- sent_at (timestamp)
- status (enum: sent/failed/skipped)
- error_message (text, nullable)
- metadata (jsonb)
```

### Updated Table

**`profiles`** - Added push notification preferences
```sql
+ push_notifications_enabled (boolean, default true)
+ push_notification_time (time, default '09:00:00')
+ push_notification_timezone (text, default 'America/New_York')
```

## User Experience

### Settings UI

Users can now control:
- ✅ Enable/disable push notifications
- 🕐 Choose daily notification time (6 AM - 8 PM)
- 🌍 Set their timezone
- 📱 See permission status

### Notification Flow

1. **First Login**: App requests push notification permission
2. **Permission Granted**: Device token saved to database
3. **Daily Reminder**: User receives notification at their preferred time
4. **Tap Notification**: Opens app to My Plants page
5. **Settings**: User can customize time/timezone anytime

## Next Steps

### Before App Store Submission

1. ✅ Run database migration
2. ⚠️ Set up OneSignal account (or FCM)
3. ⚠️ Deploy Edge Function with API credentials
4. ⚠️ Configure cron job for daily execution
5. ⚠️ Test on physical iOS/Android devices
6. ⚠️ Configure app certificates (iOS) and Firebase (Android)
7. ✅ Verify Settings UI works correctly

### Testing Checklist

- [ ] User can enable/disable push notifications
- [ ] Permission prompt appears correctly
- [ ] Device token saved to database
- [ ] Edge Function runs successfully
- [ ] Notifications delivered to device
- [ ] Tapping notification opens app
- [ ] Settings persist across sessions
- [ ] Multiple devices for same user work
- [ ] Sign out removes device token

## Cost Estimate

For initial launch (< 10,000 users):

- **OneSignal**: Free tier (10K subscribers)
- **Supabase Edge Functions**: Free tier (500K invocations/month)
- **Daily Cron**: 30 invocations/month (well within limits)

**Total Monthly Cost**: **$0** 🎉

As you scale past 10K users:
- OneSignal Growth: ~$9/month
- Supabase Pro: $25/month (if needed for other features)

## Alternative Approaches

If you prefer not to use OneSignal, you can:

1. **Use FCM directly** (free, more setup)
   - Modify Edge Function to call FCM API
   - Requires Firebase project setup
   - Good for Android-first apps

2. **Use APNS directly** (free, iOS only, complex)
   - Requires managing certificates
   - Best for iOS-only apps
   - Most complex setup

3. **Hybrid approach**
   - FCM for Android
   - APNS for iOS
   - Web Push for PWA
   - Most flexibility, most setup

**Recommendation**: Start with OneSignal for simplicity, migrate to FCM/APNS later if needed.

## Migration from Old System

The old polling-based notification system (`usePlantNotifications.ts`) still works for in-app notifications. The new push notification system **complements** it by adding background notifications.

**Recommendation**: Keep both systems:
- **Push Notifications**: Daily reminders when app is closed
- **In-App Notifications**: Instant updates while app is open

## Support & Troubleshooting

See [`PUSH_NOTIFICATIONS_SETUP.md`](./PUSH_NOTIFICATIONS_SETUP.md) for:
- Detailed deployment steps
- Platform-specific configuration
- Troubleshooting common issues
- Monitoring and debugging queries
- Security best practices

## Questions?

- **How do I test locally?** - Follow Step 3 in setup guide to test the Edge Function
- **Do I need OneSignal?** - No, but it's the easiest option. See alternatives above
- **What about web push?** - Supported via Firebase Cloud Messaging (requires additional setup)
- **Can users opt-out?** - Yes, via Settings > Notifications
- **Does this work offline?** - Notifications are delivered even when offline, but require internet to display

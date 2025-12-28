# 🧪 Test Push Notifications - Step by Step

I've just updated the code to use OneSignal's Web SDK for browser testing!

## Step 1: Restart Your Dev Server

```bash
# Stop your current dev server (Ctrl+C)
npm run dev
```

## Step 2: Log Out and Log Back In

1. Open http://localhost:8080 (or your dev URL)
2. **Log out** if you're currently logged in
3. **Log in** again with your credentials (garbaccio20@gmail.com)

## Step 3: Watch the Browser Console

Open your browser's Developer Tools (F12 or Cmd+Option+I on Mac) and look for these messages:

✅ `"Initializing OneSignal Web Push..."`
✅ `"Requesting push notification permission..."`
✅ Browser will show a permission prompt - **Click "Allow"**
✅ `"Push notification permission granted!"`
✅ `"OneSignal Player ID: [some-id]"`
✅ `"✅ Push token saved to database successfully!"`

## Step 4: Verify Token Was Saved

Run this in Supabase SQL Editor:

```sql
SELECT
  pnt.token,
  pnt.device_type,
  pnt.device_name,
  pnt.is_active,
  pnt.created_at,
  p.first_name
FROM push_notification_tokens pnt
JOIN profiles p ON pnt.user_id = p.id
WHERE pnt.is_active = true
ORDER BY pnt.created_at DESC;
```

You should see a row with `device_type: 'web'` and your OneSignal Player ID!

## Step 5: Test the Notification

Now run the test script:

```bash
./test-notification.sh
```

Enter your service role key when prompted.

## Step 6: Check for the Notification

You should receive a browser notification:

**Title**: 🚨 Overdue Plant Watering
**Message**: 🧪 Test Thirsty Plant is overdue for watering!

## Troubleshooting

### "Push notifications not supported on this platform"
- Make sure you're using HTTPS or localhost
- Check that notifications are enabled in your browser settings

### No permission prompt appears
- Check browser console for errors
- Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
- Clear browser cache and reload

### Permission prompt blocked
- Look for a blocked notification icon in your browser's address bar
- Click it and allow notifications
- Refresh the page and log in again

### Still not working?
Check the browser console for error messages and let me know what you see!

---

## Expected Flow

1. **Log in** → OneSignal initializes
2. **Permission prompt** → You click "Allow"
3. **Token saved** → Check database to confirm
4. **Run test script** → Edge Function sends notification
5. **Receive notification** → Browser shows push notification!

---

## Clean Up After Testing

```sql
-- Remove test plant
DELETE FROM user_plants WHERE nickname = '🧪 Test Thirsty Plant';

-- View notification logs
SELECT * FROM notification_logs ORDER BY sent_at DESC LIMIT 5;
```

---

**Ready?** Restart your dev server and log in! 🚀

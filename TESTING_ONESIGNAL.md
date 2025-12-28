# 🧪 Testing OneSignal Integration

I've just made several critical improvements to fix the OneSignal registration issue:

## What Changed

### 1. Added OneSignal SDK to index.html
**File**: [index.html](index.html#L64)
- Previously: SDK was loaded dynamically (unreliable timing)
- Now: SDK loads directly via script tag (guaranteed to be available)

### 2. Improved OneSignal Service Logging
**File**: [src/services/oneSignalWebService.ts](src/services/oneSignalWebService.ts)
- Added `[OneSignal]` prefix to all logs for easy filtering
- Added step-by-step logging for debugging
- Better error messages with specific instructions

### 3. Better SDK Loading Detection
- Now waits up to 10 seconds for SDK to load
- Clearer error messages if SDK fails to load

## How to Test

### Step 1: Rebuild and Restart Dev Server

```bash
# Stop current dev server (Ctrl+C)

# Restart dev server
npm run dev
```

**Why?** The index.html change requires a fresh build.

---

### Step 2: Clear Browser State

**Important**: You must clear everything OneSignal-related:

1. Open DevTools (F12 or Cmd+Option+I)
2. Go to **Application** tab
3. Clear:
   - **Local Storage** → Delete all OneSignal entries
   - **Service Workers** → Unregister OneSignal workers
   - **Cache Storage** → Clear all caches
4. Go to **Console** tab
5. Click **Clear console** (🚫 icon)

**Or just open in Incognito/Private mode for a clean test!**

---

### Step 3: Filter Console for OneSignal

In the Console tab, use the filter box to show only relevant logs:

```
[OneSignal]
```

This will hide all the Dashlane noise and show only OneSignal logs.

---

### Step 4: Log Out and Log Back In

1. Log out of SproutHub
2. Log back in with your credentials
3. Watch the console

---

### Step 5: What You Should See

#### ✅ **Success Path:**

```
[OneSignal] Initializing OneSignal Web Push...
[OneSignal] App ID: 5db8206d-53e2-4cfc-a001-a97f630bafc1
[OneSignal] Waiting for SDK to load...
[OneSignal] ✅ SDK loaded!
[OneSignal] Calling OneSignal.init...
[OneSignal] ✅ Initialized successfully!
[OneSignal] Permission status: default
[OneSignal] Requesting permission...
```

**At this point, you should see a browser permission popup:**
- Click **"Allow"**

**Then you should see:**
```
[OneSignal] ✅ Permission granted!
[OneSignal] Registering device...
[OneSignal] User ID: 7985e7bf-31ba-4f66-ac0f-1d67bee53072
[OneSignal] ✅ Player ID: abc123-def456-ghi789...
[OneSignal] Saving token to database...
[OneSignal] ✅✅✅ Push token saved to database successfully!
[OneSignal] You should now appear in OneSignal dashboard!
```

🎉 **If you see this, you're done!** Go check the OneSignal dashboard - you should see yourself!

---

#### ❌ **Error Paths:**

##### Error 1: SDK Not Loading
```
[OneSignal] ❌ SDK failed to load after 10 seconds
```
**Fix**:
- Make sure you rebuilt (npm run dev stopped and restarted)
- Check Network tab - is OneSignalSDK.page.js loading?
- Try clearing cache and hard reload (Cmd+Shift+R)

##### Error 2: App ID Missing
```
[OneSignal] ❌ App ID not found in environment variables
```
**Fix**:
- Check `.env.local` has `VITE_ONESIGNAL_APP_ID=5db8206d-53e2-4cfc-a001-a97f630bafc1`
- Restart dev server

##### Error 3: No Player ID
```
[OneSignal] ❌ No Player ID found
```
**Fix**:
- Permission might have been denied
- Check permission status: `await OneSignal.Notifications.permission`
- If "denied", you need to reset site permissions in browser settings

##### Error 4: Database Error
```
[OneSignal] ❌ Error saving push token: ...
```
**Fix**:
- Check the error details
- Might be RLS policy issue - verify you're logged in
- Check Supabase logs

---

### Step 6: Verify in Database

Run this SQL in Supabase SQL Editor:

```sql
SELECT
  token,
  device_type,
  device_name,
  is_active,
  created_at
FROM push_notification_tokens
WHERE user_id = '7985e7bf-31ba-4f66-ac0f-1d67bee53072';
```

You should see:
```
token: abc123-def456-... (your Player ID)
device_type: web
device_name: Web (MacIntel) or similar
is_active: true
created_at: (current timestamp)
```

---

### Step 7: Check OneSignal Dashboard

1. Go to: https://dashboard.onesignal.com/
2. Click your **SproutHub** app
3. Go to **Audience** → **Subscriptions**
4. You should now see **1 subscription** (you!)
5. Click on it to see your Player ID

---

### Step 8: Test Notification

Now that your token is registered, test the full flow:

```bash
./test-notification.sh
```

**Expected output:**
```json
{
  "success": true,
  "notifications_sent": 1,  ← Should be 1 now!
  "notifications_failed": 0,
  "users_processed": 101
}
```

**And you should receive a notification!** 🎉

---

## Alternative: Standalone Test Page

If the main app still isn't working, use the standalone test page:

1. Make sure dev server is running
2. Open: http://localhost:8080/test-onesignal.html
3. Click "Request Permission"
4. Check if you get subscribed

This will help isolate whether the issue is with OneSignal itself or the React integration.

---

## Common Issues

### "Permission denied" and can't reset

**Chrome/Edge:**
1. Click the 🔒 icon in address bar
2. Find "Notifications"
3. Change from "Block" to "Ask" or "Allow"
4. Reload page

**Firefox:**
1. Click the 🔒 icon in address bar
2. Click "Clear cookies and site data"
3. Reload page

**Safari:**
1. Safari → Settings → Websites → Notifications
2. Find localhost:8080
3. Change to "Allow"
4. Reload page

---

### Service Worker Not Updating

```bash
# In DevTools Console:
await navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister())
})
```

Then reload.

---

### Still Not Working?

Share these specific pieces of information:

1. **Full console output** (filtered by `[OneSignal]`)
2. **Browser and version** (e.g., Chrome 120)
3. **Any permission popups** you saw
4. **Network tab** - did OneSignalSDK.page.js load? (200 status?)
5. **OneSignal dashboard** - do you see any subscriptions?

---

## Success Criteria

✅ Console shows all success messages
✅ Browser permission granted
✅ Player ID appears in console
✅ Token saved to database
✅ You appear in OneSignal dashboard
✅ `./test-notification.sh` sends a notification
✅ You receive the notification

Once all these are ✅, the system is fully working! 🚀

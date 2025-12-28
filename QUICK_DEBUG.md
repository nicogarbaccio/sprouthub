# 🔍 Quick Debug Reference

## Console Filter

In DevTools Console, type this in the filter box:
```
[OneSignal]
```

This hides all the Dashlane noise.

---

## Expected Flow (Happy Path)

```
1. [OneSignal] Initializing OneSignal Web Push...
2. [OneSignal] App ID: 5db8206d-...
3. [OneSignal] Waiting for SDK to load...
4. [OneSignal] ✅ SDK loaded!
5. [OneSignal] Calling OneSignal.init...
6. [OneSignal] ✅ Initialized successfully!
7. [OneSignal] Permission status: default
8. [OneSignal] Requesting permission...
   → BROWSER POPUP: "Allow notifications?"
   → YOU CLICK: "Allow"
9. [OneSignal] ✅ Permission granted!
10. [OneSignal] Registering device...
11. [OneSignal] User ID: 7985e7bf-...
12. [OneSignal] ✅ Player ID: abc123-...
13. [OneSignal] Saving token to database...
14. [OneSignal] ✅✅✅ Push token saved to database successfully!
15. [OneSignal] You should now appear in OneSignal dashboard!
```

**Total time**: ~2-5 seconds

---

## What Could Go Wrong?

### ❌ Stuck at Step 3 (SDK not loading)
```
[OneSignal] Waiting for SDK to load...
(then timeout or error)
```

**Diagnosis**:
- Dev server not restarted after index.html change
- Network issue blocking OneSignal CDN
- Browser extension blocking script

**Fix**:
```bash
# Stop dev server (Ctrl+C)
npm run dev
```

Check Network tab - is `OneSignalSDK.page.js` loading?

---

### ❌ Permission Popup Blocked
```
[OneSignal] ✅ Initialized successfully!
[OneSignal] Permission status: denied
```

**Diagnosis**:
- You previously denied permission
- Browser blocked the popup

**Fix**:
1. Click 🔒 in address bar
2. Find "Notifications"
3. Change to "Allow" or "Ask"
4. Reload page

---

### ❌ No Player ID
```
[OneSignal] ✅ Permission granted!
[OneSignal] Registering device...
[OneSignal] User ID: ...
[OneSignal] ❌ No Player ID found
```

**Diagnosis**:
- OneSignal didn't create subscription yet
- Service worker not registered

**Fix**:
```javascript
// In console:
await navigator.serviceWorker.getRegistrations()
// Should show OneSignal worker

// If empty, check for errors in console
```

---

### ❌ Database Error
```
[OneSignal] Saving token to database...
[OneSignal] ❌ Error saving push token: ...
```

**Diagnosis**:
- RLS policy blocking insert
- User not authenticated
- Database table missing

**Fix**:
Check the actual error message - it will tell you exactly what's wrong.

---

## Quick Checks

### Is OneSignal SDK loaded?
```javascript
// In browser console:
window.OneSignal
// Should return: Object { ... }
// NOT undefined
```

### What's my permission status?
```javascript
// In browser console:
await OneSignal.Notifications.permission
// "granted" ✅
// "denied" ❌
// "default" ⏳ (need to ask)
```

### What's my Player ID?
```javascript
// In browser console:
await OneSignal.User.PushSubscription.id
// Should return: "abc123-def456-..."
```

### Is my token in the database?
```sql
-- In Supabase SQL Editor:
SELECT * FROM push_notification_tokens
WHERE user_id = '7985e7bf-31ba-4f66-ac0f-1d67bee53072';
```

### Do I appear in OneSignal?
https://dashboard.onesignal.com/
→ SproutHub
→ Audience
→ Subscriptions
→ Should see 1 user

---

## One-Line Test

After logging in, run this in browser console:

```javascript
await OneSignal.User.PushSubscription.id
```

**If you get a Player ID**: OneSignal is working, check if it saved to database
**If you get `undefined`**: OneSignal subscription failed, check permission
**If you get error**: OneSignal not initialized, check `[OneSignal]` logs

---

## Full System Test

```bash
./test-notification.sh
```

**Success**:
```json
{ "notifications_sent": 1 }
```
+ You receive notification

**Failure**:
```json
{ "notifications_sent": 0 }
```
+ No notification received
= Token not in database

---

## Report Issues

If it's not working, share:

1. **All `[OneSignal]` console logs** (copy/paste)
2. **Browser/version** (e.g., Chrome 120)
3. **Result of**: `await OneSignal.User.PushSubscription.id`
4. **Network tab**: Did `OneSignalSDK.page.js` load? (screenshot or status code)

This will let me pinpoint the exact issue immediately.

# 🚀 Pre-Deployment Checklist - Push Notifications

## Before Deploying to Production:

### ✅ Already Complete:
- [x] OneSignal SDK integrated
- [x] Edge Function deployed with timezone support
- [x] Cron job created (runs hourly)
- [x] Database migrations applied
- [x] Push notifications working in development
- [x] Double initialization fix applied
- [x] Test plant deleted

---

### ⚠️ IMPORTANT: Update OneSignal Production Settings

**Current Status**: OneSignal is configured with "Local Testing" enabled for localhost.

**Before deploying to production, you MUST:**

1. **Go to**: https://dashboard.onesignal.com/ → Your SproutHub App → Settings → Platforms → Web Push

2. **Update Site URL**:
   - Change from: `http://localhost:8080`
   - Change to: `https://your-production-domain.com`
   - Example: `https://sprouthub.netlify.app` or your custom domain

3. **Disable Local Testing**:
   - Turn OFF the "Local Testing" toggle (only needed for localhost)

4. **Important**: Keep the same App ID and API Key (already in your .env)

---

### 🔐 Environment Variables

Make sure these are set in **Netlify** (or your production host):

```bash
# In Netlify Environment Variables:
VITE_ONESIGNAL_APP_ID=5db8206d-53e2-4cfc-a001-a97f630bafc1
VITE_ONESIGNAL_API_KEY=os_v2_app_lw4ca3kt4jgpziabvf7wgc5pygp47acrmmae5vubrlv5fp2i5miavqre73acywjktklsfwsniz5glbvwnxdaididi6r5jytiyu4neoq
```

Make sure these are also in **Supabase Edge Function Secrets**:
- `ONESIGNAL_APP_ID`
- `ONESIGNAL_API_KEY`

(Already done ✓)

---

### 📱 OneSignal Service Worker

Make sure `/public/OneSignalSDKWorker.js` is deployed:
- [x] File exists: `/public/OneSignalSDKWorker.js`
- [x] Will be served at: `https://your-domain.com/OneSignalSDKWorker.js`

---

### 🧪 Test After Deployment:

1. **Deploy to production**
2. **Visit your production site**
3. **Log in** - you should get permission prompt
4. **Allow notifications**
5. **Check OneSignal dashboard** - you should see 1 subscription
6. **Run manual test**:
   ```bash
   # Update the URL to production:
   curl -X POST https://ufhjudswppdqupjbqbwm.supabase.co/functions/v1/send-plant-notifications \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json"
   ```

---

### 📊 Monitor After Deployment:

**Check these regularly:**

1. **Cron job execution**:
   ```sql
   SELECT * FROM cron.job_run_details
   WHERE jobid = 1
   ORDER BY start_time DESC
   LIMIT 10;
   ```

2. **Notification logs**:
   ```sql
   SELECT
     sent_at,
     notification_type,
     status,
     error_message
   FROM notification_logs
   ORDER BY sent_at DESC
   LIMIT 20;
   ```

3. **Active tokens**:
   ```sql
   SELECT
     COUNT(*) as total_tokens,
     COUNT(DISTINCT user_id) as unique_users,
     device_type
   FROM push_notification_tokens
   WHERE is_active = true
   GROUP BY device_type;
   ```

---

### 🐛 Known Issues / Limitations:

- **Web push only works on HTTPS** (not HTTP in production)
- **Safari on iOS doesn't support web push** (need native app for iOS)
- **Users must grant permission** (can't send without permission)
- **Notifications only sent at 7 AM** in user's timezone

---

### 🎯 Post-Deployment:

Once deployed, users will:
1. Get prompted for notification permission on first login
2. Receive daily notifications at 7 AM (their timezone)
3. Be able to manage notification settings (when you build that UI)

---

## Ready to Deploy? ✅

Once you:
1. ✅ Test the double init fix (refresh browser)
2. ✅ Update OneSignal Site URL to production domain
3. ✅ Deploy to production
4. ✅ Test notifications on production

You're done! 🎉

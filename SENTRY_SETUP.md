# Sentry Setup Guide for SproutHub

Sentry has been integrated into SproutHub for crash reporting and performance monitoring. Follow these steps to complete the setup.

## 🚀 Quick Setup Steps

### 1. Create a Sentry Account

1. Go to [https://sentry.io/signup/](https://sentry.io/signup/)
2. Sign up for a free account (free tier includes 5,000 errors/month)
3. Choose "React" as your platform when prompted

### 2. Create a New Project

1. After signing in, click "Projects" in the left sidebar
2. Click "Create Project"
3. Select **React** as the platform
4. Name your project: `sprouthub` (or `sprouthub-ios` for production)
5. Click "Create Project"

### 3. Get Your DSN (Data Source Name)

After creating the project, you'll see a setup guide. You need to copy the DSN:

1. Look for a code snippet that looks like:
   ```javascript
   Sentry.init({
     dsn: "https://abc123...@o123456.ingest.sentry.io/7654321",
   });
   ```

2. Copy the DSN URL (the entire `https://...` string)

### 4. Add DSN to Your Environment

1. Open `.env.local` in your project root
2. Find the line that says:
   ```bash
   # VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id
   ```
3. Uncomment it and replace with your actual DSN:
   ```bash
   VITE_SENTRY_DSN=https://abc123...@o123456.ingest.sentry.io/7654321
   ```

### 5. Test the Integration

1. **Build the app in production mode:**
   ```bash
   npm run build
   npm run preview
   ```

2. **Trigger a test error:**
   - Open the browser console (F12)
   - Run: `throw new Error("Sentry test error")`
   - This should send an error to Sentry

3. **Check Sentry Dashboard:**
   - Go to your Sentry project
   - Click on "Issues" in the left sidebar
   - You should see your test error appear within a few seconds

### 6. Verify User Tracking

When you sign in to the app, Sentry will automatically track:
- User ID (anonymous - no email stored for privacy)
- Session information
- Error context

## 📊 What Sentry Tracks

### Automatically Tracked:
- **JavaScript Errors**: Unhandled exceptions and React component errors
- **Performance Metrics**: Page load times, API response times
- **User Sessions**: Anonymous user sessions (10% sample rate)
- **Session Replays**: Video-like recordings of user sessions with errors
- **Breadcrumbs**: User actions leading up to errors

### What's NOT Tracked (Privacy):
- User emails (filtered before sending)
- Passwords or sensitive form data
- Cookie data
- Request headers with auth tokens

## 🎛️ Configuration Details

The Sentry configuration is in [`src/config/sentry.ts`](src/config/sentry.ts):

### Sample Rates (Configurable):
- **Performance Monitoring**: 10% of transactions
- **Session Replay**: 10% of normal sessions, 100% of error sessions
- **Error Tracking**: 100% of errors

### Environment Settings:
- **Production**: Full tracking enabled
- **Development**: Disabled (errors logged to console only)

## 🔧 Advanced Setup (Optional)

### Enable Source Maps for Better Error Tracking

To see the exact line of code where errors occur:

1. Install Sentry CLI:
   ```bash
   npm install --save-dev @sentry/vite-plugin
   ```

2. Update `vite.config.ts`:
   ```typescript
   import { sentryVitePlugin } from "@sentry/vite-plugin";

   export default defineConfig({
     plugins: [
       // ... other plugins
       sentryVitePlugin({
         org: "your-org-slug",
         project: "sprouthub",
         authToken: process.env.SENTRY_AUTH_TOKEN,
       }),
     ],
   });
   ```

3. Generate an auth token:
   - Go to: https://sentry.io/settings/account/api/auth-tokens/
   - Create new token with `project:releases` and `project:write` scopes
   - Add to `.env.local`:
     ```bash
     SENTRY_AUTH_TOKEN=your-token-here
     ```

### Set Up Release Tracking

This helps you know which version of your app had errors:

```bash
# Before deploying to App Store
export SENTRY_RELEASE="sprouthub@1.0.0"
npm run build
```

## 📱 iOS/Capacitor Specific Setup

For native iOS crash reporting (optional):

1. Install Sentry Capacitor plugin:
   ```bash
   npm install @sentry/capacitor
   npx cap sync
   ```

2. Update Sentry init to include native support
3. Add to Xcode project (see Sentry docs)

## 🐛 Troubleshooting

### Errors Not Showing in Sentry?

1. **Check DSN is set:**
   ```bash
   echo $VITE_SENTRY_DSN
   ```

2. **Check production build:**
   - Sentry only works in production mode (`npm run build`)
   - Does NOT work in dev mode (`npm run dev`)

3. **Check browser console:**
   - Look for "✅ Sentry initialized for error tracking"
   - If you see "⚠️ Sentry DSN not found", the DSN isn't configured

4. **Check Sentry quota:**
   - Free tier: 5,000 errors/month
   - Check quota at: https://sentry.io/settings/[your-org]/subscription/

### Privacy Concerns?

All sensitive data is filtered before sending to Sentry:
- Emails are removed
- Cookies are removed
- Auth headers are removed
- Only error stack traces and anonymous user IDs are sent

## 📚 Resources

- [Sentry React Docs](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)
- [React Error Boundary](https://docs.sentry.io/platforms/javascript/guides/react/features/error-boundary/)

## ✅ Checklist Before App Store Submission

- [ ] Sentry account created
- [ ] Project created in Sentry
- [ ] DSN added to `.env.local`
- [ ] Test error sent successfully
- [ ] Error appears in Sentry dashboard
- [ ] User tracking verified (sign in/out)
- [ ] Privacy policy updated with Sentry mention
- [ ] Production build tested with Sentry

## 🎉 Next Steps

Once Sentry is set up:
1. Monitor errors in production
2. Set up email alerts for critical errors
3. Create custom dashboards in Sentry
4. Track performance metrics
5. Review session replays to understand user issues

---

**Need Help?** Check the [Sentry Documentation](https://docs.sentry.io/) or contact support at support@sentry.io

# App Store Preparation Progress

**Last Updated:** January 2, 2026

## ✅ Completed Items

### 1. Legal Pages (CRITICAL) ✅
- [x] **Privacy Policy** - Complete and accessible at `/privacy-policy`
  - Covers all third-party services (Supabase, Cloudinary, OpenWeather, OneSignal, Sentry)
  - GDPR and CCPA compliance sections
  - User rights clearly explained
  - Accessible from Footer and Settings page

- [x] **Terms of Service** - Complete and accessible at `/terms-of-service`
  - Acceptable use policy
  - Disclaimers and liability limitations
  - Account termination policy
  - Dispute resolution
  - Accessible from Footer and Settings page

- [x] **Footer Links Updated**
  - Privacy link now points to `/privacy-policy` (was `#`)
  - Terms link added pointing to `/terms-of-service`

- [x] **Settings Integration**
  - Added "Legal & About" section in Account settings
  - Quick access to both legal pages

**Files Modified:**
- [src/pages/PrivacyPolicy.tsx](src/pages/PrivacyPolicy.tsx)
- [src/pages/TermsOfService.tsx](src/pages/TermsOfService.tsx)
- [src/App.tsx](src/App.tsx) - Routes added
- [src/components/Footer.tsx](src/components/Footer.tsx) - Links updated
- [src/components/settings/AccountTab.tsx](src/components/settings/AccountTab.tsx) - Legal section added

### 2. Crash Reporting with Sentry (CRITICAL) ✅
- [x] **Sentry SDK Installed** - `@sentry/react` package added
- [x] **Configuration Created** - [src/config/sentry.ts](src/config/sentry.ts)
  - Production-only tracking (dev mode disabled)
  - Privacy-focused (emails filtered, sensitive data removed)
  - Performance monitoring (10% sample rate)
  - Session replay (10% normal, 100% errors)
  - Error filtering (browser extensions, network errors ignored)

- [x] **App Integration**
  - Sentry initialized in [src/main.tsx](src/main.tsx)
  - Error boundary added to [src/App.tsx](src/App.tsx)
  - User context tracking in [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)
  - Friendly error UI for crashes

- [x] **Environment Setup**
  - `.env.local` updated with VITE_SENTRY_DSN placeholder
  - Privacy Policy updated to mention Sentry

- [x] **Documentation**
  - Complete setup guide: [SENTRY_SETUP.md](SENTRY_SETUP.md)
  - Step-by-step instructions for DSN configuration
  - Testing procedures
  - Troubleshooting guide

**Next Steps for Sentry:**
1. Create Sentry account at https://sentry.io/signup/
2. Create React project in Sentry
3. Copy DSN and add to `.env.local`
4. Test in production build
5. Verify errors appear in Sentry dashboard

---

## 🔄 In Progress Items

None currently.

---

## 📋 Remaining Critical Items

### 3. App Icons (CRITICAL) ⏳
**Status:** Not Started
**Priority:** High
**Estimated Time:** 4-6 hours

**Requirements:**
- Generate all iOS icon sizes (29x29, 40x40, 58x58, 60x60, 76x76, 80x80, 87x87, 120x120, 152x152, 167x167, 180x180, 1024x1024)
- Update `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Test on multiple iOS devices in simulator

**Current State:**
- Have: `AppIcon-512@2x.png` (512x512)
- Need: Complete icon set for all iOS sizes

**Tools:**
- Xcode Asset Catalog
- Online generators (AppIconify, MakeAppIcon)
- Or manual export from design tool

### 4. App Store Screenshots (CRITICAL) ⏳
**Status:** Not Started
**Priority:** High
**Estimated Time:** 8-16 hours

**Requirements:**
- 2-5 screenshots per device size
- Device sizes needed:
  - 6.7" (1290 x 2796) - iPhone 14 Pro Max, 15 Plus
  - 6.5" (1242 x 2688) - iPhone 11 Pro Max, XS Max
  - 6.1" (1170 x 2532) - iPhone 14, 15 Pro
  - 5.5" (1242 x 2208) - iPhone 8 Plus

**Suggested Screenshots:**
1. Plant dashboard/collection view
2. Watering schedule/calendar
3. Individual plant detail with care info
4. Weather integration demo
5. Analytics/insights view

**Tools:**
- iOS Simulator + Screenshot (Cmd+S)
- Screenshot framing tools (Figma, Sketch, etc.)
- App Store Screenshot template generators

### 5. App Store Metadata (CRITICAL) ⏳
**Status:** Not Started
**Priority:** High
**Estimated Time:** 2-4 hours

**Required Fields:**

1. **App Name** ✅ - "SproutHub" (already decided)

2. **Subtitle** ⏳ - (max 30 chars)
   - Suggestion: "Plant Care & Reminders"

3. **Description** ⏳ - (max 4000 chars)
   - Draft available in [About page](src/pages/About.tsx)
   - Needs formatting for App Store
   - Focus on benefits, not features
   - Include keywords naturally

4. **Keywords** ⏳ - (max 100 chars)
   - Suggested: plants,care,watering,garden,reminder,indoor,houseplant,schedule,tracker,organizer

5. **Support URL** ⏳
   - Need to set up: support@sprouthub.app or create support page

6. **Privacy Policy URL** ✅
   - Ready: https://[your-domain]/privacy-policy

7. **Marketing URL** ⏳ (optional)
   - Could use: https://[your-domain]/about

8. **Promotional Text** ⏳ - (max 170 chars, updatable)
   - Can be updated without new app version

9. **What's New** ⏳ - (version description)
   - For v1.0.0: Initial release description

---

## 📊 Important (Non-Blocking) Items

### 6. App Store Account Setup
- [ ] Apple Developer Account ($99/year)
- [ ] App Store Connect project creation
- [ ] Certificate and Provisioning Profile setup
- [ ] TestFlight beta testing setup

### 7. Build Configuration
- [ ] Update version number strategy
- [ ] Create release build script
- [ ] Configure code signing
- [ ] Set up CI/CD (optional)

### 8. Testing Requirements
- [ ] Test on physical iOS device (not just simulator)
- [ ] Complete push notification testing
- [ ] Full feature testing checklist
- [ ] Performance testing (startup time, battery usage)
- [ ] Network condition testing (slow 3G, offline)

### 9. Additional Polish
- [ ] Create app preview video (optional but recommended)
- [ ] Multiple language support (future)
- [ ] Accessibility testing
- [ ] App Store optimization research

---

## 📝 Notes

### Security
- ✅ Environment files properly in `.gitignore`
- ✅ No credentials committed to Git
- ✅ Sentry configured with privacy filters

### Legal Review Needed
⚠️ **Important:** Before submission, consider having legal documents reviewed by:
- A lawyer specializing in privacy law
- Or use a service like Iubenda or Termly for legally-vetted templates

### Build Testing
- ✅ Production build successful
- ✅ No TypeScript errors
- ⏳ Need to test with Sentry DSN configured

---

## 🎯 Immediate Next Steps

1. **Set up Sentry** (30 minutes)
   - Create account
   - Get DSN
   - Test error reporting

2. **Generate App Icons** (4-6 hours)
   - Use existing logo
   - Create all required sizes
   - Update Xcode assets

3. **Create Screenshots** (8-16 hours)
   - Design screenshot layouts
   - Capture from simulator
   - Add device frames and text overlays (optional)

4. **Write App Store Copy** (2-4 hours)
   - Finalize description
   - Choose keywords
   - Write promotional text

**Estimated Total Time Remaining:** 15-27 hours (2-3 days of focused work)

---

## 📞 Support Resources

- **Sentry Setup:** See [SENTRY_SETUP.md](SENTRY_SETUP.md)
- **Legal Pages:** [Privacy Policy](src/pages/PrivacyPolicy.tsx) | [Terms of Service](src/pages/TermsOfService.tsx)
- **App Store Guidelines:** https://developer.apple.com/app-store/review/guidelines/
- **Human Interface Guidelines:** https://developer.apple.com/design/human-interface-guidelines/

---

## ✅ Ready for Submission Checklist

- [x] Privacy Policy created and accessible
- [x] Terms of Service created and accessible
- [x] Crash reporting implemented (Sentry)
- [ ] Sentry account set up and DSN configured
- [ ] Complete app icon set generated
- [ ] App Store screenshots created
- [ ] App description and metadata written
- [ ] Test on physical iOS device
- [ ] Push notifications tested
- [ ] Build uploaded to App Store Connect
- [ ] TestFlight beta testing completed
- [ ] Final App Store review submission

---

**Progress:** 2/6 critical items completed (33%)
**Status:** On track for 3-4 week timeline

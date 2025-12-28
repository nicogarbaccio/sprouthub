# 🔑 How to Get Your Service Role Key

You used the wrong key! Here's how to get the correct one:

## Step 1: Go to Supabase API Settings

Open this link:
https://supabase.com/dashboard/project/ufhjudswppdqupjbqbwm/settings/api

## Step 2: Find the Service Role Key

Scroll down to the **"Project API keys"** section.

You'll see several keys:

### ❌ **DON'T USE** (what you used):
- **Project URL** - starts with `https://`
- **API URL** - starts with `https://`
- **anon public** - shorter key
- **Project API keys → secret** - starts with `sb_secret_` ← **This is what you used**

### ✅ **DO USE**:
- **service_role** (secret) - This is a **VERY LONG** JWT token
  - Starts with `eyJ...`
  - Several hundred characters long
  - Click the **eye icon** to reveal it
  - Click the **copy icon** to copy it

## Step 3: Run the Test Again

```bash
./test-notification.sh
```

When prompted, paste the **long JWT token** (the service_role key).

## Expected Result:

```json
{
  "success": true,
  "notifications_sent": 0,  // or 1 if token is registered
  "notifications_failed": 0,
  "users_processed": 1
}
```

---

## Visual Guide:

When you open the API settings page, you'll see:

```
Project API keys
┌─────────────────────────────────────────────────────────┐
│ anon public                                             │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...                 │
│ [👁️ Hide] [📋 Copy]                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ service_role (secret) ← COPY THIS ONE!                  │
│ ●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●       │
│ [👁️ Reveal] [📋 Copy]                                  │
└─────────────────────────────────────────────────────────┘
```

Click **"Reveal"** then **"Copy"** on the **service_role** key.

---

## Security Note:

⚠️ **NEVER commit the service_role key to git!**
⚠️ **NEVER share it publicly!**

This key has full admin access to your database.

---

**Ready?** Get the correct key and run `./test-notification.sh` again! 🚀

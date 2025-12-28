#!/bin/bash

# Test Push Notification
# This script triggers the Edge Function to send notifications

echo "🧪 Testing Push Notification System"
echo "===================================="
echo ""

# You need the SERVICE_ROLE JWT key (NOT the sb_secret_ key!)
# Get it from: https://supabase.com/dashboard/project/ufhjudswppdqupjbqbwm/settings/api
#
# Look for "service_role (secret)" under "Project API keys"
# Click "Reveal" then "Copy"
# It's a VERY LONG token that starts with "eyJ..."
#
# ❌ DON'T use the "sb_secret_..." key - that won't work!
# ✅ DO use the long JWT token

echo "📖 See GET_SERVICE_ROLE_KEY.md for detailed instructions"
echo ""
read -p "Enter your Supabase SERVICE_ROLE JWT key (starts with eyJ...): " SERVICE_ROLE_KEY

if [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "❌ Error: Service role key is required"
  exit 1
fi

echo ""
echo "📡 Triggering Edge Function..."
echo ""

# Call the Edge Function
response=$(curl -s -X POST 'https://ufhjudswppdqupjbqbwm.supabase.co/functions/v1/send-plant-notifications' \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H 'Content-Type: application/json')

echo "Response:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"

echo ""
echo "📊 Checking notification logs..."
echo ""

# Note: You'll need to check the database for logs
echo "Run this SQL query in Supabase to see the logs:"
echo ""
echo "SELECT * FROM notification_logs ORDER BY sent_at DESC LIMIT 5;"
echo ""
echo "Or check Edge Function logs at:"
echo "https://supabase.com/dashboard/project/ufhjudswppdqupjbqbwm/functions/send-plant-notifications/logs"

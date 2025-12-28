#!/bin/bash

# SproutHub Push Notifications Setup Script
# This script will help you complete the setup of push notifications

set -e

echo "🌱 SproutHub Push Notifications Setup"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Login to Supabase
echo -e "${BLUE}Step 1: Login to Supabase CLI${NC}"
echo "If you're not already logged in, run:"
echo "  npx supabase login"
echo ""
read -p "Press Enter when you're logged in..."

# Step 2: Link to project
echo ""
echo -e "${BLUE}Step 2: Link to your Supabase project${NC}"
npx supabase link --project-ref ufhjudswppdqupjbqbwm

# Step 3: Set environment variables
echo ""
echo -e "${BLUE}Step 3: Setting environment variables for Edge Functions${NC}"

echo "Setting ONESIGNAL_APP_ID..."
npx supabase secrets set ONESIGNAL_APP_ID=5db8206d-53e2-4cfc-a001-a97f630bafc1

echo "Setting ONESIGNAL_API_KEY..."
npx supabase secrets set ONESIGNAL_API_KEY=YOUR_ONESIGNAL_API_KEY_HERE

echo ""
echo -e "${GREEN}✅ Environment variables set successfully!${NC}"

# Step 4: Verify secrets
echo ""
echo -e "${BLUE}Step 4: Verify secrets are set${NC}"
npx supabase secrets list

echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Set up cron job (see docs/FINAL_SETUP_STEPS.md)"
echo "  2. Test the Edge Function"
echo "  3. Enable push notifications in your app"
echo ""
echo "📚 Full instructions: docs/FINAL_SETUP_STEPS.md"

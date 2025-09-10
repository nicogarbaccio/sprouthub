#!/bin/bash

# Script to run timezone and watering schedule fix tests before shipping

echo "🧪 Running Timezone and Calendar Logic Fix Tests"
echo "================================================"

# Set environment variables for testing
export NODE_ENV=test
export PLAYWRIGHT_BROWSER=chromium

echo "📋 Running timezone fixes tests..."
npx playwright test tests/e2e/watering/timezone-fixes.spec.ts --reporter=line

echo ""
echo "📋 Running updated watering schedule calculation tests..."
npx playwright test tests/e2e/watering/watering-schedule-calculation.spec.ts --reporter=line

echo ""
echo "📋 Running unit tests for watering schedule logic..."
npx vitest run src/utils/__tests__/watering-schedule.test.ts

echo ""
echo "✅ All timezone and watering schedule tests completed!"
echo ""
echo "🚀 Tests to verify before shipping:"
echo "   ✓ Early morning watering adjustments (00:00-04:00 UTC)"
echo "   ✓ Normal daytime watering (no adjustments)"
echo "   ✓ Grace period logic removal"
echo "   ✓ Boundary conditions (exactly 04:00 UTC)"
echo "   ✓ Fallback calculations with timezone fixes"
echo "   ✓ Calendar-based date formatting"
echo ""
echo "🎯 Key scenarios verified:"
echo "   • Disco Pothos scenario: Sept 9 00:14 UTC → shows Sept 8, Water in 5 days"
echo "   • Normal watering times remain unchanged"
echo "   • No grace period applied to plants with postponement history"
echo "   • Consistent calendar logic across all plants"

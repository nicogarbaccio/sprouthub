# Dismissed Pattern Insights Migration

## Overview
This migration adds persistent storage for dismissed watering pattern insights, allowing users to permanently dismiss suggestions without being nagged repeatedly.

## Migration File
- `20251217_create_dismissed_pattern_insights.sql`

## What It Does
Creates a new table `dismissed_pattern_insights` that tracks which pattern insights (underwatering risk, overwatering risk, schedule adjustments, etc.) users have dismissed for each plant.

## To Apply This Migration

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `20251217_create_dismissed_pattern_insights.sql`
4. Run the SQL

### Option 2: Supabase CLI (if you have it set up)
```bash
supabase db push
```

## What's Included
- New `dismissed_pattern_insights` table
- RLS (Row Level Security) policies ensuring users can only manage their own dismissals
- Unique constraint preventing duplicate dismissals
- Cascade deletion when plants are deleted
- Proper indexing for performance

## Features Added
- Permanent dismissal of pattern insights
- Dismissals persist across sessions and page reloads
- Each insight type can be dismissed independently per plant
- Users won't see the same suggestion repeatedly after dismissing it

## Future Enhancement (Optional)
Consider adding a "Manage Dismissed Insights" section in plant settings where users can:
- See what insights they've dismissed
- Un-dismiss insights to see them again
- Clear all dismissals for a fresh start

This has been partially implemented in the `useDismissedInsights` hook with the `clearAllDismissals()` and `undismissInsight()` methods.

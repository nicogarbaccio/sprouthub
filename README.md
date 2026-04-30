# sprouthub

A houseplant care app built with React, TypeScript, and Supabase. Track your plants, stay on watering schedules, and get smart care recommendations backed by botanical reasoning.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **State**: TanStack Query
- **Routing**: React Router v6

---

## Core Features

### Plant Management
- Add plants from a catalog of 100+ species or create custom entries
- Per-plant watering schedules, room assignment, outdoor flag, household sharing
- Photo support with Supabase Storage
- Plant journal for free-form notes and health observations

### Watering Tracking
- Log waterings with optional notes
- Postpone ("not yet") when soil is still moist
- Edit or delete individual watering records
- Overdue indicators and care streak tracking

### Smart Watering Insights
Pattern analysis runs after each watering and surfaces recommendations based on your actual behavior. See [Botanist Logic](#botanist-logic) below for the full reasoning model.

### Seasonal Schedule Adjustments
Two independent systems adjust watering schedules for seasonal changes:
- **Calendar-based**: detects upcoming equinox/solstice and suggests schedule changes ~14 days in advance
- **Weather-based**: uses local weather data to detect season transitions and generate suggestions

### Fertilization Tracking
Log fertilizations per plant, get spring reminders, and see plant-specific guidance on cadence and fertilizer type. See [Fertilization](#fertilization) below.

---

## Botanist Logic

All watering recommendations are designed to reason the way a botanist would — not just "are you watering on time?" but "does your plant actually need water at this frequency?"

### Health Observations on Late Waterings

When you water a plant more than one day past its scheduled date, the app prompts:

- **"Thirsty or stressed"** → records `LATE_STRESSED:` prefix on the watering note
- **"Looked healthy, soil was still okay"** → records `LATE_HEALTHY:` prefix
- **"I didn't check closely"** → no observation recorded

These observations gate all "water less often" schedule suggestions. A single stressed observation **permanently vetoes** any extension suggestion for that analysis window, regardless of how many healthy observations or postponements have been logged.

Implementation: [`src/utils/watering/notesPrefixes.ts`](src/utils/watering/notesPrefixes.ts), [`src/components/WaterConfirmationDialog.tsx`](src/components/WaterConfirmationDialog.tsx)

### Postponements as a Botanical Signal

When you tap "Not yet", you're saying "I checked the soil and it doesn't need water." This is the most reliable signal in the system — intentional soil inspection. The app treats it accordingly.

Each postponement:
- Creates a `watering_records` row with a `POSTPONEMENT:` prefix (source of truth)
- Increments `postponement_count` on `user_plants` for quick pattern analysis
- Is analyzed separately from actual waterings in the pattern analyzer

When you water after postponing, `postponement_count` resets to 0.

Implementation: [`src/hooks/usePlantActions.ts`](src/hooks/usePlantActions.ts)

### Unified Evidence Model

"Water less often" suggestions require corroborating evidence before they appear. The gate uses a point system:

```
evidencePoints = min(LATE_HEALTHY count, 3) + min(postponements with ≥2-day delay, 3)

if evidencePoints >= 3 → suggestion allowed
if any LATE_STRESSED → hard veto regardless of points
```

This means:
- 2 healthy observations + 1 significant postponement = 3 points → suggestion triggers
- 4 postponements alone (no health data) = suggestion triggers if 3+ were ≥2 days late
- 1 stressed observation + 10 postponements = no suggestion

The legacy gate (2 healthy observations) is preserved as an alternative path — either the legacy gate OR the unified evidence gate passing will allow a suggestion through.

Implementation: [`src/utils/watering/patternAnalyzer.ts`](src/utils/watering/patternAnalyzer.ts) — `evaluateUnifiedEvidence()`

### Season-Aware Analysis Window

Pattern analysis uses a 60-day lookback window. If a seasonal schedule adjustment was applied within that window (spring or fall transition), the window is clipped to start from the transition date. This prevents mixing pre- and post-seasonal data, which would make a correctly-adapting plant appear "inconsistent."

The `analysisWindowNote` field on `WateringPatternAnalysis` is set when clipping occurs, and the UI displays it as a small italic note below the pattern summary.

Implementation: [`src/utils/watering/patternAnalyzer.ts`](src/utils/watering/patternAnalyzer.ts) — `filterRelevantRecords()`, [`src/hooks/useWateringPatternAnalysis.ts`](src/hooks/useWateringPatternAnalysis.ts) — `fetchLastSeasonalTransition()`

### Honest Pattern States

Pattern classifications:

| Pattern | Meaning | UI |
|---|---|---|
| `consistent` | ≥75% of recent intervals within schedule + 1-day grace | "You're doing great!" |
| `late` | Consistently watering after the due date | Honest late copy; health observation context shown |
| `early` | Consistently watering before the due date | Overwatering advisory |
| `irregular` | High variance, no clear pattern | "Pattern still forming" |

The "You're doing great!" state is **strictly gated** to `pattern === 'consistent'` only. It does not appear when there are simply no active insights.

The care streak (`useCareStreak`) checks all intervals in a 90-day lookback (or 3× the plant's schedule) and requires ≥75% compliance — one on-time watering after several missed ones does not reset the streak.

Implementation: [`src/hooks/useCareStreak.ts`](src/hooks/useCareStreak.ts), [`src/components/watering-patterns/PatternTipsContent.tsx`](src/components/watering-patterns/PatternTipsContent.tsx)

### Postponement Pattern Insights

A `postponement_pattern` insight appears in the pattern dialog when:
- `postponementContext.count >= 2` in the analysis window
- No `schedule_adjustment` insight is already showing (to avoid redundancy)

Severity is `medium` if the postponement signal is significant (≥3 postponements averaging ≥2 days past due), `low` otherwise. Only significant postponements are actionable.

---

## Fertilization

### Botanical Principles

The app enforces these rules:

- **Fertilize only during the growing season** (April–September in the northern hemisphere). The "Log Fertilization" button is disabled outside this window with an explanatory tooltip.
- **Never fertilize newly repotted plants.** A static advisory is always shown in the fertilization card: "Wait 6–8 weeks — fresh potting mix already has nutrients."
- **Dormancy warning** is shown in fall/winter with an amber alert explaining why fertilizing during dormancy causes salt buildup and root damage.

### Plant-Specific Guidance

Fertilization cadence and product type are parsed at runtime from each plant's `careInstructions` array using regex patterns. The parser recognises:
- `every N-M weeks/months`
- `monthly`, `weekly`
- `N times per year`

When no match is found, category-based fallbacks apply:

| Category | Cadence | Product |
|---|---|---|
| Succulents | Every 6–8 weeks | Diluted succulent fertilizer |
| Air Plants | Monthly (quarter-strength) | Bromeliad fertilizer |
| Flowering Plants | Every 2–3 weeks | Balanced fertilizer |
| Tropical Plants | Monthly | Balanced fertilizer |
| Low Maintenance | Every 8–12 weeks | Balanced fertilizer |
| Default | Monthly | Balanced fertilizer |

Implementation: [`src/utils/plants/fertilizationAdvice.ts`](src/utils/plants/fertilizationAdvice.ts)

### FertilizationCard

Located on each plant's detail page between the Repotting Guide and Care Instructions. Inline-expandable (accordion style). Shows:
- Status badge: **Due now** (green) / **Next in X days** / **Dormant season** (amber)
- Parsed frequency and fertilizer type from care instructions
- Verbatim care instruction quote if one was found
- Last fertilized date (or "Never logged")
- Repotting advisory
- Dormancy warning panel (fall/winter only)
- "Log Fertilization" button

### Spring Reminder Banner

An amber banner appears on the dashboard during spring/summer when one or more plants haven't been fertilized in 60+ days. Dismissal is persisted to the `notification_acknowledgements` table with `notification_type = 'spring_fertilization_{year}'`, so it only shows once per growing season. Supports 1-week and 2-week snooze.

Implementation: [`src/hooks/useFertilizationBanner.ts`](src/hooks/useFertilizationBanner.ts), [`src/components/FertilizationBanner.tsx`](src/components/FertilizationBanner.tsx)

---

## Notes Prefix System

The `watering_records.notes` field carries structured metadata via string prefixes, avoiding DB schema changes:

| Prefix | Meaning |
|---|---|
| `LATE_HEALTHY:` | Plant looked healthy during a late watering |
| `LATE_STRESSED:` | Plant showed stress during a late watering |
| `POSTPONEMENT:` | Record represents a postponement, not an actual watering |

All display code strips these prefixes before showing notes to the user. The prefixes are never shown in the UI.

Implementation: [`src/utils/watering/notesPrefixes.ts`](src/utils/watering/notesPrefixes.ts)

---

## Project Structure

```
src/
├── components/
│   ├── plant-details/        # Per-plant detail page cards
│   │   ├── FertilizationCard.tsx
│   │   ├── RepottingGuideCard.tsx
│   │   ├── PlantCareGrid.tsx
│   │   └── WateringScheduleCard.tsx
│   ├── watering-patterns/    # Pattern analysis UI
│   │   ├── PatternSuggestionsDialog.tsx
│   │   ├── PatternTipsContent.tsx
│   │   └── PatternTipsModal.tsx
│   ├── CalendarSeasonalBanner.tsx
│   ├── FertilizationBanner.tsx
│   └── WaterConfirmationDialog.tsx
├── hooks/
│   ├── usePlantActions.ts          # waterPlant, postponeWatering, logFertilization
│   ├── useUserPlants.ts
│   ├── useWateringPatternAnalysis.ts
│   ├── useCareStreak.ts
│   ├── useFertilizationBanner.ts
│   └── useCalendarSeasonalNotification.ts
├── utils/
│   ├── watering/
│   │   ├── patternAnalyzer.ts      # Core pattern analysis engine
│   │   ├── notesPrefixes.ts        # LATE_HEALTHY / LATE_STRESSED / POSTPONEMENT
│   │   └── schedule.ts
│   └── plants/
│       ├── fertilizationAdvice.ts  # Parser + status functions
│       ├── repottingAdvice.ts
│       └── overwatering.ts
├── types/
│   └── wateringPatternTypes.ts     # All pattern analysis type definitions
├── services/
│   ├── calendarSeasonalService.ts
│   ├── seasonalDetectionService.ts
│   └── scheduleVersioningService.ts
└── integrations/
    └── supabase/
        └── types.ts                # Auto-generated DB types
```

---

## Database Schema (key tables)

| Table | Purpose |
|---|---|
| `user_plants` | Plant metadata, schedule, postponement count, last fertilized date |
| `watering_records` | All watering events and postponements (notes carry prefix metadata) |
| `plant_seasonal_schedules` | History of seasonal schedule adjustments per plant |
| `calendar_seasonal_notifications` | Dismissal/snooze state for seasonal watering banners |
| `notification_acknowledgements` | Dismissal/snooze for fertilization banner and other one-off notifications |
| `dismissed_pattern_insights` | Per-user dismissed pattern insights |
| `plant_journal_entries` | Free-form journal entries |

---

## Getting Started

```bash
npm install
npm run dev
```

Requires a Supabase project. Copy `.env.example` to `.env.local` and fill in your Supabase URL and anon key.

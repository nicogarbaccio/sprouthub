# Requirements Document

Seasonal & Weather Schedule Consolidation

## Glossary

- **Base interval** — the plant's current `suggested_watering_days` value, before any seasonal or
  weather adjustment is applied.
- **Seasonal adjustment** — a proportional change to the base interval driven by the current season
  and the plant's characteristics.
- **Weather adjustment** — a change to the base interval driven by current measured conditions
  (temperature, humidity, daylight hours).
- **Growing season** — spring and summer in the plant's resolved hemisphere, when plants are
  actively growing and consume more water.
- **Dormancy** — fall and winter in the plant's resolved hemisphere, when growth slows and water
  needs drop.
- **Hemisphere resolution** — the fallback chain that determines whether a user is in the northern
  or southern hemisphere: latitude, then profile timezone, then a logged northern assumption.
- **Drought-tolerant plant** — a succulent or cactus, whose seasonal water needs shift less than
  average.
- **Moisture-sensitive plant** — a tropical plant or fern, whose seasonal water needs shift more
  than average.
- **Clamp** — the enforced 2–90 day bound applied to any newly suggested interval.
- **Suggestion** — a proposed interval change presented to the user for explicit acceptance. This
  spec introduces no automatically applied changes.

## Introduction

Watering schedule adjustments driven by season and weather are currently implemented four
separate times with mutually incompatible models. The same plant, in the same season, gets a
different recommended interval depending on which screen the user is looking at.

This is item 6 of the watering/fertilization consistency audit. Items 1–5 established a single
watering calculation, a single status formatter, a single day-boundary convention, a corrected
postponement lifecycle, and a single fertilization due-ness rule. This spec covers the last
remaining source of contradiction.

Unlike the earlier items, this one changes what the app actually *recommends* to users, not just
how consistently it reports existing state. The behavioral rules are therefore the substance of
this spec.

### Current state

Season detection exists in four places, three of which are northern-hemisphere-only:

| Location | Hemisphere aware? |
|---|---|
| `calendarSeasonalService.getCurrentSeason(latitude)` | Yes |
| `smartSchedule.getCurrentSeason()` | No — month only |
| `mapping.ts` `createFallbackWeatherData` | No — month only |
| `seasonalDetectionService` own `getCurrentSeason(location)` | Partial |
| `scheduleUpdater.ts` inline `month 12/1/2 === winter` check | No |

Seasonal adjustment uses two incompatible models with three different clamps:

| Location | Model | Clamp |
|---|---|---|
| `calendarSeasonalService.getSeasonalAdjustment` | Percentage (spring −15%, summer −25%, fall +15%, winter +25%) with plant-type and outdoor modifiers | 1–90 |
| `scheduleVersioningService.calculateWeatherBasedSchedule` | Flat days × indoor/outdoor multiplier (0.8 / 1.5) | none at this layer |
| `smartSchedule` seasonal block | Flat days (winter +3, summer −1, fall +1) | 2–45 |

Weather factors do not compose: `getExtremeWeatherAdjustment` early-returns on the first matching
condition, so 32 °C at 15% humidity yields only the heat adjustment and silently drops the
dryness. Ordering (temperature before humidity) is arbitrary. Reason strings describe outdoor API
readings as "Hot indoor conditions" and "Very dry indoor air".

### Decisions settled before writing this spec

1. **Percentage-based adjustment wins.** Flat offsets break down at interval extremes — a −2 day
   summer offset is a 66% change to a 3-day fern and a 3% change to a 60-day cactus.
2. **Clamp is 2–90 days.** 90 matches the ceiling `patternAnalyzer.calculateWateringIntervals`
   already uses; the previous 45-day ceiling contradicted it and crushed cactus/ZZ schedules. A
   floor of 2 rather than 1 because a 1-day interval is almost certainly a data error.
3. **Hemisphere resolves by fallback chain:** real latitude when location is granted → inference
   from the stored profile timezone → northern as an explicitly logged last resort.
4. **Weather factors compose additively** under a single overall bound, and continue to apply to
   indoor plants at reduced weight, with copy that no longer claims to know indoor conditions.

---

## Requirements

### Requirement 1: Single season detection

**User Story:** As a plant owner in the southern hemisphere, I want every part of the app to agree
on what season it is, so that I am not told to increase summer watering during my winter.

#### Acceptance Criteria

1. THE SYSTEM SHALL expose exactly one function for resolving the current season from a date and a
   hemisphere.
2. WHEN any module needs the current season THEN it SHALL call that function rather than deriving
   the season from the month itself.
3. WHEN the resolved hemisphere is southern THEN the season SHALL be offset by six months relative
   to the northern-hemisphere calendar.
4. THE SYSTEM SHALL NOT retain any other season-derivation logic, including the inline winter check
   in `scheduleUpdater.ts` and the month-based fallbacks in `smartSchedule.ts`,
   `mapping.ts`, and `seasonalDetectionService.ts`.
5. WHEN season detection is called for a date on a season boundary THEN it SHALL return the same
   season regardless of which module called it.

### Requirement 2: Hemisphere resolution with an explicit fallback chain

**User Story:** As a plant owner who never granted location access, I want the app to still get my
seasons right, so that seasonal advice is useful without me sharing my location.

#### Acceptance Criteria

1. WHEN the user has granted location access THEN the system SHALL resolve hemisphere from the
   reported latitude.
2. WHEN latitude is unavailable AND the user's profile has a stored timezone THEN the system SHALL
   infer hemisphere from that timezone.
3. WHEN neither latitude nor timezone is available THEN the system SHALL assume the northern
   hemisphere AND SHALL record that this assumption was made.
4. THE SYSTEM SHALL NOT express the northern-hemisphere assumption as a silent default parameter
   value.
5. WHEN hemisphere is resolved THEN the source of that resolution SHALL be available to callers so
   that UI copy can be appropriately hedged.

### Requirement 3: Single percentage-based seasonal adjustment model

**User Story:** As a plant owner, I want a seasonal suggestion for a given plant to be the same
number wherever I see it, so that I can trust the recommendation.

#### Acceptance Criteria

1. THE SYSTEM SHALL express seasonal adjustment as a percentage of the plant's current interval,
   not as a fixed number of days.
2. THE SYSTEM SHALL apply exactly one set of base seasonal rates.
3. WHEN a plant is drought-tolerant (succulent or cactus) THEN its seasonal adjustment SHALL be
   damped relative to the base rate.
4. WHEN a plant is moisture-sensitive (tropical or fern) THEN its seasonal adjustment SHALL be
   amplified relative to the base rate.
5. WHEN a plant is outdoors THEN its seasonal adjustment SHALL be amplified relative to an
   equivalent indoor plant.
6. WHEN the computed percentage rounds to zero days but the underlying rate is non-zero THEN the
   adjustment SHALL be at least one day in the direction of the rate.
7. THE SYSTEM SHALL clamp every resulting interval to between 2 and 90 days inclusive.
8. WHEN the same plant and season are evaluated through any entry point THEN the suggested interval
   SHALL be identical.

### Requirement 4: Composing weather factors

**User Story:** As a plant owner in a hot, dry climate, I want both the heat and the dryness to
affect the recommendation, so that the advice reflects my actual conditions.

#### Acceptance Criteria

1. WHEN multiple weather conditions are simultaneously outside their normal ranges THEN their
   adjustments SHALL be summed rather than the first match being returned alone.
2. THE SYSTEM SHALL bound the combined weather adjustment so that stacked factors cannot exceed a
   defined maximum shift.
3. WHEN weather adjustments are summed THEN each contributing factor SHALL be individually
   reportable so the UI can explain the total.
4. WHEN a plant is indoors THEN weather-derived adjustments SHALL be applied at reduced weight
   relative to an outdoor plant.
5. WHEN describing an adjustment derived from outdoor weather data THEN the copy SHALL NOT assert
   knowledge of the plant's indoor environment.
6. THE SYSTEM SHALL clamp the final interval to the same 2–90 day range defined in Requirement 3.

### Requirement 5: Seasonal and weather adjustments compose predictably

**User Story:** As a plant owner, I want to understand why my plant's schedule changed, so that I
can decide whether to accept the suggestion.

#### Acceptance Criteria

1. WHEN both a seasonal adjustment and a weather adjustment apply THEN the order of application
   SHALL be defined and consistent.
2. THE SYSTEM SHALL apply the 2–90 day clamp once, after all adjustments are combined, rather than
   clamping at intermediate steps.
3. WHEN an adjustment is suggested THEN the system SHALL report the base interval, each contributing
   factor, and the final interval.
4. WHEN the combined adjustment produces no change THEN the system SHALL report that no adjustment
   is needed rather than suggesting an identical interval.

### Requirement 6: No behavioral regression for existing users

**User Story:** As an existing plant owner in the northern hemisphere, I do not want my established
schedules disrupted by this refactor.

#### Acceptance Criteria

1. WHEN a northern-hemisphere indoor plant on a typical interval is evaluated THEN the suggested
   adjustment SHALL remain within one day of what the previous percentage-based path produced.
2. THE SYSTEM SHALL NOT apply any adjustment automatically; all adjustments SHALL remain
   suggestions the user explicitly accepts.
3. WHEN a plant's interval currently falls outside the 2–90 day range THEN the system SHALL NOT
   silently rewrite it; the clamp SHALL apply only to newly suggested values.
4. THE SYSTEM SHALL preserve the existing behavior where a recent seasonal review suppresses
   pattern-based suggestions for 14 days.

### Requirement 7: Test coverage for the consolidated model

**User Story:** As a developer, I want the consolidated behavior locked down, so that the four
implementations cannot silently diverge again.

#### Acceptance Criteria

1. THE SYSTEM SHALL have tests asserting that season detection returns opposite seasons for
   northern and southern latitudes on the same date.
2. THE SYSTEM SHALL have tests asserting the hemisphere fallback chain, including the timezone
   inference path.
3. THE SYSTEM SHALL have tests asserting that seasonal adjustment scales proportionally, covering
   both a short-interval and a long-interval plant.
4. THE SYSTEM SHALL have tests asserting that the 2–90 clamp holds at both bounds.
5. THE SYSTEM SHALL have tests asserting that simultaneous out-of-range weather conditions compose
   rather than the first match winning.

---

## Out of scope

- **Rain delay coverage.** `calculateRainDelay` is currently applied only on the Dashboard, so the
  plant cards, detail page, notification generator and push job disagree with it. This is a real
  inconsistency but it is about *where* an adjustment is applied rather than *how* it is computed,
  and it is tracked separately as audit item 9.
- Changing the underlying weather data provider or the cadence at which weather is fetched.
- Revisiting the pattern-analysis suggestion model, which items 1–5 left intact and which is
  already internally consistent.
- Dropping the deprecated `user_plants.last_fertilized_date` column and the
  `days_since_watering` view column, both now unread and pending a cleanup migration.

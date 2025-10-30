# Weather Feature Testing Plan

## Overview

This document outlines a comprehensive Playwright E2E testing strategy for the weather feature in SproutHub.

## Current State

### Implementation Progress

#### ✅ Phase 1 Complete (Completed: 2025-10-28)
- **Test utilities created**: `tests/utils/weather-mocks.ts` - 9 mock functions
- **Test fixtures created**: `tests/fixtures/weather-data.ts` - Comprehensive test data
- **`tests/e2e/weather/weather-settings.spec.ts`**: 27 test cases (3 passed, 24 skipped)
  - Opening the Dialog (2 tests)
  - Toggling Weather On/Off (3 tests)
  - Location Detection (4 tests)
  - Manual Location Entry (6 tests)
  - Weather Data Display (3 tests)
  - Features Info Section (2 tests)
  - Accessibility (2 tests)
  - Dialog Behavior (5 tests)

#### ✅ Phase 2 Complete (Completed: 2025-10-28)
- **`tests/e2e/weather/rain-delay.spec.ts`**: 20 test cases (19 passed ✅)
  - Outdoor Plant Checkbox (4 tests - 4 skipped)
  - Rain Delay Logic (4 tests - 4 passed ✅)
  - Rain Delay Notification (5 tests - 5 passed ✅)
  - Rain Delay Override (3 tests - 3 passed ✅)
  - Rain Delay Badge/Indicator (3 tests - 3 passed ✅)
  - Weather Changes (2 tests - 2 passed ✅)

- **`tests/e2e/weather/weather-location-management.spec.ts`**: 21 test cases (2 passed, 19 skipped)
  - Browser Location Detection (5 tests)
  - Manual Location Input (9 tests)
  - Location Priority & Management (3 tests - 1 passed ✅)
  - Location Persistence (2 tests - 1 passed ✅)
  - International Locations (2 tests)

**Phase 2 Results**: 19/41 tests passing (rain delay feature fully working!)

#### ✅ Phase 3 Complete (Completed: 2025-10-28)
- **`tests/e2e/weather/weather-mood-banner.spec.ts`**: 20 test cases (0 passed, 20 skipped)
  - Banner Visibility (3 tests)
  - Mood States (5 tests - excellent, great, good, fair, challenging)
  - Content Display (8 tests - message, advice, temperature, humidity, rain, indicators)
  - Special Events (4 tests - extreme heat, freeze, perfect, heavy rain)
  - Visual Styling (3 tests - gradient, contrast, animation)

- **`tests/e2e/weather/weather-schedule-integration.spec.ts`**: 22 test cases (0 passed, 22 skipped)
  - Smart Watering Wizard (3 tests)
  - Schedule Adjustments (6 tests - heat, cold, humidity, daylight)
  - Weather Indicator on Dashboard (6 tests)
  - Schedule Adjustment Display (3 tests)
  - Weather Status Banner (2 tests)

- **`tests/e2e/weather/weather-error-handling.spec.ts`**: 18 test cases (0 passed, 18 skipped)
  - API Failures (4 tests - fallback data, retry, network errors)
  - Permission Issues (3 tests - denied, manual fallback, timeout)
  - Invalid Data (4 tests - malformed JSON, missing fields, bad coordinates)
  - Edge Cases (5 tests - disable mid-use, location switching, offline, cache)
  - Error Recovery (2 tests - recovery, preference persistence)

**Phase 3 Results**: 60 test cases created, all skipping gracefully (waiting for UI implementation)

#### 📋 Pending Implementation

##### Phase 4: Polish (Optional)
- **`tests/e2e/weather/weather-enable-prompt.spec.ts`** - One-time user onboarding flow

### Existing Tests
- **`tests/e2e/weather/weather-display.spec.ts`**: Basic smoke tests for weather display
  - Verifies weather indicator visibility states
  - Checks outdoor plant toggle in forms
  - Tests rain delay notifications (basic)

---

## Proposed Test Structure

### 📁 File Organization

```
tests/e2e/weather/
├── weather-display.spec.ts (existing - needs expansion)
├── weather-settings.spec.ts (new)
├── weather-location-management.spec.ts (new)
├── weather-mood-banner.spec.ts (new)
├── weather-schedule-integration.spec.ts (new)
├── rain-delay.spec.ts (new)
└── weather-error-handling.spec.ts (new)
```

---

## Test Specifications

### 1. **weather-settings.spec.ts** (Priority: HIGH)

**Purpose**: Test the weather settings dialog and preferences

**Test Cases**:

#### Opening the Dialog
- [ ] Should open weather settings from dashboard quick actions
- [ ] Should open weather settings from nav menu/settings
- [ ] Should show correct initial state (enabled/disabled)

#### Toggling Weather On/Off
- [ ] Should enable weather successfully
- [ ] Should request location when enabling weather
- [ ] Should disable weather successfully
- [ ] Should show toast notification on save
- [ ] Should close dialog after successful save

#### Location Detection
- [ ] Should detect browser location when enabled
- [ ] Should show loading state during location detection
- [ ] Should display detected coordinates
- [ ] Should handle permission denied gracefully
- [ ] Should show error message if location fails

#### Manual Location Entry
- [ ] Should accept ZIP code input (e.g., "10001")
- [ ] Should accept city name input (e.g., "New York, NY")
- [ ] Should geocode location on button click
- [ ] Should geocode location on Enter key
- [ ] Should show loading state during geocoding
- [ ] Should display geocoded location details
- [ ] Should show error for invalid location
- [ ] Should allow clearing manual location

#### Weather Data Display
- [ ] Should show current weather when available
- [ ] Should show temperature, humidity, and rain probability
- [ ] Should show "fallback data" badge when API fails
- [ ] Should show "Weather data is active!" when successful

#### Features Info Section
- [ ] Should display weather features list
- [ ] Should show appropriate icons for each feature

---

### 2. **weather-location-management.spec.ts** (Priority: HIGH)

**Purpose**: Test location detection and management flows

**Test Cases**:

#### Browser Location
- [ ] Should request browser location permission
- [ ] Should show "Detecting your location..." message
- [ ] Should display lat/long when successful
- [ ] Should show permission denied error
- [ ] Should show "Detect My Location" button when not detected

#### Manual Location Priority
- [ ] Should use manual location over browser location
- [ ] Should show manual location takes precedence
- [ ] Should clear manual location and revert to browser

#### Location Validation
- [ ] Should validate ZIP code format (5 digits)
- [ ] Should accept ZIP+4 format (12345-6789)
- [ ] Should accept international city names
- [ ] Should show error for gibberish input
- [ ] Should show error for empty input

#### Location Persistence
- [ ] Should save location preference to database
- [ ] Should reload saved location on page refresh
- [ ] Should maintain location across sessions

---

### 3. **weather-mood-banner.spec.ts** (Priority: MEDIUM)

**Purpose**: Test the weather mood banner display and states

**Test Cases**:

#### Banner Visibility
- [ ] Should show weather mood banner when weather enabled
- [ ] Should NOT show banner when weather disabled
- [ ] Should show banner on dashboard only (or other pages?)

#### Mood States
- [ ] Should show "excellent" mood for perfect conditions
- [ ] Should show "great" mood for pleasant weather
- [ ] Should show "good" mood for moderate weather
- [ ] Should show "fair" mood for challenging weather
- [ ] Should show "challenging" mood for extreme weather

#### Content Display
- [ ] Should display mood-appropriate message
- [ ] Should show plant care advice
- [ ] Should display current temperature
- [ ] Should display humidity percentage
- [ ] Should display rain probability (when > 0%)
- [ ] Should show mood indicator bars (1-5)

#### Special Events
- [ ] Should show special event alert for extreme heat
- [ ] Should show special event alert for freeze warning
- [ ] Should show special event alert for perfect conditions

#### Gradient/Animation
- [ ] Should apply correct gradient for mood
- [ ] Should show animated background effects
- [ ] Should have good contrast in dark mode

---

### 4. **weather-schedule-integration.spec.ts** (Priority: MEDIUM)

**Purpose**: Test weather integration with watering schedules

**Test Cases**:

#### Smart Watering Wizard
- [ ] Should show weather toggle in wizard
- [ ] Should include weather factors in schedule calculation
- [ ] Should display weather-adjusted schedule
- [ ] Should show schedule changes due to weather

#### Schedule Adjustments
- [ ] Should adjust for extreme heat (more frequent)
- [ ] Should adjust for cold weather (less frequent)
- [ ] Should adjust for high humidity (less frequent)
- [ ] Should adjust for low humidity (more frequent)
- [ ] Should adjust for long daylight (more frequent)
- [ ] Should adjust for short daylight (less frequent)

#### Weather Indicator on Dashboard
- [ ] Should show current weather conditions
- [ ] Should show weather icons (sun, rain, snow, etc.)
- [ ] Should show temperature in user's preferred unit
- [ ] Should have refresh button
- [ ] Should update when refresh clicked
- [ ] Should show loading state during refresh

---

### 5. **rain-delay.spec.ts** (Priority: HIGH)

**Purpose**: Test rain delay feature for outdoor plants

**Test Cases**:

#### Outdoor Plant Management
- [ ] Should show "outdoor plant" checkbox in add plant form
- [ ] Should show "outdoor plant" checkbox in edit plant form
- [ ] Should save outdoor plant status
- [ ] Should display outdoor plant badge on plant card

#### Rain Delay Logic
- [ ] Should delay watering when rain > 30% probability
- [ ] Should show rain delay notification on dashboard
- [ ] Should show reason for delay (rain probability %)
- [ ] Should NOT delay indoor plants
- [ ] Should NOT delay when rain < 30%

#### Rain Delay Notification
- [ ] Should show notification with plant names
- [ ] Should show days delayed
- [ ] Should allow dismissing notification
- [ ] Should show "Learn More" or help text
- [ ] Should update when weather changes

#### Rain Delay Override
- [ ] Should allow user to water anyway
- [ ] Should show confirmation before override
- [ ] Should mark as watered when overridden

---

### 6. **weather-error-handling.spec.ts** (Priority: MEDIUM)

**Purpose**: Test error states and edge cases

**Test Cases**:

#### API Failures
- [ ] Should show fallback data when API fails
- [ ] Should show "Using fallback data" badge
- [ ] Should allow retry after API failure
- [ ] Should show error message for network issues

#### Permission Issues
- [ ] Should handle location permission denied
- [ ] Should show manual location option when permission denied
- [ ] Should save user's choice (don't ask again)

#### Invalid Data
- [ ] Should handle invalid weather API response
- [ ] Should handle missing temperature data
- [ ] Should handle missing location data
- [ ] Should handle invalid coordinates

#### Edge Cases
- [ ] Should handle user disabling weather mid-use
- [ ] Should handle clearing all location data
- [ ] Should handle switching between locations quickly
- [ ] Should handle offline mode gracefully
- [ ] Should handle very old cached data

---

### 7. **weather-enable-prompt.spec.ts** (Priority: LOW)

**Purpose**: Test the prompt to enable weather features

**Test Cases**:

#### Prompt Display
- [ ] Should show enable weather prompt for new users
- [ ] Should NOT show prompt if weather already enabled
- [ ] Should show prompt in appropriate location (dashboard?)

#### Prompt Actions
- [ ] Should enable weather when "Enable" clicked
- [ ] Should open weather settings when clicked
- [ ] Should dismiss prompt when "Dismiss" clicked
- [ ] Should not show again after dismissal (within timeframe)

---

## Test Utilities to Create

### Mock Helpers

Create `tests/utils/weather-mocks.ts`:

```typescript
/**
 * Mock weather API responses
 */
export function mockWeatherApiSuccess(page: Page) {
  return page.route('**/api.openweathermap.org/**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        main: { temp: 22, humidity: 55 },
        sys: { sunrise: 1234567890, sunset: 1234567890 + 43200 },
        // ... other fields
      }),
    });
  });
}

export function mockWeatherApiFailure(page: Page) {
  return page.route('**/api.openweathermap.org/**', (route) => {
    route.abort('failed');
  });
}

export function mockGeolocationSuccess(context: BrowserContext) {
  return context.grantPermissions(['geolocation']);
}

export function mockGeolocationDenied(context: BrowserContext) {
  return context.grantPermissions([]);
}
```

### Test Data

Create `tests/fixtures/weather-data.ts`:

```typescript
export const MOCK_WEATHER_DATA = {
  excellent: {
    temp: 22,
    humidity: 50,
    rainProbability: 10,
  },
  challenging: {
    temp: 38,
    humidity: 20,
    rainProbability: 0,
  },
  rainy: {
    temp: 18,
    humidity: 75,
    rainProbability: 85,
  },
};

export const MOCK_LOCATIONS = {
  newYork: {
    latitude: 40.7128,
    longitude: -74.0060,
    city: 'New York',
    country: 'US',
  },
  sanFrancisco: {
    latitude: 37.7749,
    longitude: -122.4194,
    city: 'San Francisco',
    country: 'US',
  },
};
```

---

## Testing Strategy

### Test Approach

1. **Use Mocking for Weather APIs**:
   - Mock OpenWeather API responses to avoid rate limits
   - Mock geolocation API for consistent tests
   - Use fixtures for predictable test data

2. **Test User Flows, Not Implementation**:
   - Focus on what users see and do
   - Don't test internal state unless necessary
   - Verify visual feedback (toasts, loading states, errors)

3. **Test Both Happy and Sad Paths**:
   - Test successful flows
   - Test error handling
   - Test edge cases

4. **Ensure Accessibility**:
   - Test keyboard navigation
   - Test screen reader compatibility
   - Test ARIA labels

### Test Organization Principles

1. **One feature per file**: Each test file focuses on one aspect
2. **Descriptive test names**: `should [action] when [condition]`
3. **Independent tests**: Each test can run alone
4. **Setup and teardown**: Use `beforeEach` and `afterEach`
5. **Reusable helpers**: Extract common actions to utilities

---

## Priority Levels

### High Priority (Implement First)
1. **weather-settings.spec.ts** - Core feature
2. **weather-location-management.spec.ts** - Critical user flow
3. **rain-delay.spec.ts** - Key differentiating feature

### Medium Priority (Implement Next)
4. **weather-mood-banner.spec.ts** - User-facing feature
5. **weather-schedule-integration.spec.ts** - Important integration
6. **weather-error-handling.spec.ts** - Robustness

### Low Priority (Nice to Have)
7. **weather-enable-prompt.spec.ts** - One-time flow

---

## Implementation Timeline

### Phase 1 (Week 1): Core Features
- Set up weather mocks and fixtures
- Implement `weather-settings.spec.ts`
- Implement `weather-location-management.spec.ts`

### Phase 2 (Week 2): Key Features
- Implement `rain-delay.spec.ts`
- Implement `weather-mood-banner.spec.ts`

### Phase 3 (Week 3): Integration & Edge Cases
- Implement `weather-schedule-integration.spec.ts`
- Implement `weather-error-handling.spec.ts`

### Phase 4 (Week 4): Polish
- Implement `weather-enable-prompt.spec.ts`
- Fix any flaky tests
- Add documentation

---

## Success Metrics

- **Coverage**: 80%+ of weather user flows tested
- **Reliability**: < 5% flaky test rate
- **Speed**: Tests run in < 3 minutes total
- **Maintainability**: Clear test names, good documentation

---

## Notes

- All tests should work with both authenticated and unauthenticated states
- Tests should handle both light and dark mode
- Tests should verify contrast/accessibility improvements
- Consider visual regression testing for banners (Playwright screenshots)

---

## Next Steps

1. Review and approve this plan
2. Create test utilities (`weather-mocks.ts`, `weather-data.ts`)
3. Start with Phase 1 implementation
4. Run tests in CI/CD pipeline
5. Monitor and improve flaky tests


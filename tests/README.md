# Playwright Testing Infrastructure

This document provides comprehensive information about the Playwright testing setup for SproutHub, including setup instructions, test organization, and best practices.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- The app running on `http://localhost:8080`

### Installation
```bash
# Install Playwright browsers
npm run test:e2e:install

# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## 📁 Test Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── auth/               # Authentication flow tests
│   │   └── authentication.spec.ts
│   └── watering/            # Smart watering system tests
│       └── smart-watering.spec.ts
├── fixtures/               # Test data and fixtures
│   └── test-fixtures.ts
├── page-objects/           # Page Object Model
│   ├── AuthPage.ts
│   └── SmartWateringPage.ts
├── utils/                  # Test utilities
│   └── test-utils.ts
├── global-setup.ts        # Global test setup
└── global-teardown.ts     # Global test cleanup
```

## 🧪 Test Coverage

### Authentication Tests
- ✅ Sign in form validation
- ✅ Sign up form validation  
- ✅ Password visibility toggle
- ✅ Form validation and error handling
- ✅ Session persistence
- ✅ Redirect after login
- ✅ Tab navigation between sign in/up

### Smart Watering System Tests (16 tests total)
- ✅ Complete wizard flow with all factors
- ✅ Plant size selection and impact on watering frequency
- ✅ Environmental factors (light level, temperature, humidity)
- ✅ Care preferences (care style, soil type)
- ✅ Weather data integration with location permission dialog
- ✅ Schedule calculation validation with proper adjustments
- ✅ Error handling for weather API failures
- ✅ Step navigation and validation (next button states)
- ✅ Minimum and maximum watering interval enforcement
- ✅ Confidence level display based on environmental factors
- ✅ Schedule application and wizard closure
- ✅ Navigation between wizard steps
- ✅ Required field validation before proceeding

## 🔧 Configuration

### Playwright Config (`playwright.config.ts`)
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Parallel execution**: Enabled for faster test runs
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots**: On failure only
- **Videos**: Retained on failure
- **Traces**: On first retry
- **Base URL**: `http://localhost:8080`

### Environment Variables
```bash
# Optional: Override base URL
PLAYWRIGHT_BASE_URL=http://localhost:3000

# CI environment
CI=true
```

## 🛠️ Test Utilities

### TestUtils Class
Provides common testing functionality:

```typescript
// Wait for app to load
await testUtils.waitForAppLoad();

// Clear browser storage
await testUtils.clearStorage();

// Mock geolocation
await testUtils.mockGeolocation(40.7128, -74.0060);

// Mock weather API
await testUtils.mockSuccessfulWeatherResponse();

// Take screenshots
await testUtils.takeScreenshot('test-name');

// Wait for toast notifications
await testUtils.waitForToast('success');
```

### Page Objects
Encapsulate page interactions:

```typescript
// AuthPage
await authPage.fillSignInForm(email, password);
await authPage.submitSignIn();
await authPage.expectSignInFormVisible();

// SmartWateringPage  
await smartWateringPage.openWizard();
await smartWateringPage.selectPlantSize('medium');
await smartWateringPage.completeWizardFlow(factors);
```

## 📊 Test Data

### User Test Data
```typescript
testUsers = {
  validUser: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    username: 'testuser'
  },
  invalidUser: {
    email: 'invalid@example.com', 
    password: 'wrongpassword'
  }
}
```

### Plant Test Data
```typescript
testPlants = {
  smallPlant: { name: 'Test Small Plant', type: 'Succulent', size: 'small' },
  mediumPlant: { name: 'Test Medium Plant', type: 'Monstera', size: 'medium' },
  largePlant: { name: 'Test Large Plant', type: 'Fiddle Leaf Fig', size: 'large' }
}
```

### Smart Watering Test Data
```typescript
// Environmental factors (must match actual UI data-testid values)
environmentalFactors = {
  lightLevel: ['low', 'medium', 'high'],
  temperature: ['cool', 'normal', 'warm'], 
  humidity: ['dry', 'normal', 'humid']
}

// Care preferences (must match actual UI data-testid values)
carePreferences = {
  careStyle: ['frequent', 'balanced', 'minimal'],
  soilType: ['regular', 'draining', 'retaining']
}

// Plant sizes
plantSizes = ['small', 'medium', 'large']
```

## 🎯 Writing Tests

### Basic Test Structure
```typescript
import { test, expect } from '../fixtures/test-fixtures';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
  });

  test('should do something', async ({ authPage }) => {
    // Test implementation
  });
});
```

### Best Practices

1. **Use Page Objects**: Encapsulate page interactions
2. **Use Test Fixtures**: Share test data and utilities
3. **Clear State**: Always clear storage between tests
4. **Wait for Elements**: Use proper wait strategies
5. **Mock External APIs**: Mock weather and location services
6. **Take Screenshots**: On failures for debugging
7. **Descriptive Names**: Use clear, descriptive test names

### Example Test
```typescript
test('should complete smart watering wizard flow', async ({ smartWateringPage }) => {
  await smartWateringPage.openWizard();
  
  const factors = {
    plantSize: 'medium',
    lightLevel: 'medium', 
    temperature: 'normal',
    humidity: 'normal',
    careStyle: 'balanced',
    soilType: 'draining',
    useWeatherData: false
  };
  
  await smartWateringPage.completeWizardFlow(factors);
  
  await expect(smartWateringPage.recommendedDays).toBeVisible();
  await smartWateringPage.applySchedule();
});
```

### Smart Watering Test Patterns
```typescript
// Test environmental factor impact
test('should adjust schedule based on humidity', async ({ smartWateringPage }) => {
  await smartWateringPage.openWizard();
  
  // Test dry humidity (should increase watering frequency)
  await smartWateringPage.selectPlantSize('medium');
  await smartWateringPage.goToNextStep();
  
  await smartWateringPage.setLightLevel('medium');
  await smartWateringPage.setTemperature('normal');
  await smartWateringPage.setHumidity('dry');
  await smartWateringPage.goToNextStep();
  
  await smartWateringPage.selectCareStyle('balanced');
  await smartWateringPage.selectSoilType('draining');
  await smartWateringPage.goToNextStep();
  
  const dryHumidityDays = await smartWateringPage.getRecommendedDays();
  
  // Test humid conditions (should decrease watering frequency)
  await smartWateringPage.goToPreviousStep();
  await smartWateringPage.setHumidity('humid');
  await smartWateringPage.goToNextStep();
  
  const humidDays = await smartWateringPage.getRecommendedDays();
  
  expect(dryHumidityDays).toBeLessThan(humidDays);
});
```

## 🐛 Debugging

### Debug Mode
```bash
# Run specific test in debug mode
npm run test:e2e:debug -- --grep "should complete wizard flow"

# Run with UI mode for interactive debugging
npm run test:e2e:ui
```

### Screenshots and Videos
- Screenshots: Automatically captured on test failures
- Videos: Recorded for failed tests
- Traces: Available for debugging network issues

### Common Issues

1. **App not running**: Ensure dev server is running on port 8080
2. **Element not found**: Check if test-id attributes are present
3. **Timing issues**: Use proper wait strategies
4. **API failures**: Mock external services
5. **Next button disabled**: Ensure all required wizard steps are completed before proceeding
6. **Location permission dialog**: Handle the LocationPermissionDialog that appears when weather data is enabled
7. **Number extraction errors**: Use regex to extract numbers from text like "Every 5 days"
8. **Dialog not closing**: Ensure both SmartWateringWizard and AddPlantDialog are properly closed

### Smart Watering Specific Issues

1. **Test data mismatch**: Use correct data-testid values:
   - Temperature: `cool`, `normal`, `warm` (not `moderate`)
   - Humidity: `dry`, `normal`, `humid` (not `low`, `medium`, `high`)
   - Care style: `frequent`, `balanced`, `minimal` (not `moderate`)
   - Soil type: `regular`, `draining`, `retaining` (not `well-draining`)

2. **Calculation logic**: The smart watering calculation adjusts watering frequency based on:
   - Dry air → more frequent watering (fewer days)
   - High light → more frequent watering (fewer days)
   - Warm temps → more frequent watering (fewer days)
   - Humid air → less frequent watering (more days)
   - Low light → less frequent watering (more days)
   - Cool temps → less frequent watering (more days)

3. **Weather data integration**: When `useWeatherData: true`, the LocationPermissionDialog appears and must be handled

## 🚀 CI/CD Integration

### GitHub Actions Example
```yaml
- name: Install Playwright
  run: npm run test:e2e:install

- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true
```

### Test Reports
- HTML reports: `playwright-report/index.html`
- JSON results: `test-results/results.json`
- JUnit XML: `test-results/results.xml`

## 📈 Performance

### Optimization Tips
1. **Parallel Execution**: Tests run in parallel by default
2. **Selective Testing**: Use `--grep` to run specific tests
3. **Browser Selection**: Run only needed browsers
4. **Mock Services**: Avoid real API calls in tests

### Running Specific Tests
```bash
# Run only authentication tests
npm run test:e2e -- --grep "Authentication"

# Run only smart watering tests  
npm run test:e2e -- --grep "Smart Watering"

# Run specific browser
npm run test:e2e -- --project=chromium
```

## 🔄 Maintenance

### Adding New Tests
1. Create test file in appropriate directory
2. Use existing page objects or create new ones
3. Add test data to fixtures if needed
4. Follow naming conventions
5. Update documentation

### Updating Page Objects
1. Add new methods for page interactions
2. Use descriptive method names
3. Include proper wait strategies
4. Add validation methods

### Test Data Management
1. Keep test data in fixtures
2. Use realistic but safe test data
3. Avoid hardcoded values
4. Consider data cleanup

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)
- [Best Practices](https://playwright.dev/docs/best-practices)

## 🔧 Recent Improvements (Latest Update)

### Smart Watering Test Fixes
- **Fixed calculation logic**: Corrected humidity, light level, and temperature adjustments in `smartWateringSchedule.ts`
- **Updated test data**: Aligned test values with actual UI data-testid attributes
- **Improved wizard flow**: Ensured all required steps are completed before proceeding
- **Enhanced dialog handling**: Properly close both SmartWateringWizard and AddPlantDialog
- **Fixed number extraction**: Use regex to parse "Every X days" text format
- **Weather data integration**: Handle LocationPermissionDialog that appears when weather data is enabled
- **Validation improvements**: Check button states instead of attempting to click disabled buttons

### Test Reliability Improvements
- All 16 smart watering tests now pass consistently across Chrome, Firefox, and Safari
- Reduced flaky test behavior through proper wait strategies
- Better error handling for external API failures
- Improved test isolation with proper cleanup between tests

## 🤝 Contributing

When adding new tests:
1. Follow the existing structure and patterns
2. Add appropriate test data to fixtures
3. Update this documentation
4. Ensure tests are reliable and maintainable
5. Consider edge cases and error scenarios
6. Use correct data-testid values that match the actual UI
7. Handle all dialogs and modals properly
8. Test across multiple browsers for consistency

---

**Note**: This testing infrastructure focuses on core user journeys for authentication and smart watering functionality. Additional test coverage can be added following the same patterns and structure.

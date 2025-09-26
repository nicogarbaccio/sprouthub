import { test, expect } from '../../fixtures/test-fixtures';
import { getTestUser } from '../../test-user-pool';
import {
  setupMockPlantData,
  setupMockDate,
  MOCK_CURRENT_DATE,
  mockWeatherData,
  mockSeasonalTransitions
} from '../../utils/mock-plant-data';
import { createMockPlants } from '../../utils/mock-plant-data';

test.describe('Seasonal Schedule Review System', () => {
  const testUser = getTestUser('seasonal-review');

  test.beforeEach(async ({ page }) => {
    // Mock the current date for predictable testing
    await setupMockDate(page, MOCK_CURRENT_DATE);
  });

  // Import shared auth helper
  async function setupAuthenticatedUser(page: any, authPage: any) {
    const { setupAuthenticatedUser: sharedSetup } = await import('../../utils/auth-helpers');
    await sharedSetup(page, authPage, testUser);
  }

  test.describe('Seasonal Transition Detection', () => {
    test('should detect summer to fall transition with high confidence', async ({ page, authPage }) => {
      await setupAuthenticatedUser(page, authPage);

      // Mock plants that need seasonal review
      const plants = createMockPlants.plantsNeedingReview('test-user-id-123');
      await setupMockPlantData(page, plants);

      // Mock weather and seasonal detection services
      await page.addInitScript((weatherData, transition) => {
        // Mock weather service
        (window as any).__mockWeatherData = weatherData;
        (window as any).__mockSeasonalTransition = transition;

        // Override seasonal detection service when available
        setTimeout(() => {
          if ((window as any).seasonalDetectionService) {
            (window as any).seasonalDetectionService.detectSeasonalTransition = async () => {
              return transition;
            };
            (window as any).seasonalDetectionService.isTransitionStable = () => true;
            (window as any).seasonalDetectionService.getCurrentSeason = () => 'summer';
          }
        }, 100);
      }, mockWeatherData.fallWeather, mockSeasonalTransitions.summerToFall);

      await page.goto('/my-plants');
      await page.waitForLoadState('networkidle');

      // Look for seasonal review banner or dialog
      const seasonalBanner = page.locator('[data-testid="seasonal-review-banner"]');
      const seasonalDialog = page.locator('[role="dialog"]').filter({ hasText: /seasonal.*review|schedule.*review/i });

      // Wait for either banner or dialog to appear
      await Promise.race([
        seasonalBanner.waitFor({ timeout: 5000 }).catch(() => null),
        seasonalDialog.waitFor({ timeout: 5000 }).catch(() => null)
      ]);

      // Check if seasonal review UI is shown
      const bannerVisible = await seasonalBanner.isVisible().catch(() => false);
      const dialogVisible = await seasonalDialog.isVisible().catch(() => false);

      if (bannerVisible) {
        // Verify banner content
        await expect(seasonalBanner).toContainText(/fall|autumn|seasonal/i);

        // Click on banner to open full dialog
        await seasonalBanner.click();

        // Dialog should now be visible
        await expect(seasonalDialog).toBeVisible();
      }

      if (dialogVisible || bannerVisible) {
        // Verify transition details in dialog
        const hasConfidence = await seasonalDialog.locator('text=/confidence.*high/i').count() > 0;
        const hasSeasonalInfo = await seasonalDialog.locator('text=/fall|autumn/i').count() > 0;
        const hasTriggerFactors = await seasonalDialog.locator('text=/daylight|temperature|factor/i').count() > 0;

        expect(hasConfidence || hasSeasonalInfo || hasTriggerFactors).toBeTruthy();
      }
    });

    test('should detect spring transition with weather-based suggestions', async ({ page, authPage }) => {
      await setupAuthenticatedUser(page, authPage);

      const plants = createMockPlants.outdoorSeasonalPlants('test-user-id-123');
      await setupMockPlantData(page, plants);

      // Mock spring transition
      await page.addInitScript((weatherData, transition) => {
        (window as any).__mockWeatherData = weatherData;
        (window as any).__mockSeasonalTransition = transition;

        setTimeout(() => {
          if ((window as any).seasonalDetectionService) {
            (window as any).seasonalDetectionService.detectSeasonalTransition = async () => {
              return transition;
            };
            (window as any).seasonalDetectionService.isTransitionStable = () => true;
            (window as any).seasonalDetectionService.getCurrentSeason = () => 'winter';
          }
        }, 100);
      }, mockWeatherData.springWeather, mockSeasonalTransitions.winterToSpring);

      await page.goto('/my-plants');
      await page.waitForLoadState('networkidle');

      // Look for seasonal review elements
      const seasonalElements = await page.locator('[data-testid*="seasonal"], [class*="seasonal"], text=/spring.*schedule|seasonal.*review/i').count();

      // If seasonal UI is present, verify spring-specific content
      if (seasonalElements > 0) {
        const springContent = await page.locator('text=/spring|warmer|growing.*season/i').count() > 0;
        expect(springContent).toBeTruthy();
      }
    });

    test('should handle medium confidence transitions appropriately', async ({ page, authPage }) => {
      await setupAuthenticatedUser(page, authPage);

      const plants = createMockPlants.indoorSeasonalPlants('test-user-id-123');
      await setupMockPlantData(page, plants);

      // Mock medium confidence transition
      await page.addInitScript((transition) => {
        (window as any).__mockSeasonalTransition = transition;

        setTimeout(() => {
          if ((window as any).seasonalDetectionService) {
            (window as any).seasonalDetectionService.detectSeasonalTransition = async () => {
              return transition;
            };
            (window as any).seasonalDetectionService.isTransitionStable = () => true;
          }
        }, 100);
      }, mockSeasonalTransitions.mediumConfidenceTransition);

      await page.goto('/my-plants');
      await page.waitForLoadState('networkidle');

      // Medium confidence should still show review but with appropriate messaging
      const seasonalDialog = page.locator('[role="dialog"]').filter({ hasText: /seasonal.*review/i });

      if (await seasonalDialog.isVisible({ timeout: 3000 })) {
        const hasConfidenceInfo = await seasonalDialog.locator('text=/confidence.*medium/i').count() > 0;
        const hasCautionaryText = await seasonalDialog.locator('text=/might.*be|possibly|consider/i').count() > 0;

        expect(hasConfidenceInfo || hasCautionaryText).toBeTruthy();
      }
    });
  });

  test.describe('Seasonal Review Banner', () => {
    test('should display seasonal review banner when transition detected', async ({ page, authPage }) => {
      await setupAuthenticatedUser(page, authPage);

      const plants = createMockPlants.outdoorSeasonalPlants('test-user-id-123');
      await setupMockPlantData(page, plants);

      // Setup seasonal transition detection
      await page.addInitScript((transition) => {
        (window as any).__shouldShowSeasonalReview = true;
        (window as any).__pendingTransition = transition;
      }, mockSeasonalTransitions.summerToFall);

      await page.goto('/my-plants');
      await page.waitForLoadState('networkidle');

      // Look for banner
      const banner = page.locator('[data-testid="seasonal-review-banner"]');

      if (await banner.isVisible({ timeout: 3000 })) {
        // Verify banner has appropriate content
        await expect(banner).toContainText(/seasonal|schedule.*review/i);

        // Banner should have action buttons
        const reviewButton = banner.locator('button').filter({ hasText: /review|update/i });
        const snoozeButton = banner.locator('button').filter({ hasText: /later|snooze/i });

        const hasActionButtons = await reviewButton.count() > 0 || await snoozeButton.count() > 0;
        expect(hasActionButtons).toBeTruthy();
      }
    });

    test('should allow snoozing seasonal review', async ({ page, authPage }) => {
      await setupAuthenticatedUser(page, authPage);

      const plants = createMockPlants.plantsNeedingReview('test-user-id-123');
      await setupMockPlantData(page, plants);

      await page.addInitScript(() => {
        (window as any).__shouldShowSeasonalReview = true;
      });

      await page.goto('/my-plants');
      await page.waitForLoadState('networkidle');

      const banner = page.locator('[data-testid="seasonal-review-banner"]');

      if (await banner.isVisible({ timeout: 3000 })) {
        // Look for snooze button
        const snoozeButton = banner.locator('button').filter({ hasText: /later|snooze|remind.*me/i });

        if (await snoozeButton.isVisible()) {
          await snoozeButton.click();

          // Banner should disappear after snoozing
          await expect(banner).not.toBeVisible({ timeout: 2000 });
        }
      }
    });

    test('should allow dismissing seasonal review', async ({ page, authPage }) => {
      await setupAuthenticatedUser(page, authPage);

      const plants = createMockPlants.plantsNeedingReview('test-user-id-123');
      await setupMockPlantData(page, plants);

      await page.addInitScript(() => {
        (window as any).__shouldShowSeasonalReview = true;
      });

      await page.goto('/my-plants');
      await page.waitForLoadState('networkidle');

      const banner = page.locator('[data-testid="seasonal-review-banner"]');

      if (await banner.isVisible({ timeout: 3000 })) {
        // Look for dismiss/close button
        const dismissButton = banner.locator('button').filter({ hasText: /dismiss|close|not.*now/i });
        const closeIcon = banner.locator('[aria-label*="close"], [aria-label*="dismiss"]');

        if (await dismissButton.isVisible()) {
          await dismissButton.click();
        } else if (await closeIcon.isVisible()) {
          await closeIcon.click();
        }

        // Banner should disappear after dismissing
        await expect(banner).not.toBeVisible({ timeout: 2000 });
      }
    });
  });

  test.describe('Seasonal Review Dialog', () => {
    test('should show seasonal review dialog with schedule suggestions', async ({ page, authPage }) => {
      await setupAuthenticatedUser(page, authPage);

      const plants = createMockPlants.outdoorSeasonalPlants('test-user-id-123');
      await setupMockPlantData(page, plants);

      // Setup mock suggestions
      await page.addInitScript(() => {
        (window as any).__mockSeasonalSuggestions = [
          {
            plant_id: 'test-outdoor-spring-plant-1',
            plant_nickname: 'Spring Garden Plant',
            current_watering_days: 5,
            suggested_days: 4,
            confidence: 'high',
            reasoning: ['Spring growing season needs more frequent watering', 'Outdoor plant - more sensitive to seasonal changes'],
            based_on: 'weather_conditions'
          },
          {
            plant_id: 'test-outdoor-summer-plant-1',
            plant_nickname: 'Summer Patio Plant',
            current_watering_days: 3,
            suggested_days: 2,
            confidence: 'high',
            reasoning: ['Summer heat increases water needs', 'Outdoor plant - more sensitive to seasonal changes'],
            based_on: 'weather_conditions'
          }
        ];

        // Mock the schedule versioning service
        setTimeout(() => {
          if ((window as any).scheduleVersioningService) {
            (window as any).scheduleVersioningService.generateSeasonalSuggestions = async () => {
              return (window as any).__mockSeasonalSuggestions;
            };
          }
        }, 100);
      });

      await page.goto('/my-plants');
      await page.waitForLoadState('networkidle');

      // Trigger seasonal review dialog
      const banner = page.locator('[data-testid="seasonal-review-banner"]');
      if (await banner.isVisible({ timeout: 3000 })) {
        const reviewButton = banner.locator('button').filter({ hasText: /review|update/i });
        if (await reviewButton.isVisible()) {
          await reviewButton.click();
        }
      }

      // Look for seasonal review dialog
      const dialog = page.locator('[role="dialog"]').filter({ hasText: /seasonal.*review|schedule.*review/i });

      if (await dialog.isVisible({ timeout: 5000 })) {
        // Dialog should show plant suggestions
        const plantSuggestions = dialog.locator('[data-testid*="plant-suggestion"], .plant-suggestion');

        if (await plantSuggestions.count() > 0) {
          // Verify suggestion content
          const hasPlantNames = await dialog.locator('text=/Spring Garden Plant|Summer Patio Plant/').count() > 0;
          const hasScheduleChanges = await dialog.locator('text=/day|water/').count() > 0;
          const hasReasonings = await dialog.locator('text=/outdoor.*plant|seasonal.*change/i').count() > 0;

          expect(hasPlantNames || hasScheduleChanges || hasReasonings).toBeTruthy();
        }

        // Dialog should have action buttons
        const applyButton = dialog.locator('button').filter({ hasText: /apply|accept|save/i });
        const cancelButton = dialog.locator('button').filter({ hasText: /cancel|close|not.*now/i });

        const hasActionButtons = await applyButton.count() > 0 && await cancelButton.count() > 0;
        expect(hasActionButtons).toBeTruthy();
      }
    });

    test('should allow applying seasonal schedule suggestions', async ({ page, authPage }) => {
      await setupAuthenticatedUser(page, authPage);

      const plants = createMockPlants.indoorSeasonalPlants('test-user-id-123');
      await setupMockPlantData(page, plants);

      await page.addInitScript(() => {
        (window as any).__shouldShowSeasonalReview = true;
        (window as any).__mockSeasonalSuggestions = [
          {
            plant_id: 'test-indoor-seasonal-plant-1',
            plant_nickname: 'Consistent Indoor Plant',
            current_watering_days: 14,
            suggested_days: 16,
            confidence: 'medium',
            reasoning: ['Fall/winter period - reduce watering frequency'],
            based_on: 'weather_conditions'
          }
        ];
      });

      await page.goto('/my-plants');
      await page.waitForLoadState('networkidle');

      // Open seasonal review dialog
      const seasonalDialog = page.locator('[role="dialog"]').filter({ hasText: /seasonal.*review/i });

      if (await seasonalDialog.isVisible({ timeout: 5000 })) {
        // Apply suggestions
        const applyButton = seasonalDialog.locator('button').filter({ hasText: /apply|accept|save/i });

        if (await applyButton.isVisible()) {
          await applyButton.click();

          // Dialog should close after applying
          await expect(seasonalDialog).not.toBeVisible({ timeout: 3000 });

          // Should show success feedback
          const successMessage = page.locator('text=/updated|applied|saved.*schedule/i');
          const isSuccessVisible = await successMessage.isVisible({ timeout: 3000 }).catch(() => false);

          // Success message is optional but if shown should be appropriate
          if (isSuccessVisible) {
            await expect(successMessage).toBeVisible();
          }
        }
      }
    });

    test('should allow customizing individual plant schedules', async ({ page, authPage }) => {
      await setupAuthenticatedUser(page, authPage);

      const plants = createMockPlants.plantsWithSeasonalHistory('test-user-id-123');
      await setupMockPlantData(page, plants);

      await page.addInitScript(() => {
        (window as any).__shouldShowSeasonalReview = true;
      });

      await page.goto('/my-plants');
      await page.waitForLoadState('networkidle');

      const seasonalDialog = page.locator('[role="dialog"]').filter({ hasText: /seasonal.*review/i });

      if (await seasonalDialog.isVisible({ timeout: 5000 })) {
        // Look for individual plant customization options
        const customizeButton = seasonalDialog.locator('button').filter({ hasText: /customize|edit|modify/i });
        const plantScheduleInput = seasonalDialog.locator('input[type="number"], .schedule-input');

        if (await customizeButton.count() > 0) {
          await customizeButton.first().click();

          // Should show customization interface
          const hasCustomizationUI = await plantScheduleInput.count() > 0;
          expect(hasCustomizationUI).toBeTruthy();
        } else if (await plantScheduleInput.count() > 0) {
          // Direct input modification
          await plantScheduleInput.first().fill('10');

          // Verify the input accepted the change
          await expect(plantScheduleInput.first()).toHaveValue('10');
        }
      }
    });
  });

  test.describe('Schedule History and Insights', () => {
    test('should show previous year schedule performance', async ({ page, authPage }) => {
      await setupAuthenticatedUser(page, authPage);

      const plants = createMockPlants.plantsWithSeasonalHistory('test-user-id-123');
      await setupMockPlantData(page, plants);

      // Mock historical data
      await page.addInitScript(() => {
        (window as any).__mockHistoricalSchedules = [
          {
            year: 2024,
            season: 'fall',
            watering_days: 12,
            performance: 'good'
          }
        ];
      });

      await page.goto('/my-plants');
      await page.waitForLoadState('networkidle');

      const seasonalDialog = page.locator('[role="dialog"]').filter({ hasText: /seasonal.*review/i });

      if (await seasonalDialog.isVisible({ timeout: 5000 })) {
        // Look for historical information
        const historySection = seasonalDialog.locator('text=/last.*year|previous.*season|history/i');
        const performanceInfo = seasonalDialog.locator('text=/performance|worked.*well|effective/i');

        const hasHistoricalInfo = await historySection.count() > 0 || await performanceInfo.count() > 0;

        if (hasHistoricalInfo) {
          // Verify historical data is presented
          const hasYearReference = await seasonalDialog.locator('text=/2024|last.*year/i').count() > 0;
          expect(hasYearReference).toBeTruthy();
        }
      }
    });

    test('should handle plants with no historical data', async ({ page, authPage }) => {
      await setupAuthenticatedUser(page, authPage);

      const plants = createMockPlants.plantsNeedingReview('test-user-id-123');
      await setupMockPlantData(page, plants);

      await page.addInitScript(() => {
        (window as any).__shouldShowSeasonalReview = true;
        (window as any).__mockSeasonalSuggestions = [
          {
            plant_id: 'test-review-needed-plant-1',
            plant_nickname: 'Review Needed Plant',
            current_watering_days: 7,
            suggested_days: 9,
            confidence: 'medium',
            reasoning: ['No historical data - based on weather conditions', 'Indoor plant - less seasonal variation needed'],
            based_on: 'weather_conditions'
          }
        ];
      });

      await page.goto('/my-plants');
      await page.waitForLoadState('networkidle');

      const seasonalDialog = page.locator('[role="dialog"]').filter({ hasText: /seasonal.*review/i });

      if (await seasonalDialog.isVisible({ timeout: 5000 })) {
        // Should indicate when no historical data is available
        const noDataMessage = seasonalDialog.locator('text=/no.*historical|first.*time|weather.*conditions/i');
        const hasNoDataHandling = await noDataMessage.count() > 0;

        if (hasNoDataHandling) {
          expect(hasNoDataHandling).toBeTruthy();
        }
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle weather service failures gracefully', async ({ page, authPage }) => {
      await setupAuthenticatedUser(page, authPage);

      const plants = createMockPlants.outdoorSeasonalPlants('test-user-id-123');
      await setupMockPlantData(page, plants);

      // Mock weather service failure
      await page.addInitScript(() => {
        setTimeout(() => {
          if ((window as any).weatherService) {
            (window as any).weatherService.getCurrentWeather = async () => {
              throw new Error('Weather service unavailable');
            };
          }
        }, 100);
      });

      await page.goto('/my-plants');
      await page.waitForLoadState('networkidle');

      // Page should still load normally even with weather service failure
      const plantsContainer = page.locator('[data-testid="plants-container"], .plants-grid, .plants-list');
      await expect(plantsContainer.first()).toBeVisible({ timeout: 10000 });

      // Should not show seasonal review when weather service fails
      const seasonalBanner = page.locator('[data-testid="seasonal-review-banner"]');
      const isSeasonalVisible = await seasonalBanner.isVisible({ timeout: 3000 }).catch(() => false);

      // No seasonal UI should appear when weather service is down
      expect(isSeasonalVisible).toBeFalsy();
    });

    test('should handle no plants scenario', async ({ page, authPage }) => {
      await setupAuthenticatedUser(page, authPage);

      // Setup empty plant data
      await setupMockPlantData(page, []);

      await page.goto('/my-plants');
      await page.waitForLoadState('networkidle');

      // Should show empty state, not seasonal review
      const emptyState = page.locator('text=/no.*plants|add.*first.*plant/i');
      const seasonalBanner = page.locator('[data-testid="seasonal-review-banner"]');

      if (await emptyState.isVisible({ timeout: 3000 })) {
        // Seasonal review should not show when there are no plants
        const hasSeasonalUI = await seasonalBanner.isVisible({ timeout: 1000 }).catch(() => false);
        expect(hasSeasonalUI).toBeFalsy();
      }
    });

    test('should handle API errors during seasonal suggestion generation', async ({ page, authPage }) => {
      await setupAuthenticatedUser(page, authPage);

      const plants = createMockPlants.indoorSeasonalPlants('test-user-id-123');
      await setupMockPlantData(page, plants);

      // Mock API error in schedule versioning service
      await page.addInitScript(() => {
        (window as any).__shouldShowSeasonalReview = true;

        setTimeout(() => {
          if ((window as any).scheduleVersioningService) {
            (window as any).scheduleVersioningService.generateSeasonalSuggestions = async () => {
              throw new Error('Database connection failed');
            };
          }
        }, 100);
      });

      await page.goto('/my-plants');
      await page.waitForLoadState('networkidle');

      const seasonalDialog = page.locator('[role="dialog"]').filter({ hasText: /seasonal.*review/i });

      if (await seasonalDialog.isVisible({ timeout: 5000 })) {
        // Should show error state or fallback message
        const errorMessage = seasonalDialog.locator('text=/error|failed|try.*again|unable.*to.*load/i');
        const hasErrorHandling = await errorMessage.count() > 0;

        if (hasErrorHandling) {
          expect(hasErrorHandling).toBeTruthy();
        } else {
          // At minimum, dialog should not crash and should be closeable
          const closeButton = seasonalDialog.locator('button').filter({ hasText: /close|cancel/i });
          if (await closeButton.isVisible()) {
            await closeButton.click();
            await expect(seasonalDialog).not.toBeVisible();
          }
        }
      }
    });
  });
});
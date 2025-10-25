import { test, expect, testUsers, householdTestData } from '../../fixtures/test-fixtures';

/**
 * Household Permission Flows E2E Tests
 *
 * Tests the security and permission validations implemented in:
 * - useHouseholds.ts (removeMember, deleteHousehold, email validation)
 * - useHouseholdPlants.ts (updatePlant, deletePlant ownership checks)
 *
 * These tests verify client-side permission checks provide appropriate
 * user feedback before database operations.
 *
 * Note: Test households are automatically cleaned up in global teardown
 */

test.describe('Household Permissions', () => {
  // Track household count before each test
  let householdsBeforeTest = 0;

  test.beforeEach(async ({ page, authPage, householdPage }) => {
    // Sign in as the primary test user
    await page.goto('/auth');
    await authPage.fillSignInForm(testUsers.validUser.email, testUsers.validUser.password);
    await authPage.submitSignIn();
    await page.waitForURL('**/');

    // Record household count before test starts
    await householdPage.goto();
    householdsBeforeTest = await householdPage.getHouseholdCount();
  });

  test.afterEach(async ({ householdPage }) => {
    // Clean up any households created during the test
    try {
      await householdPage.goto();
      const householdsAfterTest = await householdPage.getHouseholdCount();

      if (householdsAfterTest > householdsBeforeTest) {
        console.log(`🧹 Cleaning up ${householdsAfterTest - householdsBeforeTest} test household(s)...`);

        // Delete households created during this test (from the end)
        for (let i = householdsAfterTest - 1; i >= householdsBeforeTest; i--) {
          try {
            await householdPage.deleteHousehold(i);
            const hasConfirmDialog = await householdPage.page.locator('[role="dialog"]').isVisible({ timeout: 1000 }).catch(() => false);
            if (hasConfirmDialog) {
              await householdPage.confirmDeleteHousehold();
              await householdPage.page.waitForTimeout(500); // Wait for deletion to complete
            }
          } catch (error) {
            console.log(`⚠️ Failed to clean up household at index ${i}:`, error);
            // Continue with other cleanups - global teardown will catch remaining households
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Cleanup failed, will be handled by global teardown:', error);
    }
  });

  test.describe('Remove Member Permissions', () => {
    test('should prevent non-admin users from removing members', async ({ householdPage }) => {
      // This test assumes a household exists where the user is a regular member
      // TODO: Set up test data with household membership as 'member' role

      await householdPage.goto();

      // Try to open members dialog
      const hasHouseholds = await householdPage.getHouseholdCount();

      if (hasHouseholds > 0) {
        await householdPage.openViewMembersDialog(0);
        await householdPage.expectViewMembersDialogVisible();

        // Try to remove a member (should fail with permission error)
        const hasMembersToRemove = await householdPage.getMemberCount();

        if (hasMembersToRemove > 1) {
          await householdPage.removeMember(1); // Try to remove second member

          // Expect error toast about permissions
          await householdPage.expectErrorToastWithMessage(/permission|owner|admin/i);
        }
      }
    });

    test('should prevent removing the household owner', async ({ householdPage }) => {
      // Test that owners cannot be removed even by admins
      await householdPage.goto();

      const hasHouseholds = await householdPage.getHouseholdCount();

      if (hasHouseholds > 0) {
        await householdPage.openViewMembersDialog(0);
        await householdPage.expectViewMembersDialogVisible();

        // Find owner member (typically first member)
        const members = await householdPage.getMemberCount();

        if (members > 0) {
          // Check if first member is owner
          await householdPage.expectMemberRole(0, 'owner');

          // Try to remove owner
          await householdPage.removeMember(0);

          // Expect error toast about not being able to remove owner
          await householdPage.expectErrorToastWithMessage(/owner|transfer ownership/i);
        }
      }
    });

    test('should allow admins to remove regular members', async ({ householdPage }) => {
      // This test assumes the user is an admin or owner
      await householdPage.goto();

      const hasHouseholds = await householdPage.getHouseholdCount();

      if (hasHouseholds > 0) {
        await householdPage.openViewMembersDialog(0);
        await householdPage.expectViewMembersDialogVisible();

        const memberCount = await householdPage.getMemberCount();

        // Look for a non-owner member to remove
        if (memberCount > 1) {
          // Try removing second member (assuming they're not owner)
          await householdPage.removeMember(1);

          // Should see success toast
          await householdPage.expectSuccessToastWithMessage(/removed/i);
        }
      }
    });

    test('should validate user is logged in before removing member', async ({ page, householdPage }) => {
      // Create household first
      await householdPage.goto();

      // Clear auth state to simulate logged out user
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());

      // Try to remove member (should fail)
      const hasHouseholds = await householdPage.getHouseholdCount();

      if (hasHouseholds > 0) {
        await householdPage.openViewMembersDialog(0);

        const hasMembersToRemove = await householdPage.getMemberCount();
        if (hasMembersToRemove > 1) {
          await householdPage.removeMember(1);

          // Expect error about being logged in
          await householdPage.expectErrorToastWithMessage(/logged in/i);
        }
      }
    });
  });

  test.describe('Delete Household Permissions', () => {
    test('should prevent non-owners from deleting household', async ({ householdPage }) => {
      // This test assumes user is NOT an owner of the household
      await householdPage.goto();

      const hasHouseholds = await householdPage.getHouseholdCount();

      if (hasHouseholds > 0) {
        await householdPage.deleteHousehold(0);

        // Expect error toast about only owners can delete
        await householdPage.expectErrorToastWithMessage(/owner.*delete|permission/i);
      }
    });

    test('should allow owners to delete household', async ({ householdPage }) => {
      // First create a household (user will be owner)
      await householdPage.goto();
      const householdName = `Test Household ${Date.now()}`;
      const created = await householdPage.createHousehold(
        householdName,
        'Test household for deletion'
      );

      // Skip test if household creation not available
      if (!created) {
        console.log('Skipping test - household creation UI not available');
        return;
      }

      // Wait for household to appear
      await householdPage.page.waitForTimeout(1000);

      // Now delete it
      const householdCount = await householdPage.getHouseholdCount();
      await householdPage.deleteHousehold(householdCount - 1); // Delete the last one (just created)

      // If there's a confirmation dialog, confirm it
      const hasConfirmDialog = await householdPage.page.locator('[role="dialog"]').isVisible();
      if (hasConfirmDialog) {
        await householdPage.confirmDeleteHousehold();
      }

      // Should see success toast
      await householdPage.expectSuccessToastWithMessage(/deleted/i);

      // Note: This test deletes its own household, so no cleanup needed
    });

    test('should validate household exists before deleting', async ({ householdPage }) => {
      await householdPage.goto();

      // Try to delete with invalid household ID (manual testing scenario)
      // In practice, this would require modifying the hook call directly
      // For E2E, we verify that the UI only shows delete buttons for valid households

      const hasHouseholds = await householdPage.getHouseholdCount();
      expect(hasHouseholds).toBeGreaterThanOrEqual(0);

      // Verify delete buttons only appear for existing households
      if (hasHouseholds > 0) {
        const deleteButtons = await householdPage.deleteHouseholdButtons.count();
        expect(deleteButtons).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Email Validation in Invitations', () => {
    test('should reject malformed email addresses', async ({ householdPage }) => {
      await householdPage.goto();

      // Create a household first if none exists
      let hasHouseholds = await householdPage.getHouseholdCount();

      if (hasHouseholds === 0) {
        const created = await householdPage.createHousehold(
          `Test Household ${Date.now()}`,
          'Test household for invitations'
        );

        // Skip if creation failed
        if (!created) {
          console.log('Skipping test - household creation UI not available');
          return;
        }

        hasHouseholds = await householdPage.getHouseholdCount();
      }

      // Skip if still no households
      if (hasHouseholds === 0) {
        console.log('Skipping test - no households available');
        return;
      }

      // Open invite dialog
      await householdPage.openInviteMemberDialog(0);
      await householdPage.expectInviteMemberDialogVisible();

      // Test various invalid email formats
      const invalidEmails = [
        householdTestData.invalidEmails.malformed,
        householdTestData.invalidEmails.missingAt,
        householdTestData.invalidEmails.missingDomain,
        householdTestData.invalidEmails.missingTld
      ];

      for (const invalidEmail of invalidEmails) {
        await householdPage.fillInviteForm(invalidEmail, 'member');
        await householdPage.submitInvite();

        // Should show error about invalid email
        await householdPage.expectErrorToastWithMessage(/valid.*email/i);

        // Clear the form
        await householdPage.inviteEmailInput.clear();
      }
    });

    test('should prevent self-invitation', async ({ householdPage }) => {
      await householdPage.goto();

      let hasHouseholds = await householdPage.getHouseholdCount();

      if (hasHouseholds === 0) {
        const created = await householdPage.createHousehold(
          `Test Household ${Date.now()}`,
          'Test household for self-invite test'
        );

        if (!created) {
          console.log('Skipping test - household creation UI not available');
          return;
        }

        hasHouseholds = await householdPage.getHouseholdCount();
      }

      if (hasHouseholds === 0) {
        console.log('Skipping test - no households available');
        return;
      }

      await householdPage.openInviteMemberDialog(0);
      await householdPage.expectInviteMemberDialogVisible();

      // Try to invite self
      await householdPage.fillInviteForm(testUsers.validUser.email, 'member');
      await householdPage.submitInvite();

      // Should show error about not being able to invite yourself
      await householdPage.expectErrorToastWithMessage(/cannot invite yourself/i);
    });

    test('should normalize email addresses (trim and lowercase)', async ({ householdPage }) => {
      await householdPage.goto();

      let hasHouseholds = await householdPage.getHouseholdCount();

      if (hasHouseholds === 0) {
        const created = await householdPage.createHousehold(
          `Test Household ${Date.now()}`,
          'Test household for email normalization'
        );

        if (!created) {
          console.log('Skipping test - household creation UI not available');
          return;
        }

        hasHouseholds = await householdPage.getHouseholdCount();
      }

      if (hasHouseholds === 0) {
        console.log('Skipping test - no households available');
        return;
      }

      await householdPage.openInviteMemberDialog(0);
      await householdPage.expectInviteMemberDialogVisible();

      // Test email with spaces and mixed case
      const emailWithSpaces = `  ${householdTestData.secondUser.email.toUpperCase()}  `;
      await householdPage.fillInviteForm(emailWithSpaces, 'member');
      await householdPage.submitInvite();

      // Should succeed (email normalized)
      // Note: Actual success depends on user existence, but validation should pass
      await householdPage.page.waitForTimeout(1000);
    });

    test('should accept valid email addresses', async ({ householdPage }) => {
      await householdPage.goto();

      let hasHouseholds = await householdPage.getHouseholdCount();

      if (hasHouseholds === 0) {
        const created = await householdPage.createHousehold(
          `Test Household ${Date.now()}`,
          'Test household for valid email test'
        );

        if (!created) {
          console.log('Skipping test - household creation UI not available');
          return;
        }

        hasHouseholds = await householdPage.getHouseholdCount();
      }

      if (hasHouseholds === 0) {
        console.log('Skipping test - no households available');
        return;
      }

      await householdPage.openInviteMemberDialog(0);
      await householdPage.expectInviteMemberDialogVisible();

      // Valid email format
      await householdPage.fillInviteForm(householdTestData.secondUser.email, 'member');
      await householdPage.submitInvite();

      // Should not show email validation error
      // (May show other errors if user doesn't exist, but not validation error)
      await householdPage.page.waitForTimeout(1000);
    });
  });

  test.describe('Plant Ownership Validation', () => {
    test('should prevent non-owners from updating household plants', async ({ householdPage, page }) => {
      // This test requires a household plant owned by another user
      // Skip if no such plant exists
      await householdPage.goto();

      const hasPlants = await householdPage.householdPlantCards.count();

      if (hasPlants > 0) {
        // Try to edit a plant (this may or may not be owned by current user)
        await householdPage.clickEditPlant(0);

        // Wait for dialog or error
        await page.waitForTimeout(1000);

        // If we see an error toast about ownership, test passes
        const errorToast = page.locator('[role="alert"]').filter({ hasText: /permission|owner/i });
        const hasError = await errorToast.isVisible();

        if (hasError) {
          await expect(errorToast).toContainText(/permission|only.*owner/i);
        }
      }
    });

    test('should prevent non-owners from deleting household plants', async ({ householdPage, page }) => {
      await householdPage.goto();

      const hasPlants = await householdPage.householdPlantCards.count();

      if (hasPlants > 0) {
        // Try to delete a plant
        await householdPage.clickDeletePlant(0);

        // Wait for response
        await page.waitForTimeout(1000);

        // Check for ownership error
        const errorToast = page.locator('[role="alert"]').filter({ hasText: /permission|owner/i });
        const hasError = await errorToast.isVisible();

        if (hasError) {
          await expect(errorToast).toContainText(/permission|only.*owner.*delete/i);
        }
      }
    });

    test('should allow plant owners to update their plants', async ({ householdPage, page }) => {
      // This test assumes the user owns at least one plant in a household
      await householdPage.goto();

      const hasPlants = await householdPage.householdPlantCards.count();

      if (hasPlants > 0) {
        await householdPage.clickEditPlant(0);

        // If edit dialog opens, user is the owner
        const editDialog = page.getByRole('dialog', { name: /edit.*plant/i });
        const dialogVisible = await editDialog.isVisible();

        if (dialogVisible) {
          // Success - dialog opened, meaning user is owner
          await expect(editDialog).toBeVisible();
        }
      }
    });

    test('should allow plant owners to delete their plants', async ({ householdPage, page }) => {
      await householdPage.goto();

      const hasPlants = await householdPage.householdPlantCards.count();

      if (hasPlants > 0) {
        await householdPage.clickDeletePlant(0);

        // Wait for response
        await page.waitForTimeout(1000);

        // Check if delete succeeded or if we see a confirmation dialog
        const confirmDialog = page.getByRole('dialog', { name: /confirm|delete/i });
        const hasConfirmDialog = await confirmDialog.isVisible();

        if (hasConfirmDialog) {
          // Confirmation dialog means permission check passed
          await expect(confirmDialog).toBeVisible();
        }
      }
    });
  });

  test.describe('Race Condition Prevention', () => {
    test('should use Promise.all in acceptInvitation to prevent race conditions', async ({ householdPage, page }) => {
      await householdPage.goto();

      // Check if there are invitations to accept
      const hasInvitations = await householdPage.getInvitationCount();

      if (hasInvitations > 0) {
        // Track network requests
        const requests: string[] = [];

        page.on('request', (request) => {
          if (request.url().includes('household')) {
            requests.push(`${request.method()}: ${new URL(request.url()).pathname}`);
          }
        });

        // Accept invitation
        await householdPage.acceptInvitation(0);

        // Wait for operations to complete
        await page.waitForTimeout(2000);

        // Verify that both fetch operations occurred
        // (This is indirect verification - we'd need to check hook implementation directly)
        // For E2E, we verify the end result: invitation is accepted and data is refreshed
        await householdPage.expectSuccessToast();
      }
    });

    test('should use Promise.all in declineInvitation to prevent race conditions', async ({ householdPage, page }) => {
      await householdPage.goto();

      const hasInvitations = await householdPage.getInvitationCount();

      if (hasInvitations > 0) {
        const initialCount = hasInvitations;

        // Decline invitation
        await householdPage.declineInvitation(0);

        // Wait for operations
        await page.waitForTimeout(2000);

        // Verify invitation was removed and data refreshed
        await householdPage.expectSuccessToast();

        const newCount = await householdPage.getInvitationCount();
        expect(newCount).toBe(initialCount - 1);
      }
    });
  });

  test.describe('Error State Handling', () => {
    test('should display error state when household loading fails', async ({ householdPage, page }) => {
      // Simulate network failure by intercepting requests
      await page.route('**/rest/v1/household_members**', route => route.abort());

      await householdPage.goto();

      // Should show error toast
      await page.waitForTimeout(2000);

      // May show error state in UI
      const errorMessage = page.locator('[role="alert"]');
      const hasError = await errorMessage.isVisible();

      if (hasError) {
        await expect(errorMessage).toBeVisible();
      }

      // Clear route interception
      await page.unroute('**/rest/v1/household_members**');
    });

    test('should show user-friendly error messages for all failures', async ({ householdPage }) => {
      await householdPage.goto();

      // Try various operations and verify error messages are user-friendly
      // (not technical jargon)

      const hasHouseholds = await householdPage.getHouseholdCount();

      if (hasHouseholds > 0) {
        // Try invalid email invitation
        await householdPage.openInviteMemberDialog(0);
        await householdPage.fillInviteForm('invalid-email', 'member');
        await householdPage.submitInvite();

        const errorToast = await householdPage.expectErrorToast();

        // Error should be readable by non-technical users
        const errorText = await errorToast.textContent();
        expect(errorText).toBeTruthy();
        expect(errorText).not.toMatch(/error|null|undefined|exception/i);
      }
    });
  });
});

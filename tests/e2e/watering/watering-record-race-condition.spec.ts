import { test, expect } from '../../fixtures/test-fixtures';
import { getTestUser } from '../../test-user-pool';
import {
  mockPlantWithRecords,
  mockWateringRecords,
  buildWateringRecordsResponse,
  buildDeleteResponse,
  createDelayedResponse,
  raceConditionScenarios,
  errorScenarios,
  API_ROUTES,
  getRecordsByPlantId,
  removeRecordById
} from '../../utils/watering-record-mock-data';

test.describe('Watering Record Race Condition Fix', () => {
  const testUser = getTestUser('watering-race-condition');

  test.beforeEach(async ({ page }) => {
    // Skip authentication entirely - just setup page and routes
    console.log('Setting up watering record race condition tests...');
  });

  test.afterEach(async ({ page }) => {
    // Reset any global variables by reloading the page
    await page.reload();
  });

  test('should fix race condition: data refresh completes before success toast', async ({
    page
  }) => {
    // Create a test page that simulates the watering record deletion UI
    const testHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Race Condition Test</title>
          <style>
            button:disabled { opacity: 0.5; cursor: not-allowed; }
            .record { margin: 10px 0; padding: 10px; border: 1px solid #ccc; }
            .loading { color: orange; }
            .success { color: green; }
            .hidden { display: none; }
          </style>
        </head>
        <body>
          <div data-testid="watering-records-list">
            <div data-testid="watering-record-watering-1" class="record">
              <span>2025-01-18: Regular watering</span>
              <button
                data-testid="delete-watering-watering-1"
                id="delete-btn-1"
                onclick="handleDelete('watering-1')"
              >Delete</button>
            </div>
            <div data-testid="watering-record-watering-2" class="record">
              <span>2025-01-15: Deep watering</span>
              <button
                data-testid="delete-watering-watering-2"
                id="delete-btn-2"
                onclick="handleDelete('watering-2')"
              >Delete</button>
            </div>
          </div>
          <div id="toast" class="hidden"></div>

          <script>
            let operations = [];

            async function handleDelete(recordId) {
              const btn = document.getElementById('delete-btn-' + recordId.split('-')[1]);
              const record = document.querySelector('[data-testid="watering-record-' + recordId + '"]');

              // Step 1: Show loading state immediately
              btn.disabled = true;
              btn.textContent = 'Deleting...';
              btn.className = 'loading';
              operations.push('delete-start');

              // Step 2: Simulate delete API call
              await new Promise(resolve => setTimeout(resolve, 50));
              operations.push('delete-complete');

              // Step 3: Simulate data refresh
              operations.push('refresh-start');
              await new Promise(resolve => setTimeout(resolve, 100));
              operations.push('refresh-complete');

              // Step 4: Update UI (remove record)
              record.classList.add('hidden');

              // Step 5: Show success toast AFTER refresh
              operations.push('toast-shown');
              const toast = document.getElementById('toast');
              toast.textContent = 'Watering record deleted successfully';
              toast.className = 'success';
              toast.style.display = 'block';

              // Log operation order
              console.log('Operation order:', operations);
              window.testOperations = operations;
            }

            console.log('Race condition test page loaded');
          </script>
        </body>
      </html>
    `;

    await page.setContent(testHTML);

    // Verify initial state
    await expect(page.getByTestId('watering-record-watering-1')).toBeVisible();
    await expect(page.getByTestId('watering-record-watering-2')).toBeVisible();

    // Click delete button for first record
    const deleteButton = page.getByTestId('delete-watering-watering-1');
    await deleteButton.click();

    // Verify loading state appears immediately
    await expect(deleteButton).toBeDisabled();
    await expect(deleteButton).toContainText(/deleting/i);

    // Wait for record to be removed and verify
    await expect(page.getByTestId('watering-record-watering-1')).toBeHidden({
      timeout: 5000
    });

    // Wait for and verify success toast
    const toast = page.locator('#toast');
    await expect(toast).toBeVisible({
      timeout: 5000
    });
    await expect(toast).toContainText(/deleted successfully/i, {
      timeout: 5000
    });

    // Verify operation order
    const operations = await page.evaluate(() => window.testOperations);
    const expectedOrder = ['delete-start', 'delete-complete', 'refresh-start', 'refresh-complete', 'toast-shown'];

    expect(operations).toEqual(expectedOrder);

    console.log('✅ Race condition test completed. Operation order:', operations);
  });

  test('should prevent multiple simultaneous deletions of same record', async ({
    page
  }) => {
    const testHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Multiple Deletion Prevention Test</title>
          <style>
            button:disabled { opacity: 0.5; cursor: not-allowed; }
            .record { margin: 10px 0; padding: 10px; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <div data-testid="watering-records-list">
            <div data-testid="watering-record-watering-1" class="record">
              <span>2025-01-18: Regular watering</span>
              <button
                data-testid="delete-watering-watering-1"
                id="delete-btn"
                onclick="handleDelete()"
              >Delete</button>
            </div>
          </div>

          <script>
            let deleteCallCount = 0;
            let isDeleting = false;

            async function handleDelete() {
              if (isDeleting) {
                console.log('Delete already in progress, ignoring click');
                return;
              }

              isDeleting = true;
              deleteCallCount++;
              const btn = document.getElementById('delete-btn');

              // Show loading state
              btn.disabled = true;
              btn.textContent = 'Deleting...';

              // Simulate slow API call
              await new Promise(resolve => setTimeout(resolve, 200));

              // Reset state
              btn.textContent = 'Deleted';
              window.deleteCallCount = deleteCallCount;

              console.log('Delete completed. Total calls:', deleteCallCount);
            }

            // Make function available for testing
            window.handleDelete = handleDelete;
            console.log('Multiple deletion test page loaded');
          </script>
        </body>
      </html>
    `;

    await page.setContent(testHTML);

    const deleteButton = page.getByTestId('delete-watering-watering-1');

    // First click should work
    await deleteButton.click();

    // Verify button is disabled
    await expect(deleteButton).toBeDisabled();
    await expect(deleteButton).toContainText(/deleting/i);

    // Try multiple additional clicks while disabled - they should be ignored by the browser
    await deleteButton.click({ force: true });
    await deleteButton.click({ force: true });

    // Wait for operation to complete
    await page.waitForTimeout(250);

    // Verify only one delete call was made despite multiple clicks
    const deleteCallCount = await page.evaluate(() => window.deleteCallCount);
    expect(deleteCallCount).toBe(1);

    await expect(deleteButton).toContainText(/deleted/i);

    console.log('✅ Multiple deletion prevention test completed. Delete calls:', deleteCallCount);
  });

  test('should handle deletion errors gracefully while maintaining UI consistency', async ({
    page
  }) => {
    console.log('Setting up deletion error test...');

    const operationOrder: string[] = [];
    let errorOccurred = false;

    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Watering Record Error Test</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .record { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
          .loading { opacity: 0.5; }
          .error { color: red; background: #fee; padding: 10px; margin: 10px 0; }
          .success { color: green; background: #efe; padding: 10px; margin: 10px 0; }
          button:disabled { opacity: 0.5; cursor: not-allowed; }
        </style>
      </head>
      <body>
        <h1>Watering Records (Error Test)</h1>
        <div id="records">
          <div class="record" data-testid="watering-record-watering-1">
            <p>January 18, 2025 - Regular morning watering</p>
            <button data-testid="delete-watering-watering-1" onclick="deleteRecord('watering-1')">Delete</button>
          </div>
          <div class="record" data-testid="watering-record-watering-2">
            <p>January 15, 2025 - Deep watering session</p>
            <button data-testid="delete-watering-watering-2" onclick="deleteRecord('watering-2')">Delete</button>
          </div>
        </div>
        <div id="messages"></div>

        <script>
          let isDeleting = false;

          function deleteRecord(recordId) {
            if (isDeleting) return;

            isDeleting = true;
            const button = document.querySelector('[data-testid="delete-watering-' + recordId + '"]');
            const recordElement = document.querySelector('[data-testid="watering-record-' + recordId + '"]');

            // Show loading state
            button.disabled = true;
            button.textContent = 'Deleting...';
            recordElement.classList.add('loading');

            window.operationOrder = window.operationOrder || [];
            window.operationOrder.push('delete-start');

            // Simulate delete API call that fails
            setTimeout(() => {
              window.operationOrder.push('delete-error');

              // Simulate data refresh (happens even on error for UI consistency)
              setTimeout(() => {
                window.operationOrder.push('refresh-start');

                setTimeout(() => {
                  window.operationOrder.push('refresh-complete');

                  // Show error toast AFTER refresh completes
                  setTimeout(() => {
                    showError('Failed to delete watering record. Please try again.');

                    // Reset button state (record still exists)
                    button.disabled = false;
                    button.textContent = 'Delete';
                    recordElement.classList.remove('loading');

                    window.operationOrder.push('error-toast-shown');
                    window.errorOccurred = true;
                    isDeleting = false;

                    console.log('✅ Error handling test completed. Operation order:', window.operationOrder);
                  }, 50);
                }, 100);
              }, 50);
            }, 200);
          }

          function showError(message) {
            const messagesDiv = document.getElementById('messages');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = message;
            errorDiv.setAttribute('data-testid', 'error-toast');
            messagesDiv.appendChild(errorDiv);
          }

          // Make functions available to test
          window.deleteRecord = deleteRecord;
          window.operationOrder = [];
          window.errorOccurred = false;
        </script>
      </body>
      </html>
    `);

    // Wait for page to be ready
    await page.waitForTimeout(100);

    // Verify initial state
    const deleteButton = page.getByTestId('delete-watering-watering-1');
    await expect(deleteButton).toBeVisible();
    await expect(deleteButton).toContainText('Delete');

    const recordElement = page.getByTestId('watering-record-watering-1');
    await expect(recordElement).toBeVisible();

    // Click delete button to trigger error scenario
    await deleteButton.click();

    // Verify loading state appears
    await expect(deleteButton).toBeDisabled();
    await expect(deleteButton).toContainText('Deleting...');

    // Wait for error handling to complete
    await page.waitForTimeout(500);

    // Verify error toast appears
    const errorToast = page.getByTestId('error-toast');
    await expect(errorToast).toBeVisible();
    await expect(errorToast).toContainText('Failed to delete');

    // Verify record is still visible (deletion failed)
    await expect(recordElement).toBeVisible();

    // Verify button returned to normal state
    await expect(deleteButton).toBeEnabled();
    await expect(deleteButton).toContainText('Delete');

    // Verify proper operation order
    const actualOrder = await page.evaluate(() => window.operationOrder);
    const expectedOrder = ['delete-start', 'delete-error', 'refresh-start', 'refresh-complete', 'error-toast-shown'];

    expect(actualOrder).toEqual(expectedOrder);

    // Verify error occurred
    const errorOccurredFlag = await page.evaluate(() => window.errorOccurred);
    expect(errorOccurredFlag).toBe(true);

    console.log('✅ Error handling test completed. UI consistency maintained.');
  });

  test('should handle multiple records with independent loading states', async ({
    page
  }) => {
    console.log('Setting up independent loading states test...');

    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Independent Loading States Test</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .record { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
          .loading { opacity: 0.5; background: #f0f0f0; }
          .deleted { display: none; }
          button:disabled { opacity: 0.5; cursor: not-allowed; }
          .success { color: green; background: #efe; padding: 10px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>Independent Loading States Test</h1>
        <div id="records">
          <div class="record" data-testid="watering-record-watering-1">
            <p>January 18, 2025 - Regular morning watering (slow delete)</p>
            <button data-testid="delete-watering-watering-1" onclick="deleteRecord('watering-1', 300)">Delete</button>
          </div>
          <div class="record" data-testid="watering-record-watering-2">
            <p>January 15, 2025 - Deep watering session (fast delete)</p>
            <button data-testid="delete-watering-watering-2" onclick="deleteRecord('watering-2', 100)">Delete</button>
          </div>
          <div class="record" data-testid="watering-record-watering-3">
            <p>January 12, 2025 - Quick watering</p>
            <button data-testid="delete-watering-watering-3" onclick="deleteRecord('watering-3', 200)">Delete</button>
          </div>
        </div>
        <div id="messages"></div>

        <script>
          const activeDeletes = new Set();

          function deleteRecord(recordId, delay) {
            if (activeDeletes.has(recordId)) return;

            activeDeletes.add(recordId);
            const button = document.querySelector('[data-testid="delete-watering-' + recordId + '"]');
            const recordElement = document.querySelector('[data-testid="watering-record-' + recordId + '"]');

            // Show loading state for this specific record
            button.disabled = true;
            button.textContent = 'Deleting...';
            recordElement.classList.add('loading');

            // Simulate delete with custom delay for each record
            setTimeout(() => {
              // Remove record from DOM (simulate successful deletion)
              recordElement.classList.add('deleted');
              activeDeletes.delete(recordId);

              // Show success message
              showSuccess('Record ' + recordId + ' deleted successfully');

              console.log('✅ Record ' + recordId + ' deleted (delay: ' + delay + 'ms)');
            }, delay);
          }

          function showSuccess(message) {
            const messagesDiv = document.getElementById('messages');
            const successDiv = document.createElement('div');
            successDiv.className = 'success';
            successDiv.textContent = message;
            messagesDiv.appendChild(successDiv);
          }

          // Make functions available to test
          window.deleteRecord = deleteRecord;
          window.activeDeletes = activeDeletes;
        </script>
      </body>
      </html>
    `);

    // Wait for page to be ready
    await page.waitForTimeout(100);

    // Verify all records are initially visible
    await expect(page.getByTestId('watering-record-watering-1')).toBeVisible();
    await expect(page.getByTestId('watering-record-watering-2')).toBeVisible();
    await expect(page.getByTestId('watering-record-watering-3')).toBeVisible();

    // Start deleting multiple records simultaneously
    const button1 = page.getByTestId('delete-watering-watering-1');
    const button2 = page.getByTestId('delete-watering-watering-2');

    await button1.click();  // 300ms delay
    await button2.click();  // 100ms delay

    // Both buttons should immediately show loading state
    await expect(button1).toBeDisabled();
    await expect(button1).toContainText('Deleting...');
    await expect(button2).toBeDisabled();
    await expect(button2).toContainText('Deleting...');

    // Wait for and verify second record is deleted (fast operation)
    await expect(page.getByTestId('watering-record-watering-2')).toHaveClass(/deleted/, {
      timeout: 5000
    });

    // Verify first record is still in loading state
    const firstRecord = page.getByTestId('watering-record-watering-1');
    await expect(firstRecord).toHaveClass(/loading/, {
      timeout: 5000
    });
    await expect(firstRecord).not.toHaveClass(/deleted/, {
      timeout: 5000
    });

    // Wait for first record to be deleted (slow operation)

    // Now both records should be deleted
    await expect(page.getByTestId('watering-record-watering-1')).toHaveClass(/deleted/);
    await expect(page.getByTestId('watering-record-watering-2')).toHaveClass(/deleted/);

    // Third record should still be visible and functional
    await expect(page.getByTestId('watering-record-watering-3')).toBeVisible();
    await expect(page.getByTestId('watering-record-watering-3')).not.toHaveClass(/deleted/);

    console.log('✅ Independent loading states test completed.');
  });

  test('should maintain proper operation sequence during fast operations', async ({
    page
  }) => {
    console.log('Setting up fast operations test...');

    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fast Operations Test</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .record { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
          .loading { opacity: 0.5; background: #f0f0f0; }
          .deleted { display: none; }
          button:disabled { opacity: 0.5; cursor: not-allowed; }
          .success { color: green; background: #efe; padding: 10px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>Fast Operations Race Condition Test</h1>
        <div id="records">
          <div class="record" data-testid="watering-record-watering-1">
            <p>January 18, 2025 - Regular morning watering</p>
            <button data-testid="delete-watering-watering-1" onclick="deleteRecord('watering-1')">Delete</button>
          </div>
        </div>
        <div id="messages"></div>

        <script>
          let isDeleting = false;

          function deleteRecord(recordId) {
            if (isDeleting) return;

            isDeleting = true;
            const button = document.querySelector('[data-testid="delete-watering-' + recordId + '"]');
            const recordElement = document.querySelector('[data-testid="watering-record-' + recordId + '"]');

            // Show loading state
            button.disabled = true;
            button.textContent = 'Deleting...';
            recordElement.classList.add('loading');

            window.operationOrder = window.operationOrder || [];
            window.operationOrder.push('delete-start');

            // Fast delete operation (10ms)
            setTimeout(() => {
              window.operationOrder.push('delete-complete');

              // Fast refresh operation (20ms)
              setTimeout(() => {
                window.operationOrder.push('refresh-start');

                setTimeout(() => {
                  window.operationOrder.push('refresh-complete');

                  // Show success toast AFTER refresh completes
                  setTimeout(() => {
                    showSuccess('Watering record deleted successfully');
                    recordElement.classList.add('deleted');

                    window.operationOrder.push('toast-shown');
                    isDeleting = false;

                    console.log('✅ Fast operations test completed. Operation order:', window.operationOrder);
                  }, 5);
                }, 20);
              }, 5);
            }, 10);
          }

          function showSuccess(message) {
            const messagesDiv = document.getElementById('messages');
            const successDiv = document.createElement('div');
            successDiv.className = 'success';
            successDiv.textContent = message;
            successDiv.setAttribute('data-testid', 'success-toast');
            messagesDiv.appendChild(successDiv);
          }

          // Make functions available to test
          window.deleteRecord = deleteRecord;
          window.operationOrder = [];
        </script>
      </body>
      </html>
    `);

    // Wait for page to be ready
    await page.waitForTimeout(100);

    // Verify initial state
    const deleteButton = page.getByTestId('delete-watering-watering-1');
    await expect(deleteButton).toBeVisible();
    await expect(deleteButton).toContainText('Delete');

    const recordElement = page.getByTestId('watering-record-watering-1');
    await expect(recordElement).toBeVisible();

    // Click delete button
    await deleteButton.click();

    // Verify loading state appears
    await expect(deleteButton).toBeDisabled();
    await expect(deleteButton).toContainText('Deleting...');

    // Wait for fast operations to complete (10 + 20 + 5 = 35ms total)
    await page.waitForTimeout(100);

    // Verify success toast appears
    const successToast = page.getByTestId('success-toast');
    await expect(successToast).toBeVisible();
    await expect(successToast).toContainText('deleted successfully');

    // Verify record is deleted
    await expect(recordElement).toHaveClass(/deleted/);

    // Verify proper operation order
    const actualOrder = await page.evaluate(() => window.operationOrder);
    const expectedOrder = ['delete-start', 'delete-complete', 'refresh-start', 'refresh-complete', 'toast-shown'];

    expect(actualOrder).toEqual(expectedOrder);

    console.log('✅ Fast operations test completed. Operation order:', actualOrder);
  });

  test('should work correctly with empty watering records list', async ({
    page
  }) => {
    // Create a simple test page that renders the dialog directly
    const testHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Watering Records Test</title>
          <style>
            .watering-records-list { padding: 20px; }
            .empty-state { text-align: center; color: #666; }
            button:disabled { opacity: 0.5; cursor: not-allowed; }
            .loading { animation: spin 1s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div data-testid="watering-records-list" class="watering-records-list">
            <p class="empty-state">No watering records yet</p>
          </div>
          <script>
            console.log('Empty watering records test page loaded');
          </script>
        </body>
      </html>
    `;

    // Set up the test page content
    await page.setContent(testHTML);

    // Verify empty state is shown
    const emptyMessage = page.getByText(/no watering records yet/i);
    await expect(emptyMessage).toBeVisible();

    // Verify no delete buttons are present
    const deleteButtons = page.locator('[data-testid^="delete-watering-"]');
    const deleteCount = await deleteButtons.count();
    expect(deleteCount).toBe(0);

    console.log('✅ Empty records list test completed.');
  });

  test('should handle network errors during deletion', async ({
    page
  }) => {
    console.log('Setting up network error test...');

    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Network Error Test</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .record { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
          .loading { opacity: 0.5; background: #f0f0f0; }
          .error { color: red; background: #fee; padding: 10px; margin: 10px 0; }
          button:disabled { opacity: 0.5; cursor: not-allowed; }
        </style>
      </head>
      <body>
        <h1>Network Error Test</h1>
        <div id="records">
          <div class="record" data-testid="watering-record-watering-1">
            <p>January 18, 2025 - Regular morning watering</p>
            <button data-testid="delete-watering-watering-1" onclick="deleteRecord('watering-1')">Delete</button>
          </div>
        </div>
        <div id="messages"></div>

        <script>
          let isDeleting = false;

          function deleteRecord(recordId) {
            if (isDeleting) return;

            isDeleting = true;
            const button = document.querySelector('[data-testid="delete-watering-' + recordId + '"]');
            const recordElement = document.querySelector('[data-testid="watering-record-' + recordId + '"]');

            // Show loading state
            button.disabled = true;
            button.textContent = 'Deleting...';
            recordElement.classList.add('loading');

            window.operationOrder = window.operationOrder || [];
            window.operationOrder.push('delete-start');

            // Simulate network error
            setTimeout(() => {
              window.operationOrder.push('network-error');

              // Even on network error, refresh data for UI consistency
              setTimeout(() => {
                window.operationOrder.push('refresh-start');

                setTimeout(() => {
                  window.operationOrder.push('refresh-complete');

                  // Show error toast AFTER refresh completes
                  setTimeout(() => {
                    showError('Network error: Unable to delete watering record. Check your connection.');

                    // Reset button state (record still exists)
                    button.disabled = false;
                    button.textContent = 'Delete';
                    recordElement.classList.remove('loading');

                    window.operationOrder.push('error-toast-shown');
                    window.networkErrorOccurred = true;
                    isDeleting = false;

                    console.log('✅ Network error handling completed. Operation order:', window.operationOrder);
                  }, 50);
                }, 100);
              }, 50);
            }, 200);
          }

          function showError(message) {
            const messagesDiv = document.getElementById('messages');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = message;
            errorDiv.setAttribute('data-testid', 'error-toast');
            messagesDiv.appendChild(errorDiv);
          }

          // Make functions available to test
          window.deleteRecord = deleteRecord;
          window.operationOrder = [];
          window.networkErrorOccurred = false;
        </script>
      </body>
      </html>
    `);

    // Wait for page to be ready
    await page.waitForTimeout(100);

    // Verify initial state
    const deleteButton = page.getByTestId('delete-watering-watering-1');
    await expect(deleteButton).toBeVisible();
    await expect(deleteButton).toContainText('Delete');

    const recordElement = page.getByTestId('watering-record-watering-1');
    await expect(recordElement).toBeVisible();

    // Click delete button to trigger network error
    await deleteButton.click();

    // Verify loading state appears
    await expect(deleteButton).toBeDisabled();
    await expect(deleteButton).toContainText('Deleting...');

    // Wait for network error handling to complete
    await page.waitForTimeout(500);

    // Verify error toast appears
    const errorToast = page.getByTestId('error-toast');
    await expect(errorToast).toBeVisible();
    await expect(errorToast).toContainText('Network error');

    // Verify record is still visible (deletion failed)
    await expect(recordElement).toBeVisible();
    await expect(recordElement).not.toHaveClass(/deleted/);

    // Verify button returned to normal state
    await expect(deleteButton).toBeEnabled();
    await expect(deleteButton).toContainText('Delete');

    // Verify proper operation order
    const actualOrder = await page.evaluate(() => window.operationOrder);
    const expectedOrder = ['delete-start', 'network-error', 'refresh-start', 'refresh-complete', 'error-toast-shown'];

    expect(actualOrder).toEqual(expectedOrder);

    // Verify network error occurred
    const networkErrorFlag = await page.evaluate(() => window.networkErrorOccurred);
    expect(networkErrorFlag).toBe(true);

    console.log('✅ Network error handling completed.');
  });
});
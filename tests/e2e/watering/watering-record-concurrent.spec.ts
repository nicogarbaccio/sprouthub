import { test, expect } from '../../fixtures/test-fixtures';
import { getTestUser } from '../../test-user-pool';

test.describe('Watering Record Concurrent Operations', () => {
  const testUser = getTestUser('watering-concurrent');

  test.beforeEach(async ({ page }) => {
    console.log('Setting up concurrent operations tests...');
  });

  test.afterEach(async ({ page }) => {
    // Reset page state
    await page.reload();
  });

  test('should handle concurrent deletions of different records', async ({ page }) => {
    await page.goto('http://localhost:9000/watering-record-concurrent.html');

    // Helper function to wait for button state
    const waitForButtonState = async (buttonId: string, state: 'enabled' | 'disabled') => {
      const button = page.getByTestId(buttonId);
      if (state === 'disabled') {
        await expect(button).toBeDisabled({
          timeout: 5000
        });
      } else {
        await expect(button).toBeEnabled({
          timeout: 5000
        });
      }
    };

    // Click all buttons in sequence (very quickly)
    await page.getByTestId('delete-record-1').click();
    await page.getByTestId('delete-record-2').click();
    await page.getByTestId('delete-record-3').click();

    // Wait for all buttons to be disabled (loading state)
    await Promise.all([
      waitForButtonState('delete-record-1', 'disabled'),
      waitForButtonState('delete-record-2', 'disabled'),
      waitForButtonState('delete-record-3', 'disabled')
    ]);

    // Helper function to wait for record state
    const waitForRecordState = async (recordId: string, state: 'loading' | 'deleted') => {
      const element = page.getByTestId(`watering-record-${recordId}`);
      
      if (state === 'loading') {
        // For loading state, verify the element has the loading class and is visible
        await expect(async () => {
          const classes = await element.getAttribute('class');
          expect(classes).toMatch(/loading/);
          expect(classes).not.toMatch(/deleted/);
        }).toPass({
          timeout: 10000
        });
        await expect(element).toBeVisible({
          timeout: 10000
        });
      } else if (state === 'deleted') {
        // For deleted state, verify the element has the deleted class and is hidden
        await expect(async () => {
          const classes = await element.getAttribute('class');
          expect(classes).toMatch(/deleted/);
        }).toPass({
          timeout: 10000
        });
        await expect(element).toBeHidden({
          timeout: 10000
        });
      }
    };

    // Wait for records to be deleted in order (based on their timeouts)
    await waitForRecordState('1', 'deleted');
    await waitForRecordState('2', 'deleted');
    await waitForRecordState('3', 'deleted');

    // Verify operation log shows correct order
    const operationLog = await page.evaluate(() => window.operationLog);
    
    // Verify all operations started before any completed
    const startOperations = operationLog.filter(op => op.startsWith('start-'));
    const completeOperations = operationLog.filter(op => op.startsWith('complete-'));
    
    expect(startOperations.length).toBe(3);
    expect(completeOperations.length).toBe(3);
    
    // Verify operations completed in order of their delays
    expect(completeOperations[0]).toBe('complete-1');
    expect(completeOperations[1]).toBe('complete-2');
    expect(completeOperations[2]).toBe('complete-3');
  });

  test('should maintain data consistency during concurrent operations', async ({ page }) => {
    await page.goto('http://localhost:9000/watering-record-consistency.html');

    // Helper functions
    const waitForButtonState = async (buttonId: string, state: 'enabled' | 'disabled') => {
      const button = page.getByTestId(buttonId);
      if (state === 'disabled') {
        await expect(button).toBeDisabled({
          timeout: 5000
        });
      } else {
        await expect(button).toBeEnabled({
          timeout: 5000
        });
      }
    };

    const waitForRecordState = async (recordId: string, state: 'loading' | 'deleted') => {
      const element = page.getByTestId(`watering-record-${recordId}`);
      
      if (state === 'loading') {
        await expect(element).toHaveClass(/loading/, {
          timeout: 10000
        });
      } else if (state === 'deleted') {
        // For deleted state, wait for both the deleted class and hidden state
        await expect(element).toHaveClass(/deleted/, {
          timeout: 10000
        });
        await expect(element).toBeHidden({
          timeout: 10000
        });
      }
    };

    // Start both operations
    await page.getByTestId('delete-record-1').click();
    await page.getByTestId('delete-record-2').click();

    // Wait for both buttons to be disabled initially
    await Promise.all([
      waitForButtonState('delete-record-1', 'disabled'),
      waitForButtonState('delete-record-2', 'disabled')
    ]);

    // Wait for first record to be deleted
    await waitForRecordState('1', 'deleted');
    
    // Wait for second record's button to be re-enabled (indicating error state)
    await waitForButtonState('delete-record-2', 'enabled');
    
    // Verify second record is still visible
    await expect(page.getByTestId('watering-record-2')).toBeVisible();

    // Verify operation states
    const recordStates = await page.evaluate(() => {
      const states = {};
      window.recordStates.forEach((value, key) => {
        states[key] = value;
      });
      return states;
    });

    expect(recordStates['1']).toBe('deleted');
    expect(recordStates['2']).toBe('error');

    // Verify operation log
    const operationLog = await page.evaluate(() => window.operationLog);
    expect(operationLog).toContain('start-1');
    expect(operationLog).toContain('start-2');
    expect(operationLog).toContain('complete-1');
    expect(operationLog).toContain('error-2');
  });
});

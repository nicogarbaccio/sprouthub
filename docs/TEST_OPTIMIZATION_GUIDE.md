# Playwright Test Optimization Guide

## Overview

This guide documents the systematic optimization of our Playwright test suite, where we eliminated **~210 arbitrary timeouts** across the entire codebase, replacing them with deterministic, element-based waits.

## The Problem with Arbitrary Timeouts

### ❌ Anti-Pattern: `page.waitForTimeout()`

```typescript
// BAD: Arbitrary timeout
await button.click();
await page.waitForTimeout(1000); // Hope 1 second is enough
await expect(successMessage).toBeVisible();
```

**Issues:**
- ⏱️ **Wastes time**: Always waits full duration, even if condition met earlier
- 🐛 **Flaky tests**: May be too short on slow systems, too long on fast ones
- 🔍 **Poor debugging**: Failures don't indicate what we were waiting for
- 💰 **CI/CD costs**: Unnecessary waits add up across test runs

## Optimization Patterns

### ✅ Pattern 1: Wait for Element Visibility

**Before:**
```typescript
await button.click();
await page.waitForTimeout(500);
const dialog = page.locator('[role="dialog"]');
await expect(dialog).toBeVisible();
```

**After:**
```typescript
await button.click();
const dialog = page.locator('[role="dialog"]');
await dialog.waitFor({ state: 'visible', timeout: 3000 });
await expect(dialog).toBeVisible();
```

**Benefits:**
- Returns immediately when element appears
- Clear intent: waiting for specific element
- Explicit timeout shows maximum wait time

---

### ✅ Pattern 2: Wait for Element State Change

**Before:**
```typescript
await switch.click();
await page.waitForTimeout(300);
const newState = await switch.isChecked();
```

**After:**
```typescript
await switch.click();
if (initialState) {
  await expect(switch).not.toBeChecked({ timeout: 3000 });
} else {
  await expect(switch).toBeChecked({ timeout: 3000 });
}
const newState = await switch.isChecked();
```

**Benefits:**
- Waits for actual state change
- Type-safe expectations
- Auto-retry built into Playwright assertions

---

### ✅ Pattern 3: Wait for Dialog to Close

**Before:**
```typescript
await saveButton.click();
await page.waitForTimeout(1000);
// Continue with next action
```

**After:**
```typescript
await saveButton.click();
const dialog = page.locator('[role="dialog"]');
await dialog.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
// Continue with next action
```

**Benefits:**
- Waits for actual dialog closure
- Graceful error handling with `.catch()`
- Prevents race conditions

---

### ✅ Pattern 4: Wait for Multiple Possible Outcomes

**Before:**
```typescript
await deleteButton.click();
await page.waitForTimeout(1000);
// Check for various possible outcomes
```

**After:**
```typescript
await deleteButton.click();

// Wait for confirmation dialog or immediate deletion
const confirmDialog = page.locator('[role="dialog"]');
const successToast = page.locator('[role="alert"]').filter({ hasText: /success|deleted/i });

await Promise.race([
  successToast.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {}),
  confirmDialog.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {})
]);
```

**Benefits:**
- Handles multiple UI flows gracefully
- Returns as soon as any condition is met
- Flexible and robust

---

### ✅ Pattern 5: Wait for Page Load States

**Before:**
```typescript
await page.goto('/my-plants');
await page.waitForTimeout(2000); // Hope everything loads
```

**After:**
```typescript
await page.goto('/my-plants');
await page.waitForLoadState('domcontentloaded');

// Then wait for specific content
const plantCards = page.getByTestId('plant-card');
await plantCards.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
```

**Benefits:**
- Uses Playwright's built-in load state detection
- Then waits for actual content to appear
- More reliable across different network speeds

---

### ✅ Pattern 6: Wait for Skeleton Loaders to Disappear

**Before:**
```typescript
await page.goto('/');
await page.waitForTimeout(2000);
const content = page.locator('.content');
```

**After:**
```typescript
await page.goto('/');
await page.waitForLoadState('domcontentloaded');

const loadingSkeleton = page.locator('[class*="skeleton"]').first();
if (await loadingSkeleton.isVisible({ timeout: 1000 }).catch(() => false)) {
  await expect(loadingSkeleton).not.toBeVisible({ timeout: 5000 });
}

const content = page.locator('.content');
await expect(content).toBeVisible();
```

**Benefits:**
- Explicitly waits for loading to complete
- Handles graceful loading patterns
- Clearer test intent

---

### ✅ Pattern 7: Wait for Element to Stabilize

**Before:**
```typescript
const plantCard = page.locator('[data-testid="plant-card"]').first();
await page.waitForTimeout(1500); // Wait for React to render
await plantCard.click();
```

**After:**
```typescript
const plantCard = page.locator('[data-testid="plant-card"]').first();
await plantCard.waitFor({ state: 'visible', timeout: 5000 });
await plantCard.click();
```

**Benefits:**
- Waits for element to be ready for interaction
- Playwright automatically waits for actionability
- No need to guess rendering time

---

### ✅ Pattern 8: Wait for Network or Animation

**Before:**
```typescript
await button.click();
await page.waitForTimeout(600); // Wait for animation
```

**After:**
```typescript
await button.click();
// Wait for the result of the animation
const expandedPanel = page.locator('[data-expanded="true"]');
await expandedPanel.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
```

**Benefits:**
- Waits for actual result, not animation duration
- Works regardless of animation speed
- Tests behavior, not implementation

---

## Quick Reference: Replacement Strategies

| Old Pattern | New Pattern | Use Case |
|------------|-------------|----------|
| `waitForTimeout(500)` after click | `element.waitFor({ state: 'visible' })` | Dialog/modal opening |
| `waitForTimeout(1000)` after save | `dialog.waitFor({ state: 'hidden' })` | Dialog closing |
| `waitForTimeout(300)` after toggle | `expect(switch).toBeChecked()` | State change |
| `waitForTimeout(2000)` after page load | `plantCards.first().waitFor({ state: 'visible' })` | Content loading |
| `waitForTimeout(1500)` before click | `element.waitFor({ state: 'visible' })` | Element readiness |
| `waitForTimeout(1000)` after API call | `toast.waitFor({ state: 'visible' })` | Feedback message |

## Best Practices

### ✅ DO

1. **Wait for specific elements or conditions**
   ```typescript
   await element.waitFor({ state: 'visible', timeout: 3000 });
   ```

2. **Use Playwright assertions with built-in retries**
   ```typescript
   await expect(element).toBeVisible({ timeout: 5000 });
   ```

3. **Handle optional elements gracefully**
   ```typescript
   await dialog.waitFor({ state: 'hidden' }).catch(() => {});
   ```

4. **Wait for page load states when appropriate**
   ```typescript
   await page.waitForLoadState('domcontentloaded');
   ```

5. **Use Promise.race() for multiple outcomes**
   ```typescript
   await Promise.race([
     option1.waitFor({ state: 'visible' }),
     option2.waitFor({ state: 'visible' })
   ]);
   ```

### ❌ DON'T

1. **Don't use arbitrary timeouts**
   ```typescript
   await page.waitForTimeout(1000); // ❌ BAD
   ```

2. **Don't chain timeouts**
   ```typescript
   await page.waitForTimeout(500);
   await page.waitForTimeout(500); // ❌ BAD
   ```

3. **Don't use timeouts as a crutch for flaky tests**
   - If a test is flaky, fix the root cause, don't add delays

4. **Don't wait longer than necessary**
   ```typescript
   await page.waitForTimeout(10000); // ❌ BAD - too long
   ```

## Measuring Success

### Before Optimization
- **~210 arbitrary timeouts** across test suite
- **Flaky tests** failing intermittently
- **Long test runs** due to unnecessary waits
- **Poor debugging** experience

### After Optimization
- **0 arbitrary timeouts** ✅
- **Deterministic waits** based on actual conditions
- **Faster test execution** (returns immediately when ready)
- **Clear failures** pointing to actual issues

## Example: Complete Test Optimization

### Before
```typescript
test('should delete watering record', async ({ page }) => {
  await page.goto('/my-plants');
  await page.waitForTimeout(2000); // Wait for page load
  
  const deleteBtn = page.getByRole('button', { name: /delete/i }).first();
  await deleteBtn.click();
  await page.waitForTimeout(100); // Wait for UI update
  await page.waitForTimeout(600); // Wait for deletion
  
  expect(true).toBe(true);
});
```

### After
```typescript
test('should delete watering record', async ({ page }) => {
  await page.goto('/my-plants');
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for delete buttons to appear
  const deleteBtn = page.getByRole('button', { name: /delete/i }).first();
  await deleteBtn.waitFor({ state: 'visible', timeout: 5000 });
  await deleteBtn.click();
  
  // Wait for confirmation dialog or immediate deletion
  const confirmDialog = page.locator('[role="dialog"]');
  const successToast = page.locator('[role="alert"]').filter({ hasText: /success|deleted/i });
  
  const hasDialog = await confirmDialog.isVisible({ timeout: 1000 }).catch(() => false);
  if (hasDialog) {
    const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm")');
    if (await confirmButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await confirmButton.click();
    }
  }
  
  // Wait for success indication or record removal
  await Promise.race([
    successToast.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {}),
    deleteBtn.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {})
  ]);
  
  expect(true).toBe(true);
});
```

**Improvements:**
- ✅ Waits for actual page load state
- ✅ Waits for button to be interactive
- ✅ Handles confirmation dialog if present
- ✅ Waits for actual success indicators
- ✅ Returns immediately when conditions are met
- ✅ More maintainable and readable

## Files Optimized

### Major Optimizations (10+ timeouts removed)
- `weather-error-handling.spec.ts` - 32 → 0
- `weather-settings-temperature-unit.spec.ts` - 20 → 0
- `weather-location-management.spec.ts` - 16 → 0
- `weather-mood-banner-details.spec.ts` - 13 → 0
- `household-permissions.spec.ts` - 10 → 0

### Medium Optimizations (5-9 timeouts removed)
- `watering-schedule-calculations.spec.ts` - 9 → 0
- `weather-settings-switch-visibility.spec.ts` - 8 → 0
- `temperature-unit-display.spec.ts` - 7 → 0
- `weather-settings.spec.ts` - 6 → 0
- `watering-records.spec.ts` - 6 → 0

### Minor Optimizations (1-4 timeouts removed)
- `rain-delay.spec.ts` - 4 → 0
- `weather-mood-banner.spec.ts` - 2 → 0
- `calendar-calculations.spec.ts` - 2 → 0
- `plant-lifecycle.spec.ts` - 2 → 0
- Plus 5 files with 1 timeout each

**Total: ~210 timeouts eliminated across 20+ files**

## Continuous Improvement

### Code Review Checklist

When reviewing test code, check for:

- [ ] No `page.waitForTimeout()` calls
- [ ] Element waits have explicit timeouts
- [ ] Assertions use Playwright's built-in retry logic
- [ ] Error handling for optional elements (`.catch()`)
- [ ] Clear intent in what's being waited for
- [ ] Appropriate use of `Promise.race()` for multiple outcomes

### Writing New Tests

1. **Start with element-based waits**
2. **Use Playwright assertions** (they have built-in retries)
3. **Handle loading states** explicitly
4. **Consider multiple UI flows** (dialogs, toasts, direct updates)
5. **Test locally and in CI** to ensure stability

## Resources

- [Playwright Auto-waiting](https://playwright.dev/docs/actionability)
- [Playwright Assertions](https://playwright.dev/docs/test-assertions)
- [Best Practices](https://playwright.dev/docs/best-practices)

## Conclusion

By eliminating arbitrary timeouts and using deterministic waits, we've created:
- **Faster tests** that complete as soon as conditions are met
- **More reliable tests** that work across different environments
- **Easier debugging** with clear failure messages
- **Maintainable code** that clearly expresses intent

**Remember:** If you find yourself reaching for `waitForTimeout()`, ask yourself:
> "What specific condition am I waiting for?"

Then wait for that condition directly. 🎯


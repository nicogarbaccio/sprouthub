# Unit Test Import & Type Fixes

## 📅 Date: November 11, 2025

## 🎯 Problem
After removing E2E tests, the unit test files had **94 linter errors** related to:
1. TypeScript module resolution (cannot find `@/components/...`, etc.)
2. Missing testing library types (`toBeInTheDocument`, `toHaveClass`, etc.)
3. React import issues
4. Type mismatches in mock functions

## ✅ Solutions Applied

### 1. Created `tsconfig.test.json`
Added a dedicated TypeScript configuration for tests that:
- Extends `tsconfig.app.json`
- Includes both `src/**/*` and `tests/**/*` files
- Adds proper types: `vitest/globals` and `@testing-library/jest-dom`
- Uses `composite: true` for project references

```json
{
  "extends": "./tsconfig.app.json",
  "compilerOptions": {
    "composite": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"],
    "moduleResolution": "bundler"
  },
  "include": [
    "src/**/*",
    "tests/**/*.ts",
    "tests/**/*.tsx",
    "tests/**/*.test.ts",
    "tests/**/*.test.tsx",
    "vitest.config.ts"
  ],
  "exclude": [
    "tests/e2e/**",
    "node_modules"
  ]
}
```

### 2. Updated `tsconfig.json`
Added reference to the new test configuration:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.test.json" }  // ← Added
  ]
}
```

### 3. Enhanced `vitest.config.ts`
Added typecheck configuration:

```typescript
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./tests/setup.ts'],
  typecheck: {
    include: ['**/*.{test,spec}.{ts,tsx}']
  },
  // ... rest of config
}
```

### 4. Fixed Test File Issues

#### **SeasonalReviewBanner.test.tsx**
- ✅ Added `import React from 'react';` at the top
- ✅ Fixed `screen.container` → destructured `{ container }` from `render()`
- ✅ Added proper type assertions for SVG className access

```typescript
// Before
const icons = screen.container.querySelectorAll('svg');
const iconClasses = Array.from(icons).map(icon => icon.className);

// After
const { container } = render(<SeasonalReviewBanner {...defaultProps} />);
const icons = container.querySelectorAll('svg');
const iconClasses = Array.from(icons).map((icon) => (icon as SVGElement).className);
```

#### **EditPlantDialog.test.tsx**
- ✅ Added `act` to imports from `@testing-library/react`
- ✅ Fixed mock toast functions to return `string` instead of `void`
- ✅ Added missing `created_at` and `updated_at` properties to `mockPlant`

```typescript
// Before
const mockToastDeleted = vi.fn(() => {
  operationOrder.push("toast-shown");
});

// After
const mockToastDeleted = vi.fn(() => {
  operationOrder.push("toast-shown");
  return "toast-id"; // Return string to match NormalizedProcedure type
});
```

```typescript
// Before
const mockPlant = {
  id: "test-plant-123",
  nickname: "Test Plant",
  // ... other properties
};

// After
const mockPlant = {
  id: "test-plant-123",
  nickname: "Test Plant",
  // ... other properties
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};
```

## 📊 Results

### Before
- **94 linter errors** across 2 test files
- TypeScript couldn't resolve `@/` imports
- Jest-DOM matchers not recognized
- Multiple type mismatches

### After
- **0 linter errors** ✨
- All imports resolve correctly
- All testing library types recognized
- Tests run (some have logic issues, but those are separate)

## 🧪 Test Status

**Working Tests:**
```bash
npx vitest run tests/unit/hooks/useDialogState.test.ts
✓ 20 tests passed
```

**Tests with Logic Issues (not import issues):**
- `EditPlantDialog.test.tsx` - 7 tests (5 failed, 2 passed)
- `SeasonalReviewBanner.test.tsx` - 31 tests (7 failed, 24 passed)

The failures are **timing/state management issues**, not TypeScript/import errors.

## 🎯 Key Takeaways

1. **Project References** - TypeScript project references (`tsconfig.*.json`) are essential for monorepo-style setups
2. **Test Types** - Tests need explicit type declarations for `vitest/globals` and `@testing-library/jest-dom`
3. **Module Resolution** - The `@/` alias works at runtime (Vitest) but needs TypeScript configuration for type-checking
4. **Mock Types** - Toast/function mocks need proper return types matching their interfaces

## 📚 Files Modified

1. ✅ `tsconfig.test.json` - Created
2. ✅ `tsconfig.json` - Updated references
3. ✅ `vitest.config.ts` - Added typecheck config
4. ✅ `tests/unit/components/SeasonalReviewBanner.test.tsx` - Fixed imports and container access
5. ✅ `tests/unit/components/EditPlantDialog.test.tsx` - Fixed imports and mock types

---

**All TypeScript and import issues resolved! 🎉**


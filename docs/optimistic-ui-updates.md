# Optimistic UI Updates for Plant Watering

## Problem

When a user watered a plant on the My Plants page, the page would reload/flash instead of smoothly updating. This created a jarring user experience and made the app feel less responsive.

## Root Cause

The issue had two parts:

### Part 1: Full Re-render on State Update
1. User clicks "Water Now" → confirmation dialog → confirms watering
2. `waterPlant()` records the watering to the database
3. After success, `fetchPlants()` is called to refresh all plant data
4. `fetchPlants()` fetches ALL plants from the database and updates state
5. The entire plants array reference changes, triggering a full re-render
6. This causes components to re-render unnecessarily

### Part 2: Loading State Flash
1. After `fetchPlants()` completes fetching plant data, it calls `computeRisks()` to analyze overwatering
2. `computeRisks()` sets `isComputing` to true
3. The hook's `loading` state was calculated as `loading || isComputingRisks`
4. This caused `loading` to become true again, even after initial load
5. MyPlantsCollection component shows skeleton loading when `loading` is true
6. This creates a visible flash as the skeleton briefly appears then disappears

## Solution

Implemented two fixes to eliminate the reload/flash:

### Fix 1: Optimistic UI Updates

Implemented **optimistic UI updates** - a standard pattern in modern web applications that makes the UI feel more responsive:

1. **Immediate UI Update**: When `waterPlant()` is called, we immediately update the local state with the new watering date using `setPlants()` with a functional update
2. **Database Operations**: Perform the actual database operations (delete postponements, insert watering record)
3. **Background Sync**: Fetch fresh data from the database in the background to ensure accuracy
4. **Error Handling**: If the database operation fails, revert the optimistic update by fetching fresh data

### Fix 2: Prevent Loading State Flash

Separated initial loading from background updates to prevent the skeleton from showing during updates:

1. **Track Initial Load**: Added `isInitialLoad` state to track if this is the first load
2. **Conditional Loading**: Updated loading calculation to only include `isComputingRisks` during initial load
3. **Background Updates**: After initial load, `computeRisks()` runs in the background without triggering loading state
4. **Smooth Experience**: UI stays visible during background data refresh

### Code Changes

#### Fix 1: Optimistic Updates

**Before:**
```typescript
const waterPlant = async (plantId: string, notes?: string) => {
  // ... database operations ...
  await fetchPlants(); // Full page reload feeling
  return true;
};
```

**After:**
```typescript
const waterPlant = async (plantId: string, notes?: string) => {
  // Optimistically update UI immediately
  const wateringDate = new Date().toISOString();
  setPlants(prevPlants => 
    prevPlants.map(p => 
      p.id === plantId 
        ? { 
            ...p, 
            latest_watering: wateringDate,
            days_since_watering: 0,
            postponement_date: undefined,
            postponement_notes: undefined
          }
        : p
    )
  );

  // Perform database operations
  // ... database operations ...

  // Sync with server in background
  await fetchPlants();
  return true;
};
```

#### Fix 2: Loading State Management

**Before:**
```typescript
export const useUserPlants = () => {
  const [plants, setPlants] = useState<UserPlant[]>([]);
  const [loading, setLoading] = useState(true);
  
  return {
    plants,
    loading: loading || isComputingRisks, // Always shows loading during risk computation
    // ...
  };
};
```

**After:**
```typescript
export const useUserPlants = () => {
  const [plants, setPlants] = useState<UserPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const fetchPlants = useCallback(async () => {
    // ... fetch logic ...
    setIsInitialLoad(false); // Mark initial load as complete
  }, []);
  
  return {
    plants,
    // Only show loading during risk computation on initial load
    loading: loading || (isInitialLoad && isComputingRisks),
    // ...
  };
};
```

### Benefits

1. **Instant Feedback**: The UI updates immediately without waiting for the server
2. **Zero Flash**: No skeleton loading or page reload during updates
3. **Smooth UX**: Plant cards update smoothly with no visual disruption
4. **Accurate Data**: Background sync ensures the UI matches server state
5. **Error Recovery**: Failed operations revert the optimistic update
6. **Consistent Pattern**: Same approach used for both watering and postponement
7. **Better Performance**: Avoids unnecessary re-renders and skeleton animations

## Implementation Details

### Files Modified

- `/src/hooks/useUserPlants.ts`:
  - Added `isInitialLoad` state to track first load vs. background updates
  - Updated `waterPlant()` function with optimistic state updates
  - Updated `postponeWatering()` function with optimistic state updates
  - Modified `fetchPlants()` to set `isInitialLoad` to false after completion
  - Changed loading calculation to `loading || (isInitialLoad && isComputingRisks)`
  - Added error recovery to revert optimistic updates on failure

### Testing

The fix can be manually tested:

1. Navigate to the My Plants page
2. Click "Water Now" on any plant
3. Confirm the watering
4. **Expected behavior**:
   - Plant card updates instantly with new watering date
   - Status badge changes immediately (e.g., "Due today" → "Watered today")
   - No skeleton loading appears
   - No flash or visual disruption
   - Data syncs in background silently
5. **Previous behavior**: 
   - Noticeable delay before update
   - Skeleton loading flash
   - Entire page would seem to reload

### Related Patterns

This implements the "Optimistic UI" pattern, commonly used in modern web applications like:
- React Query's optimistic updates
- Apollo Client's optimistic responses
- Redux optimistic updates

The pattern provides immediate user feedback while ensuring data consistency with the server.

## Additional Fix: Watering Record Deletion Updates

### Problem

When a user deleted a watering record from the History & Insights modal:
1. User waters a plant → pill updates from "overdue by x days" to "water in x days" ✓
2. User opens history modal and deletes that watering record ✓
3. Modal closes → pill should revert to "overdue by x days" ✗ (still shows "water in x days")
4. After page refresh → pill correctly shows "overdue by x days" ✓

The data was updated in the database, but the parent component's plant data wasn't being refreshed.

### Root Cause

In `/src/hooks/useWateringRecords.ts`, the `deleteWateringRecord()` function only called the `onPlantDataChange()` callback for postponement deletions, not for regular watering record deletions:

```typescript
if (isPostponement) {
  utilityToast.deleted('Postponement');
  
  if (onPlantDataChange) {
    onPlantDataChange();  // Only called for postponements!
  }
} else {
  wateringToast.deleted();
}
```

### Solution

Modified the `deleteWateringRecord()` function to call `onPlantDataChange()` for **all** successful deletions:

```typescript
// Show success toast after database operation is successful
if (isPostponement) {
  utilityToast.deleted('Postponement');
} else {
  wateringToast.deleted();
}

// Trigger plant data refresh callback if provided
// This is important for both regular waterings and postponements to ensure
// the parent component's plant data is updated (e.g., updating the pill status on plant cards)
if (onPlantDataChange) {
  onPlantDataChange();
}
```

### Files Modified

- `/src/hooks/useWateringRecords.ts`:
  - Updated `deleteWateringRecord()` to call `onPlantDataChange()` for all deletions
  
- `/src/components/WateringHistoryDialog.tsx`:
  - Removed redundant postponement-specific callback logic
  - Simplified delete handler to rely on the hook's callback
  
- `/src/pages/MyPlantDetails.tsx`:
  - Updated comment to reflect that all deletions trigger refresh
  
- `/src/pages/HouseholdManagement.tsx`:
  - Added missing `onPlantDataChange={refetchPlants}` prop to `WateringHistoryDialog`
  
- `/src/components/MyPlantsCollection.tsx`:
  - Added missing `onPlantDataChange={fetchPlants}` prop to `WateringHistoryDialog`

### Benefits

1. **Consistent Behavior**: Plant status updates correctly after any watering record deletion
2. **No Manual Refresh**: Users don't need to refresh the page to see updated status
3. **Improved UX**: Immediate visual feedback when records are deleted
4. **Bug Prevention**: All components using `WateringHistoryDialog` now properly refresh plant data

## Additional Enhancement: Delete Confirmation Dialog

### Problem

When deleting a watering record from the History & Insights modal, clicking the trash icon would immediately delete the record without confirmation. This could lead to accidental deletions with no way to undo.

### Solution

Added a confirmation dialog using the existing `AlertDialog` component pattern:

1. **State Management**: Track which record is pending deletion with `recordToDelete` state
2. **Confirmation Dialog**: Show an AlertDialog asking the user to confirm before deleting
3. **Context-Aware Messages**: Display appropriate messages for regular waterings vs. postponements
4. **Notes Display**: Show the record's notes in the confirmation dialog (if present) to help users confirm they're deleting the right record

### Implementation Details

```typescript
// Track which record is pending deletion
const [recordToDelete, setRecordToDelete] = useState<WateringRecord | null>(null);

// Handle delete confirmation
const handleConfirmDelete = useCallback(async () => {
  if (!recordToDelete) return;
  
  try {
    await deleteWateringRecord(recordToDelete.id);
  } catch (error) {
    console.error("Error deleting record:", error);
    if (plant) {
      setTimeout(() => loadWateringRecords(plant.id), 500);
    }
  } finally {
    setRecordToDelete(null);
  }
}, [recordToDelete, deleteWateringRecord, plant, loadWateringRecords]);
```

### Files Modified

- `/src/components/WateringHistoryDialog.tsx`:
  - Added AlertDialog imports
  - Added `recordToDelete` state to track pending deletion
  - Updated delete button to show confirmation dialog instead of immediate deletion
  - Added `handleConfirmDelete` function to process confirmed deletions
  - Added AlertDialog component with context-aware messaging

### Benefits

1. **Prevents Accidental Deletions**: Users must confirm before deleting any record
2. **Better UX**: Clear messaging about what's being deleted
3. **Context Awareness**: Different messages for regular waterings vs. postponements
4. **Helpful Context**: Shows notes to help users verify they're deleting the correct record
5. **Consistent Pattern**: Uses the same AlertDialog pattern as other delete operations in the app


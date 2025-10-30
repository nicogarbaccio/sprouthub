# UI Components & Patterns

This document outlines the UI component patterns and best practices for SproutHub development.

## Toast Notifications

### Overview

SproutHub uses **[Sonner](https://sonner.emilkowal.ski/)** for all toast notifications. Sonner provides beautiful, customizable toast messages with excellent UX and accessibility.

### Why Sonner?

- **Modern & Beautiful**: Styled to match our design system
- **Rich Features**: Success, error, info, warning variants with descriptions
- **Accessibility**: ARIA-compliant with keyboard navigation
- **Developer Experience**: Simple API with TypeScript support
- **Performance**: Optimized rendering and animations

### Configuration

The Sonner `<Toaster />` component is configured in [App.tsx](../src/App.tsx) with:
- **Position**: `top-right`
- **Duration**: 4 seconds (4000ms)
- **Rich Colors**: Enabled with custom sprout-themed colors
- **Close Button**: Visible on all toasts
- **Custom Styling**: Themed for light/dark mode compatibility

### Usage

#### Basic Toast

```typescript
import { toast } from "sonner";

// Simple toast
toast("Plant watered successfully!");
```

#### Success Toast

```typescript
import { toast } from "sonner";

toast.success("Plant added!", {
  description: "Snake Plant has been added to your collection",
});
```

#### Error Toast

```typescript
import { toast } from "sonner";

toast.error("Failed to save plant", {
  description: "Please check your connection and try again",
});
```

#### Info Toast

```typescript
import { toast } from "sonner";

toast.info("Weather data updated", {
  description: "Your watering schedule has been adjusted based on today's forecast",
});
```

#### Warning Toast

```typescript
import { toast } from "sonner";

toast.warning("Plant needs attention", {
  description: "Your Fiddle Leaf Fig hasn't been watered in 10 days",
});
```

#### Toast with Action

```typescript
import { toast } from "sonner";

toast("Plant removed", {
  description: "The plant has been removed from your collection",
  action: {
    label: "Undo",
    onClick: () => {
      // Restore the plant
      restorePlant();
    },
  },
});
```

#### Promise-based Toast

```typescript
import { toast } from "sonner";

toast.promise(uploadImage(file), {
  loading: "Uploading image...",
  success: "Image uploaded successfully!",
  error: "Failed to upload image",
});
```

### Best Practices

#### ✅ DO

- **Use appropriate variants**: Match the toast type to the action result
  ```typescript
  // ✅ Success for successful operations
  toast.success("Plant watered!");

  // ✅ Error for failures
  toast.error("Failed to water plant");
  ```

- **Provide helpful descriptions**: Add context when needed
  ```typescript
  // ✅ Clear and actionable
  toast.error("Upload failed", {
    description: "Image must be less than 5MB. Try compressing it first.",
  });
  ```

- **Keep messages concise**: Users should understand at a glance
  ```typescript
  // ✅ Short and clear
  toast.success("Weather enabled");

  // ❌ Too verbose
  toast.success("The weather integration feature has now been successfully enabled for your account and will provide you with weather-based recommendations");
  ```

- **Use promise toasts for async operations**: Provide loading states
  ```typescript
  // ✅ Shows loading, success, and error states
  toast.promise(savePreferences(data), {
    loading: "Saving preferences...",
    success: "Preferences saved!",
    error: "Failed to save preferences",
  });
  ```

#### ❌ DON'T

- **Don't use the wrong toast system**:
  ```typescript
  // ❌ WRONG - This is shadcn/ui toast (not configured)
  import { useToast } from "@/hooks/use-toast";
  const { toast } = useToast();
  toast({ title: "Error" });

  // ✅ CORRECT - Use Sonner
  import { toast } from "sonner";
  toast.error("Error");
  ```

- **Don't show toasts after component unmounts**:
  ```typescript
  // ❌ WRONG - Dialog closes before toast shows
  onClose();
  setTimeout(() => toast.success("Saved!"), 0);

  // ✅ CORRECT - Show toast before closing
  toast.success("Saved!");
  onClose();
  ```

- **Don't overuse toasts**: Not every action needs a notification
  ```typescript
  // ❌ Too many toasts
  onClick={() => {
    toast.info("Loading...");
    toast.success("Clicked!");
    toast.info("Processing...");
  }}

  // ✅ One meaningful toast
  onClick={() => {
    toast.success("Action completed!");
  }}
  ```

### Examples from the Codebase

#### Weather Settings Save
```typescript
// From WeatherSettingsDialog.tsx
if (success) {
  if (useWeather) {
    toast.success("Weather enabled", {
      description: "Your dashboard will now show weather-based insights",
    });
  } else {
    toast.success("Weather disabled", {
      description: "Weather features have been turned off",
    });
  }
  onClose();
}
```

#### Location Geocoding
```typescript
// From WeatherSettingsDialog.tsx
try {
  const locationData = await weatherService.getLocationFromInput(manualLocation);
  setManualLocationData(locationData);
  toast.success("Location found", {
    description: `${locationData.city}${locationData.country ? `, ${locationData.country}` : ''}`,
  });
} catch (error) {
  toast.error("Location not found", {
    description: "Please try a different search term",
  });
}
```

#### Plant Management
```typescript
// From HouseholdManagement.tsx
try {
  await updatePlant(plantId, updates);
  toast.success("Plant updated successfully!");
} catch (error) {
  toast.error("Failed to update plant");
}
```

### Troubleshooting

#### Toast not appearing?

1. **Check the import**: Make sure you're importing from `"sonner"`
   ```typescript
   // ✅ Correct
   import { toast } from "sonner";

   // ❌ Wrong
   import { useToast } from "@/hooks/use-toast";
   ```

2. **Check component lifecycle**: Show toast before unmounting components
   ```typescript
   // ✅ Correct
   toast.success("Saved!");
   onClose(); // Close after toast

   // ❌ Wrong
   onClose(); // Close first
   setTimeout(() => toast.success("Saved!"), 0); // Too late
   ```

3. **Verify Toaster is mounted**: Check that `<Toaster />` is in [App.tsx](../src/App.tsx)

### Related Files

- [App.tsx](../src/App.tsx) - Toaster configuration
- [sonner.tsx](../src/components/ui/sonner.tsx) - Custom Sonner wrapper with theming
- [WeatherSettingsDialog.tsx](../src/components/WeatherSettingsDialog.tsx) - Example usage

---

## Other UI Components

### Dialog Components

[To be documented]

### Form Components

[To be documented]

### Card Components

[To be documented]

import { toast } from "sonner";

/**
 * Toast notification helpers using Sonner
 *
 * Sonner automatically handles icons based on toast type (success, error, warning, info).
 * The Toaster component in @/components/ui/sonner.tsx is styled with our sprout theme colors.
 */

// Smart toast functions for different contexts

/**
 * Plant-related success toasts
 */
export const plantToast = {
 added: (plantName: string) =>
 toast.success(`Plant Added Successfully`, {
  description: `${plantName} has been added to your collection`,
 }),

 updated: (plantName: string) =>
 toast.success(`Plant Updated`, {
  description: `${plantName} information has been saved`,
 }),

 deleted: (plantName: string) =>
 toast.success(`Plant Removed`, {
  description: `${plantName} has been removed from your collection`,
 }),

 careReminder: (plantName: string, careType: string) =>
 toast.warning(`Care Reminder`, {
  description: `${plantName} needs ${careType}`,
 }),

 error: (action: string, error?: string) =>
 toast.error(`Plant ${action} Failed`, {
  description: error || `Failed to ${action.toLowerCase()} plant`,
 }),
};

/**
 * Watering-specific toasts
 */
export const wateringToast = {
 recorded: (plantName: string) =>
 toast.success(`Watering Recorded`, {
  description: `Logged watering for ${plantName}`,
 }),

 reminder: (plantNames: string[]) => {
 const plantList = plantNames.length > 1
  ? `${plantNames.slice(0, -1).join(", ")} and ${plantNames[plantNames.length - 1]}`
  : plantNames[0];

 return toast.info(`Watering Reminder`, {
  description: `${plantList} ${plantNames.length > 1 ? "need" : "needs"} watering`,
 });
 },

 scheduled: (plantName: string) =>
 toast.success(`Schedule Updated`, {
  description: `Watering schedule updated for ${plantName}`,
 }),

 deleted: () =>
 toast.success(`Record Deleted`, {
  description: "Watering record has been removed",
 }),

 updated: () =>
 toast.success(`Record Updated`, {
  description: "Watering record has been updated successfully",
 }),

 error: (action: string) =>
 toast.error(`Watering ${action} Failed`, {
  description: `Unable to ${action.toLowerCase()} watering record`,
 }),
};

/**
 * Authentication toasts
 */
export const authToast = {
 signInSuccess: () =>
 toast.success(`Welcome Back!`, {
  description: "You have successfully signed in",
 }),

 signInError: (error: string) =>
 toast.error(`Sign In Failed`, {
  description: error,
 }),

 signUpSuccess: () =>
 toast.success(`Account Created!`, {
  description: "Welcome to sprouthub! Start adding your plants",
 }),

 signUpError: (error: string) =>
 toast.error(`Registration Failed`, {
  description: error,
 }),

 signOutSuccess: () =>
 toast.success(`Signed Out`, {
  description: "You have been signed out successfully",
 }),

 signOutError: () =>
 toast.error(`Sign Out Failed`, {
  description: "There was an error signing you out. Please try again.",
 }),

 resetPasswordSent: () =>
 toast.success(`Reset Email Sent`, {
  description: "Check your email for password reset instructions",
 }),

 resetPasswordError: (error: string) =>
 toast.error(`Reset Failed`, {
  description: error,
 }),

 passwordUpdated: () =>
 toast.success(`Password Updated`, {
  description: "Your password has been updated successfully",
 }),
};

/**
 * Profile and settings toasts
 */
export const profileToast = {
 updated: () =>
 toast.success(`Profile Updated`, {
  description: "Your profile information has been saved",
 }),

 passwordChanged: () =>
 toast.success(`Password Updated`, {
  description: "Your password has been changed successfully",
 }),

 error: (action: string, error?: string) =>
 toast.error(`Update Failed`, {
  description: error || `Failed to ${action}`,
 }),
};

/**
 * General utility toasts
 */
export const utilityToast = {
 saved: (item: string) =>
 toast.success(`Saved`, {
  description: `${item} has been saved successfully`,
 }),

 deleted: (item: string) =>
 toast.success(`Deleted`, {
  description: `${item} has been removed`,
 }),

 info: (title: string, description: string) =>
 toast.info(title, {
  description,
 }),

 tip: (title: string, description: string) =>
 toast.info(title, {
  description,
 }),

 warning: (title: string, description: string) =>
 toast.warning(title, {
  description,
 }),

 error: (title: string, description: string) =>
 toast.error(title, {
  description,
 }),
};

/**
 * Image upload toasts
 */
export const imageToast = {
 uploaded: () =>
 toast.success(`Image Uploaded`, {
  description: "Your image has been uploaded successfully",
 }),

 tooLarge: () =>
 toast.warning(`File Too Large`, {
  description: "Please select an image smaller than 5MB",
 }),

 invalidType: () =>
 toast.error(`Invalid File Type`, {
  description: "Please select a valid image file (JPG, PNG, WebP)",
 }),

 uploadError: () =>
 toast.error(`Upload Failed`, {
  description: "Failed to upload image. Please try again.",
 }),
};

/**
 * Unified toast interface combining all toast types
 *
 * Use this as the single entry point for all toast notifications in the app.
 * This provides a consistent, typed interface and prevents direct imports
 * of the base toast function or sonner, ensuring all toasts use our
 * emoji and styling conventions.
 *
 * @example
 * import { appToast } from '@/utils/toast-helpers';
 *
 * // Plant operations
 * appToast.plant.added('Monstera');
 *
 * // Watering operations
 * appToast.watering.recorded('Snake Plant');
 *
 * // General notifications
 * appToast.utility.success('Settings Saved', 'Your preferences have been updated');
 * appToast.utility.error('Save Failed', 'Unable to save your changes');
 */
export const appToast = {
  plant: plantToast,
  watering: wateringToast,
  auth: authToast,
  profile: profileToast,
  utility: utilityToast,
  image: imageToast,
} as const;

/**
 * @deprecated Import `appToast` instead for consistent toast usage
 *
 * This is kept for backward compatibility but new code should use `appToast`.
 *
 * @example
 * // ❌ Old way (deprecated)
 * import { plantToast } from '@/utils/toast-helpers';
 * plantToast.added('Monstera');
 *
 * // ✅ New way (recommended)
 * import { appToast } from '@/utils/toast-helpers';
 * appToast.plant.added('Monstera');
 */
export type { }; 
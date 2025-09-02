import { toast } from "@/hooks/use-toast";

// Toast emoji mappings
const TOAST_EMOJIS = {
  success: {
    plant: "🌱",
    general: "✅", 
    save: "💾",
    heart: "💚"
  },
  warning: {
    general: "⚠️",
    care: "🌿",
    watering: "💧",
    attention: "👀"
  },
  error: {
    general: "❌",
    blocked: "🚫",
    failed: "💥"
  },
  info: {
    general: "ℹ️",
    update: "📝",
    tip: "💡"
  },
  watering: {
    drop: "💧",
    shower: "🚿",
    plant: "🌿"
  }
} as const;

// Smart toast functions for different contexts

/**
 * Plant-related success toasts
 */
export const plantToast = {
  added: (plantName: string) =>
    toast({
      title: `${TOAST_EMOJIS.success.plant} Plant Added Successfully`,
      description: `${plantName} has been added to your collection`,
      variant: "success",
    }),
  
  updated: (plantName: string) =>
    toast({
      title: `${TOAST_EMOJIS.success.save} Plant Updated`,
      description: `${plantName} information has been saved`,
      variant: "success",
    }),
  
  deleted: (plantName: string) =>
    toast({
      title: `${TOAST_EMOJIS.success.general} Plant Removed`,
      description: `${plantName} has been removed from your collection`,
      variant: "success",
    }),
  
  careReminder: (plantName: string, careType: string) =>
    toast({
      title: `${TOAST_EMOJIS.warning.care} Care Reminder`,
      description: `${plantName} needs ${careType}`,
      variant: "warning",
    }),
  
  error: (action: string, error?: string) =>
    toast({
      title: `${TOAST_EMOJIS.error.failed} Plant ${action} Failed`,
      description: error || `Failed to ${action.toLowerCase()} plant`,
      variant: "error",
    }),
};

/**
 * Watering-specific toasts
 */
export const wateringToast = {
  recorded: (plantName: string) =>
    toast({
      title: `${TOAST_EMOJIS.watering.drop} Watering Recorded`,
      description: `Logged watering for ${plantName}`,
      variant: "watering",
    }),
  
  reminder: (plantNames: string[]) => {
    const plantList = plantNames.length > 1 
      ? `${plantNames.slice(0, -1).join(", ")} and ${plantNames[plantNames.length - 1]}`
      : plantNames[0];
    
    return toast({
      title: `${TOAST_EMOJIS.watering.shower} Watering Reminder`,
      description: `${plantList} ${plantNames.length > 1 ? "need" : "needs"} watering`,
      variant: "watering",
    });
  },
  
  scheduled: (plantName: string) =>
    toast({
      title: `${TOAST_EMOJIS.success.general} Schedule Updated`,
      description: `Watering schedule updated for ${plantName}`,
      variant: "success",
    }),
  
  deleted: () =>
    toast({
      title: `${TOAST_EMOJIS.success.general} Record Deleted`,
      description: "Watering record has been removed",
      variant: "success",
    }),
  
  error: (action: string) =>
    toast({
      title: `${TOAST_EMOJIS.error.failed} Watering ${action} Failed`,
      description: `Unable to ${action.toLowerCase()} watering record`,
      variant: "error",
    }),
};

/**
 * Authentication toasts
 */
export const authToast = {
  signInSuccess: () =>
    toast({
      title: `${TOAST_EMOJIS.success.general} Welcome Back!`,
      description: "You have successfully signed in",
      variant: "success",
    }),
  
  signInError: (error: string) =>
    toast({
      title: `${TOAST_EMOJIS.error.blocked} Sign In Failed`,
      description: error,
      variant: "error",
    }),
  
  signUpSuccess: () =>
    toast({
      title: `${TOAST_EMOJIS.success.heart} Account Created!`,
      description: "Welcome to SproutHub! Start adding your plants",
      variant: "success",
    }),
  
  signUpError: (error: string) =>
    toast({
      title: `${TOAST_EMOJIS.error.failed} Registration Failed`,
      description: error,
      variant: "error",
    }),
  
  signOutSuccess: () =>
    toast({
      title: `${TOAST_EMOJIS.success.general} Signed Out`,
      description: "You have been signed out successfully",
      variant: "success",
    }),
  
  signOutError: () =>
    toast({
      title: `${TOAST_EMOJIS.error.failed} Sign Out Failed`,
      description: "There was an error signing you out. Please try again.",
      variant: "error",
    }),

  resetPasswordSent: () =>
    toast({
      title: `${TOAST_EMOJIS.success.general} Reset Email Sent`,
      description: "Check your email for password reset instructions",
      variant: "success",
    }),

  resetPasswordError: (error: string) =>
    toast({
      title: `${TOAST_EMOJIS.error.failed} Reset Failed`,
      description: error,
      variant: "error",
    }),

  passwordUpdated: () =>
    toast({
      title: `${TOAST_EMOJIS.success.general} Password Updated`,
      description: "Your password has been updated successfully",
      variant: "success",
    }),
};

/**
 * Profile and settings toasts
 */
export const profileToast = {
  updated: () =>
    toast({
      title: `${TOAST_EMOJIS.success.save} Profile Updated`,
      description: "Your profile information has been saved",
      variant: "success",
    }),
  
  passwordChanged: () =>
    toast({
      title: `${TOAST_EMOJIS.success.general} Password Updated`,
      description: "Your password has been changed successfully",
      variant: "success",
    }),
  
  error: (action: string, error?: string) =>
    toast({
      title: `${TOAST_EMOJIS.error.failed} Update Failed`,
      description: error || `Failed to ${action}`,
      variant: "error",
    }),
};

/**
 * General utility toasts
 */
export const utilityToast = {
  saved: (item: string) =>
    toast({
      title: `${TOAST_EMOJIS.success.save} Saved`,
      description: `${item} has been saved successfully`,
      variant: "success",
    }),
  
  deleted: (item: string) =>
    toast({
      title: `${TOAST_EMOJIS.success.general} Deleted`,
      description: `${item} has been removed`,
      variant: "success",
    }),
  
  info: (title: string, description: string) =>
    toast({
      title: `${TOAST_EMOJIS.info.general} ${title}`,
      description,
      variant: "info",
    }),
  
  tip: (title: string, description: string) =>
    toast({
      title: `${TOAST_EMOJIS.info.tip} ${title}`,
      description,
      variant: "info",
    }),
  
  warning: (title: string, description: string) =>
    toast({
      title: `${TOAST_EMOJIS.warning.general} ${title}`,
      description,
      variant: "warning",
    }),
  
  error: (title: string, description: string) =>
    toast({
      title: `${TOAST_EMOJIS.error.general} ${title}`,
      description,
      variant: "error",
    }),
};

/**
 * Image upload toasts
 */
export const imageToast = {
  uploaded: () =>
    toast({
      title: `${TOAST_EMOJIS.success.general} Image Uploaded`,
      description: "Your image has been uploaded successfully",
      variant: "success",
    }),
  
  tooLarge: () =>
    toast({
      title: `${TOAST_EMOJIS.warning.general} File Too Large`,
      description: "Please select an image smaller than 5MB",
      variant: "warning",
    }),
  
  invalidType: () =>
    toast({
      title: `${TOAST_EMOJIS.error.blocked} Invalid File Type`,
      description: "Please select a valid image file (JPG, PNG, WebP)",
      variant: "error",
    }),
  
  uploadError: () =>
    toast({
      title: `${TOAST_EMOJIS.error.failed} Upload Failed`,
      description: "Failed to upload image. Please try again.",
      variant: "error",
    }),
}; 
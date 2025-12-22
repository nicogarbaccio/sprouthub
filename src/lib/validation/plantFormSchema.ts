import { z } from "zod";

// Plant form validation schema
export const plantFormSchema = z.object({
  nickname: z
    .string()
    .min(2, "Plant nickname must be at least 2 characters")
    .max(50, "Plant nickname must be less than 50 characters")
    .trim(),

  plant_type: z
    .string()
    .min(2, "Plant type must be at least 2 characters")
    .max(100, "Plant type must be less than 100 characters")
    .trim(),

  image: z
    .string()
    .url("Image must be a valid URL")
    .optional()
    .or(z.literal("")),

  room: z
    .string()
    .max(50, "Room name must be less than 50 characters")
    .optional()
    .or(z.literal("")),

  watering_schedule_days: z
    .number()
    .int("Watering schedule must be a whole number")
    .min(1, "Watering schedule must be at least 1 day")
    .max(365, "Watering schedule must be less than 365 days"),

  notes: z
    .string()
    .max(1000, "Notes must be less than 1000 characters")
    .optional()
    .or(z.literal("")),

  is_outdoor_plant: z.boolean().default(false),

  household_id: z
    .string()
    .uuid("Invalid household ID")
    .optional()
    .or(z.literal("")),

  alternative_names: z.array(z.string()).optional().default([]),
});

// Type inference from schema
export type PlantFormData = z.infer<typeof plantFormSchema>;

// Validation helpers for individual fields (for real-time validation)
export const validateNickname = (nickname: string) => {
  try {
    plantFormSchema.shape.nickname.parse(nickname);
    return { valid: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.issues[0].message };
    }
    return { valid: false, error: "Invalid nickname" };
  }
};

export const validatePlantType = (plantType: string) => {
  try {
    plantFormSchema.shape.plant_type.parse(plantType);
    return { valid: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.issues[0].message };
    }
    return { valid: false, error: "Invalid plant type" };
  }
};

export const validateWateringDays = (days: number) => {
  try {
    plantFormSchema.shape.watering_schedule_days.parse(days);
    return { valid: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.issues[0].message };
    }
    return { valid: false, error: "Invalid watering schedule" };
  }
};

export const validateRoom = (room: string) => {
  try {
    plantFormSchema.shape.room.parse(room);
    return { valid: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.issues[0].message };
    }
    return { valid: false, error: "Invalid room name" };
  }
};

export const validateImageUrl = (url: string) => {
  if (!url || url === "") return { valid: true, error: null };

  try {
    plantFormSchema.shape.image.parse(url);
    return { valid: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.issues[0].message };
    }
    return { valid: false, error: "Invalid image URL" };
  }
};

export const validateNotes = (notes: string) => {
  try {
    plantFormSchema.shape.notes.parse(notes);
    return { valid: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.issues[0].message };
    }
    return { valid: false, error: "Invalid notes" };
  }
};

// Character count helpers
export const getNicknameCharacterCount = (nickname: string) => {
  const length = nickname.trim().length;
  const max = 50;
  return { length, max, remaining: max - length };
};

export const getNotesCharacterCount = (notes: string) => {
  const length = notes.length;
  const max = 1000;
  return { length, max, remaining: max - length };
};

export const getRoomCharacterCount = (room: string) => {
  const length = room.trim().length;
  const max = 50;
  return { length, max, remaining: max - length };
};

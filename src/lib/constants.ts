/**
 * Plant-related constants
 */
export const PLANT_FALLBACK_IMAGE = "https://res.cloudinary.com/dojdglovh/image/upload/v1748969790/plant-emoji_78370-262_gmqqjg.jpg";

/**
 * Default plant care settings
 */
export const DEFAULT_WATERING_DAYS = 7;
export const DEFAULT_LIGHT_REQUIREMENT = "Medium Light";
export const DEFAULT_CARE_LEVEL = "Easy" as const;

/**
 * Plant categories
 */
export const PLANT_CATEGORIES = [
 "Trees & Large Plants",
 "Flowering Plants", 
 "Succulents & Cacti",
 "Hanging & Trailing Plants",
 "Prayer Plants",
 "Palms",
 "Small Plants"
] as const; 
/**
 * Utility script to update existing plant images to use auto-cropped versions
 * This script can be run to update existing plant data in your database
 */

import { getAutoCroppedImageUrl } from './imageUtils';

/**
 * Updates a plant image URL to use auto-cropping
 * @param originalUrl - The original image URL
 * @returns The auto-cropped URL
 */
export function updatePlantImageUrl(originalUrl: string): string {
  if (!originalUrl) {
    return originalUrl;
  }
  
  return getAutoCroppedImageUrl(originalUrl);
}

/**
 * Batch update function for multiple plant images
 * @param plants - Array of plant objects with image URLs
 * @returns Updated plants with auto-cropped image URLs
 */
export function updatePlantImages<T extends { image?: string; image_url?: string }>(
  plants: T[]
): T[] {
  return plants.map(plant => ({
    ...plant,
    image: plant.image ? updatePlantImageUrl(plant.image) : plant.image,
    image_url: plant.image_url ? updatePlantImageUrl(plant.image_url) : plant.image_url,
  }));
}

/**
 * Example usage for updating plant data
 * This is a template - you'll need to adapt it to your specific data structure
 */
export async function updateAllPlantImages() {
  // Example: Update plants from your database
  // const plants = await supabase.from('plants').select('*');
  // const updatedPlants = updatePlantImages(plants.data || []);
  // await supabase.from('plants').upsert(updatedPlants);
  
  console.log('Plant images updated with auto-cropping');
}

// Example URLs for testing
export const exampleUrls = {
  original: 'https://res.cloudinary.com/dojdglovh/image/upload/v1234567890/plant-collection/sample-plant.jpg',
  autoCropped: 'https://res.cloudinary.com/dojdglovh/image/upload/c_auto,g_auto:subject,q_auto:eco,f_auto/v1234567890/plant-collection/sample-plant.jpg'
};

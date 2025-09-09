# Plant Image Auto-Cropping Implementation

## Overview

This implementation uses Cloudinary's AI-powered auto-cropping features to ensure plant images show more of the actual plant by intelligently detecting and focusing on the main subject.

## Features

### 1. **Cloudinary Auto-Cropping**
- **Automatic subject detection**: Uses `g_auto:subject` to focus on the main plant
- **Smart cropping**: Uses `c_auto` to crop images optimally
- **Quality optimization**: Uses `q_auto:eco` for optimal file size vs quality
- **Format optimization**: Uses `f_auto` to serve the best format for each browser

### 2. **Enhanced PlantImage Component**
- **Auto-cropping by default**: All new images automatically use auto-cropping
- **Smart object positioning**: Automatically detects optimal CSS object-position
- **Fallback support**: Graceful degradation for non-Cloudinary images
- **Customizable**: Can disable auto-cropping or set custom object positions

### 3. **Image Utility Functions**
- **URL transformation**: Convert existing URLs to auto-cropped versions
- **Multiple sizes**: Generate optimized URLs for different use cases
- **Batch processing**: Update multiple plant images at once

## Implementation Details

### Cloudinary Upload Function
The upload function now includes these transformation parameters:
```typescript
const signatureParams = {
  timestamp,
  folder: 'plant-collection',
  crop: 'auto',           // Auto-crop to focus on subject
  gravity: 'auto:subject', // Focus on main subject (plant)
  quality: 'auto:eco',    // Optimize quality vs file size
  format: 'auto',         // Auto-format selection
};
```

### PlantImage Component Usage
```tsx
// Basic usage with auto-cropping (default)
<PlantImage src={plant.image} alt={plant.name} />

// With custom object position
<PlantImage 
  src={plant.image} 
  alt={plant.name} 
  objectPosition="center top" 
/>

// Disable auto-cropping if needed
<PlantImage 
  src={plant.image} 
  alt={plant.name} 
  useAutoCrop={false} 
/>
```

### Image Utility Functions
```typescript
import { getAutoCroppedImageUrl, getOptimizedImageUrls } from '@/utils/imageUtils';

// Convert single URL
const optimizedUrl = getAutoCroppedImageUrl(originalUrl);

// Get multiple optimized sizes
const urls = getOptimizedImageUrls(originalUrl);
// Returns: { thumbnail, card, detail, fullscreen }
```

## Benefits

1. **Better Plant Visibility**: Auto-cropping focuses on the plant, not background
2. **Consistent Results**: All images are cropped intelligently
3. **Performance**: Cloudinary handles processing server-side
4. **Flexibility**: Can override behavior when needed
5. **Backward Compatibility**: Existing images work without changes

## Migration Guide

### For New Images
New images uploaded through the app will automatically use auto-cropping.

### For Existing Images
To update existing plant images:

1. **Automatic**: The PlantImage component will automatically apply auto-cropping to Cloudinary URLs
2. **Manual**: Use the utility functions to update URLs in your database
3. **Batch**: Use the `updatePlantImages` utility for bulk updates

### Example Migration
```typescript
import { updatePlantImages } from '@/utils/updatePlantImages';

// Update all plants in your database
const plants = await supabase.from('plants').select('*');
const updatedPlants = updatePlantImages(plants.data || []);
await supabase.from('plants').upsert(updatedPlants);
```

## Testing

The implementation includes comprehensive tests covering:
- URL transformation logic
- Multiple size generation
- Edge cases and fallbacks
- Non-Cloudinary URL handling

Run tests with:
```bash
npm test src/utils/__tests__/imageUtils.test.ts
```

## Configuration

The auto-cropping behavior can be customized by modifying the transformation parameters in:
- `supabase/functions/upload-image/index.ts` - For new uploads
- `src/utils/imageUtils.ts` - For URL transformations

## Troubleshooting

### Images Not Auto-Cropping
1. Verify the image URL is from Cloudinary
2. Check that the PlantImage component is using `useAutoCrop={true}` (default)
3. Ensure the Cloudinary function is deployed with the latest changes

### Performance Issues
1. Auto-cropping is processed server-side by Cloudinary
2. Images are cached after first transformation
3. Use appropriate image sizes for different contexts

### Custom Object Positioning
If auto-detected positioning isn't optimal:
```tsx
<PlantImage 
  src={plant.image} 
  alt={plant.name} 
  objectPosition="center top" // Override auto-detection
/>
```

## Future Enhancements

Potential improvements:
1. **AI-powered plant detection**: More sophisticated plant-specific cropping
2. **Multiple crop options**: Different crops for different plant types
3. **User preferences**: Allow users to customize cropping behavior
4. **Batch processing**: Background processing for large image updates

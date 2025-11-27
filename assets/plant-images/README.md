# Plant Images

This folder contains the plant catalog images that will be uploaded to Supabase Storage.

## Folder Structure

Images are organized by plant category to match the data structure in `src/data/plants/`:

- `tropical-plants/` - Tropical houseplants (Monstera, Bird of Paradise, Alocasia, etc.)
- `trees-large-plants/` - Large trees and tree-like plants (Fiddle Leaf Fig, Rubber Tree, etc.)
- `succulents/` - Succulent plants (Snake Plant, Aloe Vera, Jade Plant, etc.)
- `air-plants/` - Air plants (Tillandsia varieties)
- `hanging-trailing-plants/` - Vining and trailing plants (Pothos, String of Pearls, etc.)
- `flowering-plants/` - Plants that flower (Peace Lily, African Violet, etc.)
- `low-maintenance/` - Low maintenance plants
- `ferns/` - Fern varieties
- `small-plants/` - Small houseplants
- `prayer-plants/` - Prayer plants and Calathea varieties
- `palms/` - Palm varieties
- `colorful-foliage/` - Plants with colorful leaves
- `common/` - Shared images (fallback images, placeholders, etc.)

## Naming Convention

When adding images, use descriptive filenames that match the plant name:

**Recommended format:**
```
{plant-name-kebab-case}.{ext}
```

**Examples:**
- `monstera-deliciosa.jpg`
- `snake-plant.jpg`
- `bird-of-paradise.jpg`
- `fiddle-leaf-fig.jpg`

## Image Requirements

- **Format**: JPG, PNG, or WebP
- **Recommended size**: 800-1200px width (for optimal web performance)
- **Aspect ratio**: 4:3 or 16:9 preferred
- **File size**: Keep under 500KB per image when possible

## Migration Process

1. Place images in the appropriate category folder
2. Use descriptive filenames matching the plant name
3. Images will be uploaded to Supabase Storage bucket: `plant-images`
4. URLs will be updated in the plant data files after upload

## Notes

- Original Cloudinary images are no longer accessible (account deactivated)
- New images should be sourced from:
  - Free stock photo sites (Unsplash, Pexels)
  - Original photography
  - AI-generated images
  - Public domain sources


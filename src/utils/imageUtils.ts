/**
 * Image utility functions for plant image optimization
 */

/**
 * Generates an optimized image URL.
 * Supports both legacy Cloudinary URLs and new Supabase Storage URLs.
 * @param originalUrl - The original image URL
 * @param width - Desired width (optional)
 * @param height - Desired height (optional)
 * @returns Optimized URL
 */
export function getAutoCroppedImageUrl(
  originalUrl: string,
  width?: number,
  height?: number
): string {
  if (!originalUrl) return "";

  // 1. Handle Legacy Cloudinary URLs (Keep existing logic)
  if (originalUrl.includes('cloudinary.com')) {
    const urlParts = originalUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) return originalUrl;

    const transformations = [
      'c_auto', // Auto crop
      'g_auto:subject', // Auto gravity focusing on main subject
      'q_auto:eco', // Auto quality optimization
      'f_auto', // Auto format selection
    ];

    // Add dimensions if specified
    if (width && height) {
      transformations.unshift(`w_${width},h_${height}`);
    } else if (width) {
      transformations.unshift(`w_${width}`);
    } else if (height) {
      transformations.unshift(`h_${height}`);
    }

    const baseUrl = urlParts.slice(0, uploadIndex + 1).join('/');
    const path = urlParts.slice(uploadIndex + 1).join('/');
    
    return `${baseUrl}/${transformations.join(',')}/${path}`;
  }

  // 2. Handle Supabase Storage URLs
  // Supabase Image Transformations (if enabled on your project) use query params.
  // Even without transformations, this returns the valid public URL.
  if (originalUrl.includes('supabase.co')) {
    const url = new URL(originalUrl);
    
    // If you have Supabase Image Transformations enabled (Pro plan), 
    // you can un-comment these lines:
    /*
    if (width) url.searchParams.set('width', width.toString());
    if (height) url.searchParams.set('height', height.toString());
    url.searchParams.set('resize', 'cover');
    */
    
    return url.toString();
  }

  // 3. Fallback for other URLs
  return originalUrl;
}

/**
 * Generates multiple optimized image URLs for different use cases
 */
export function getOptimizedImageUrls(originalUrl: string) {
  return {
    thumbnail: getAutoCroppedImageUrl(originalUrl, 150, 150),
    card: getAutoCroppedImageUrl(originalUrl, 400, 300),
    detail: getAutoCroppedImageUrl(originalUrl, 600, 400),
    fullscreen: getAutoCroppedImageUrl(originalUrl, 1200, 800),
  };
}

/**
 * Determines the best object position for plant images based on aspect ratio
 * @param imageUrl - The image URL
 * @returns Promise resolving to optimal object position
 */
export function getOptimalObjectPosition(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const aspectRatio = width / height;
      
      // For plant images, we typically want to focus on the center-top
      // to capture more of the plant foliage
      if (aspectRatio > 1.2) {
        // Wide images - focus on center-top
        resolve("center top");
      } else if (aspectRatio < 0.8) {
        // Tall images - focus on center
        resolve("center");
      } else {
        // Square-ish images - center is usually good
        resolve("center");
      }
    };
    img.onerror = () => resolve("center"); // fallback
    img.src = imageUrl;
  });
}

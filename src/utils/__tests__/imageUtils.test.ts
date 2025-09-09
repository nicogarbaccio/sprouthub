import { describe, it, expect } from 'vitest';
import { getAutoCroppedImageUrl, getOptimizedImageUrls } from '../imageUtils';

describe('Image Utils', () => {
  describe('getAutoCroppedImageUrl', () => {
    it('should return original URL for non-Cloudinary URLs', () => {
      const originalUrl = 'https://example.com/image.jpg';
      const result = getAutoCroppedImageUrl(originalUrl);
      expect(result).toBe(originalUrl);
    });

    it('should add auto-cropping transformations to Cloudinary URLs', () => {
      const originalUrl = 'https://res.cloudinary.com/test/image/upload/v1234567890/plant-collection/sample.jpg';
      const result = getAutoCroppedImageUrl(originalUrl);
      
      expect(result).toContain('c_auto');
      expect(result).toContain('g_auto:subject');
      expect(result).toContain('q_auto:eco');
      expect(result).toContain('f_auto');
    });

    it('should add dimensions when specified', () => {
      const originalUrl = 'https://res.cloudinary.com/test/image/upload/v1234567890/plant-collection/sample.jpg';
      const result = getAutoCroppedImageUrl(originalUrl, 400, 300);
      
      expect(result).toContain('w_400,h_300');
    });

    it('should handle width-only dimensions', () => {
      const originalUrl = 'https://res.cloudinary.com/test/image/upload/v1234567890/plant-collection/sample.jpg';
      const result = getAutoCroppedImageUrl(originalUrl, 400);
      
      expect(result).toContain('w_400');
      expect(result).not.toContain('h_');
    });

    it('should handle height-only dimensions', () => {
      const originalUrl = 'https://res.cloudinary.com/test/image/upload/v1234567890/plant-collection/sample.jpg';
      const result = getAutoCroppedImageUrl(originalUrl, undefined, 300);
      
      expect(result).toContain('h_300');
      expect(result).not.toContain('w_');
    });
  });

  describe('getOptimizedImageUrls', () => {
    it('should return multiple optimized URLs', () => {
      const originalUrl = 'https://res.cloudinary.com/test/image/upload/v1234567890/plant-collection/sample.jpg';
      const result = getOptimizedImageUrls(originalUrl);
      
      expect(result).toHaveProperty('thumbnail');
      expect(result).toHaveProperty('card');
      expect(result).toHaveProperty('detail');
      expect(result).toHaveProperty('fullscreen');
      
      // All URLs should contain auto-cropping transformations
      Object.values(result).forEach(url => {
        expect(url).toContain('c_auto');
        expect(url).toContain('g_auto:subject');
      });
    });

    it('should return original URL for non-Cloudinary URLs', () => {
      const originalUrl = 'https://example.com/image.jpg';
      const result = getOptimizedImageUrls(originalUrl);
      
      expect(result.thumbnail).toBe(originalUrl);
      expect(result.card).toBe(originalUrl);
      expect(result.detail).toBe(originalUrl);
      expect(result.fullscreen).toBe(originalUrl);
    });
  });
});

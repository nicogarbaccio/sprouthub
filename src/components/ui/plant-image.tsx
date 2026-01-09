import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PLANT_FALLBACK_IMAGE } from "@/lib/constants";
import {
  getAutoCroppedImageUrl,
  getOptimalObjectPosition,
} from "@/utils/imageUtils";
import { LazyImage } from "./lazy-image";

interface PlantImageProps {
  /** The primary image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Additional CSS classes to apply to the container */
  className?: string;
  /** Additional CSS classes to apply to the image element */
  imageClassName?: string;
  /** Custom fallback image URL (defaults to the standard plant placeholder) */
  fallbackSrc?: string;
  /** Whether to use auto-cropping (default: true) */
  useAutoCrop?: boolean;
  /** Custom object position (default: auto-detected) */
  objectPosition?: string;
}

/**
 * PlantImage Component
 *
 * A robust image component specifically designed for plant images that provides:
 * - Automatic fallback to a placeholder image when the primary image fails to load
 * - Loading state with animated placeholder
 * - Optimized for plant catalog and detail views
 * - Accessible with proper alt text support
 *
 * @example
 * ```tsx
 * // Basic usage with auto-cropping
 * <PlantImage src={plant.image} alt={plant.name} />
 *
 * // With custom styling and auto-cropping
 * <PlantImage
 * src={plant.image}
 * alt={plant.name}
 * className="w-full h-48 rounded-lg"
 * />
 *
 * // With custom object position
 * <PlantImage
 * src={plant.image}
 * alt={plant.name}
 * objectPosition="center top"
 * />
 *
 * // Disable auto-cropping
 * <PlantImage
 * src={plant.image}
 * alt={plant.name}
 * useAutoCrop={false}
 * />
 *
 * // With custom fallback
 * <PlantImage
 * src={plant.image}
 * alt={plant.name}
 * fallbackSrc="https://example.com/custom-placeholder.jpg"
 * />
 * ```
 */
const PlantImage = ({
  src,
  alt,
  className,
  imageClassName,
  fallbackSrc = PLANT_FALLBACK_IMAGE,
  useAutoCrop = true,
  objectPosition: customObjectPosition,
}: PlantImageProps) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [optimalObjectPosition, setOptimalObjectPosition] = useState("center");

  // Reset state when src changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(!!src);
    setOptimalObjectPosition("center");
  }, [src]);

  // Generate optimized image URL
  const imageUrl = useAutoCrop ? getAutoCroppedImageUrl(src) : src;

  // Auto-detect optimal object position if not provided
  useEffect(() => {
    if (!customObjectPosition && src && !hasError) {
      getOptimalObjectPosition(src).then(setOptimalObjectPosition);
    }
  }, [src, customObjectPosition, hasError]);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const finalObjectPosition = customObjectPosition || optimalObjectPosition;
  const showFallback = hasError || !src;

  return (
    <LazyImage
      src={showFallback ? fallbackSrc : imageUrl}
      alt={alt}
      containerClassName={className}
      className={cn("w-full h-full object-cover", imageClassName)}
      style={{ objectPosition: finalObjectPosition }}
      onError={handleError}
      onLoad={handleLoad}
      aspectRatio="auto"
    />
  );
};

export default PlantImage;

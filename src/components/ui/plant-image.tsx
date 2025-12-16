import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PLANT_FALLBACK_IMAGE } from "@/lib/constants";
import {
  getAutoCroppedImageUrl,
  getOptimalObjectPosition,
} from "@/utils/imageUtils";

interface PlantImageProps {
  /** The primary image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Additional CSS classes to apply to the container */
  className?: string;
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
    setIsLoading(true);
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

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <img
        src={hasError ? fallbackSrc : imageUrl}
        alt={alt}
        className="w-full h-full object-cover"
        style={{ objectPosition: finalObjectPosition }}
        onError={handleError}
        onLoad={handleLoad}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-plant-neutral animate-pulse" />
      )}
    </div>
  );
};

export default PlantImage;

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PLANT_FALLBACK_IMAGE } from "@/lib/constants";

interface PlantImageProps {
 /** The primary image source URL */
 src: string;
 /** Alt text for accessibility */
 alt: string;
 /** Additional CSS classes to apply to the container */
 className?: string;
 /** Custom fallback image URL (defaults to the standard plant placeholder) */
 fallbackSrc?: string;
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
 * // Basic usage
 * <PlantImage src={plant.image} alt={plant.name} />
 *
 * // With custom styling
 * <PlantImage
 * src={plant.image}
 * alt={plant.name}
 * className="w-full h-48 rounded-lg"
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
}: PlantImageProps) => {
 const [hasError, setHasError] = useState(false);
 const [isLoading, setIsLoading] = useState(true);

 const handleError = () => {
 setHasError(true);
 setIsLoading(false);
 };

 const handleLoad = () => {
 setIsLoading(false);
 };

 return (
 <div className={cn("relative overflow-hidden", className)}>
  <img
  src={hasError ? fallbackSrc : src}
  alt={alt}
  className="w-full h-full object-cover"
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

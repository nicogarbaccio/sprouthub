import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  /**
   * Loading message to display
   */
  message?: string;
  /**
   * Size variant for the spinner
   */
  size?: "sm" | "md" | "lg";
  /**
   * Whether to center the loading state in its container
   */
  centered?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

/**
 * Reusable loading state component with consistent styling
 *
 * @example
 * ```tsx
 * <LoadingState message="Loading plants..." />
 * <LoadingState size="lg" centered />
 * ```
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
  size = "md",
  centered = true,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3",
        centered && "justify-center min-h-[200px]",
        className
      )}
    >
      <Loader2
        className={cn("animate-spin text-muted-foreground", sizeClasses[size])}
        aria-label="Loading"
      />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

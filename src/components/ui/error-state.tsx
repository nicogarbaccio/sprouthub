import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  /**
   * Error title
   */
  title?: string;
  /**
   * Error message or description
   */
  message?: string;
  /**
   * Callback when retry button is clicked
   */
  onRetry?: () => void;
  /**
   * Custom retry button text
   */
  retryText?: string;
  /**
   * Whether to center the error state in its container
   */
  centered?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable error state component with consistent styling and retry functionality
 *
 * @example
 * ```tsx
 * <ErrorState
 *   title="Failed to load plants"
 *   message="Please check your connection and try again"
 *   onRetry={() => refetch()}
 * />
 * ```
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "An error occurred while loading this content.",
  onRetry,
  retryText = "Try again",
  centered = true,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 text-center",
        centered && "justify-center min-h-[200px]",
        className
      )}
    >
      <div className="rounded-full bg-destructive/10 p-3">
        <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {retryText}
        </Button>
      )}
    </div>
  );
};

import { useState, useEffect, useRef } from "react";
import { SkipCascadeContext } from "@/components/ui/cascading-container";

interface LoadingTransitionProps {
  loading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  /** Crossfade duration in ms (default: 300) */
  duration?: number;
  className?: string;
}

/**
 * Crossfades between a skeleton and content.
 *
 * Children are only rendered once loading becomes false for the first time,
 * so content can safely access data without null-checking during initial load.
 * During the crossfade the skeleton fades out over the content which fades in.
 *
 * The skeleton stays the same DOM node from first render through its fade-out
 * (it's keyed and never moves to a different tree), otherwise it would be
 * remounted already invisible and simply vanish. Content is rendered fully
 * visible (CascadingContainers inside skip their own fade-in), so there is no
 * blank frame between skeleton and content.
 */
export const LoadingTransition = ({
  loading,
  skeleton,
  children,
  duration = 300,
  className = "",
}: LoadingTransitionProps) => {
  // Track whether content has ever been ready (so we can mount it)
  const [hasLoaded, setHasLoaded] = useState(!loading);
  // Keep the skeleton mounted until the fade-out animation finishes
  const [showSkeleton, setShowSkeleton] = useState(loading);
  // Only fade content in if it's replacing a skeleton; data that's already
  // available on mount (e.g. from the query cache) shows immediately
  const fadeInContent = useRef(loading);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!loading) {
      // Data is ready — mount content and let the skeleton fade out
      setHasLoaded(true);
      timerRef.current = setTimeout(() => {
        setShowSkeleton(false);
      }, duration);
    } else if (!hasLoaded) {
      // Only re-show skeleton if content has never been mounted.
      // Once the user sees real content, background refetches should NOT
      // flash the skeleton again — the stale content stays visible instead.
      clearTimeout(timerRef.current);
      setShowSkeleton(true);
    }

    return () => clearTimeout(timerRef.current);
  }, [loading, duration, hasLoaded]);

  return (
    <div className={`relative ${className}`}>
      {/* Content layer — only mounted after first load completes */}
      {hasLoaded && (
        <div
          key="content"
          className={fadeInContent.current ? "animate-in fade-in" : undefined}
          style={fadeInContent.current ? { animationDuration: `${duration}ms` } : undefined}
        >
          <SkipCascadeContext.Provider value={true}>{children}</SkipCascadeContext.Provider>
        </div>
      )}

      {/* Skeleton layer — in normal flow while loading, then overlays the content and fades out */}
      {showSkeleton && (
        <div
          key="skeleton"
          aria-hidden={hasLoaded}
          style={
            hasLoaded
              ? {
                  opacity: 0,
                  transition: `opacity ${duration}ms ease-out`,
                  position: "absolute",
                  inset: 0,
                  overflow: "hidden",
                  pointerEvents: "none",
                }
              : undefined
          }
        >
          {skeleton}
        </div>
      )}
    </div>
  );
};

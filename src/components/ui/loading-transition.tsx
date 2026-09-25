import { useState, useEffect, useRef } from "react";
import { SkipCascadeContext } from "@/components/ui/cascading-container";

interface LoadingTransitionProps {
  loading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  /** Crossfade duration in ms (default: 300) */
  duration?: number;
  /**
   * How long to wait before showing the skeleton, in ms (default: 200). Loads that finish
   * sooner go straight to content, so fast pages never flash a skeleton.
   */
  delay?: number;
  className?: string;
}

/**
 * Crossfades between a skeleton and content.
 *
 * Children are only rendered once loading becomes false for the first time,
 * so content can safely access data without null-checking during initial load.
 *
 * The skeleton only appears if loading takes longer than `delay`; until then nothing is shown.
 * Once shown, it fades out over the content as the content fades in. It stays the same DOM
 * node from first render through its fade-out (it's keyed and never moves to a different
 * tree), otherwise it would be remounted already invisible and simply vanish. Content is
 * rendered fully visible (CascadingContainers inside skip their own fade-in), so there is no
 * blank frame between skeleton and content.
 */
export const LoadingTransition = ({
  loading,
  skeleton,
  children,
  duration = 300,
  delay = 200,
  className = "",
}: LoadingTransitionProps) => {
  // Track whether content has ever been ready (so we can mount it)
  const [hasLoaded, setHasLoaded] = useState(!loading);
  // Whether the skeleton is mounted: after the grace delay, until its fade-out finishes
  const [showSkeleton, setShowSkeleton] = useState(false);
  // Content fades in only when it replaces a skeleton the user actually saw
  const skeletonWasShown = useRef(false);

  useEffect(() => {
    if (loading && !hasLoaded) {
      // Only reveal the skeleton if loading outlasts the grace delay. Once the user sees
      // real content, background refetches never bring the skeleton back.
      const timer = setTimeout(() => {
        skeletonWasShown.current = true;
        setShowSkeleton(true);
      }, delay);
      return () => clearTimeout(timer);
    }

    if (!loading) {
      // Data is ready: mount content and let any visible skeleton fade out
      setHasLoaded(true);
      if (skeletonWasShown.current) {
        const timer = setTimeout(() => setShowSkeleton(false), duration);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, hasLoaded, delay, duration]);

  const fadeInContent = skeletonWasShown.current;

  return (
    <div className={`relative ${className}`}>
      {/* Content layer — only mounted after first load completes */}
      {hasLoaded && (
        <div
          key="content"
          className={fadeInContent ? "animate-in fade-in" : undefined}
          style={fadeInContent ? { animationDuration: `${duration}ms` } : undefined}
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

/**
 * For pages that render a skeleton directly instead of through LoadingTransition: shows
 * nothing for the first `delay` ms, so a fast load never flashes the skeleton.
 */
export function DelayedSkeleton({ children, delay = 200 }: { children: React.ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return visible ? <>{children}</> : null;
}

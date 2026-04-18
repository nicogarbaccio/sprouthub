import { useState, useEffect, useRef } from "react";

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

  // While content has never loaded, just show the skeleton directly
  if (!hasLoaded) {
    return <div className={className}>{skeleton}</div>;
  }

  const transition = `opacity ${duration}ms ease-out`;

  return (
    <div className={`relative ${className}`}>
      {/* Content layer — only mounted after first load completes */}
      <div
        style={{
          opacity: !hasLoaded && loading ? 0 : 1,
          transition,
        }}
      >
        {children}
      </div>

      {/* Skeleton layer — overlays content during initial crossfade, then unmounts */}
      {showSkeleton && (
        <div
          aria-hidden={!loading}
          style={{
            opacity: loading && !hasLoaded ? 1 : 0,
            transition,
            position: "absolute",
            inset: 0,
            pointerEvents: loading && !hasLoaded ? "auto" : "none",
          }}
        >
          {skeleton}
        </div>
      )}
    </div>
  );
};

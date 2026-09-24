import { useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { SkipCascadeContext } from "@/components/ui/cascading-container";

/**
 * Wraps page content with CSS enter transitions (tailwindcss-animate keyframes).
 * - Forward navigation: fade in from right
 * - Back navigation: fade in from left
 * - Respects prefers-reduced-motion (motion-reduce:animate-none)
 *
 * Enter-only: the old page is swapped out directly rather than faded to blank first,
 * so there's never an empty frame between pages. Combined with the router's
 * startTransition, the old page stays visible until the new one is ready to render.
 *
 * Page content skips CascadingContainer's staggered fade-in: this transition is the
 * page's entrance animation, and a second one would leave the page blank while it plays.
 */

// Bottom nav tab paths — transitions between these use a simple fade
const tabPaths = new Set(["/", "/my-plants", "/plant-catalog", "/auth"]);

function getBasePath(pathname: string) {
  // Extract the first segment, e.g. "/my-plants/123" -> "/my-plants"
  const segments = pathname.split("/").filter(Boolean);
  return segments.length > 0 ? `/${segments[0]}` : "/";
}

export const AnimatedRoutes = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  const currentBase = getBasePath(location.pathname);
  const prevBase = getBasePath(prevPath.current);

  // Determine if this is a tab switch (fade) or a drill-down (slide)
  const isTabSwitch =
    tabPaths.has(currentBase) && tabPaths.has(prevBase) && currentBase !== prevBase;

  // Determine direction: deeper path = forward, shallower = back
  const currentDepth = location.pathname.split("/").filter(Boolean).length;
  const prevDepth = prevPath.current.split("/").filter(Boolean).length;
  const isBack = currentDepth < prevDepth;

  // Don't animate the very first page of the session — only navigations
  const isFirstRender = useRef(true);
  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  const animationClass = isFirstRender.current
    ? undefined
    : isTabSwitch
      ? "animate-in fade-in motion-reduce:animate-none"
      : isBack
        ? "animate-in fade-in slide-in-from-left-[30px] motion-reduce:animate-none"
        : "animate-in fade-in slide-in-from-right-[30px] motion-reduce:animate-none";

  // Update previous path ref after render
  const key = location.pathname;
  if (prevPath.current !== location.pathname) {
    prevPath.current = location.pathname;
  }

  return (
    <div
      key={key}
      className={animationClass}
      style={{ animationDuration: "200ms", animationTimingFunction: "cubic-bezier(0.25, 0.1, 0.25, 1)" }}
    >
      <SkipCascadeContext.Provider value={true}>{children}</SkipCascadeContext.Provider>
    </div>
  );
};

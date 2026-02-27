import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useRef } from "react";

/**
 * Wraps page content with framer-motion transitions.
 * - Forward navigation: fade in from right
 * - Back navigation: fade in from left
 * - Respects prefers-reduced-motion
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

  // Update ref after calculating direction
  const slideX = isBack ? -30 : 30;

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const variants = prefersReducedMotion
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
      }
    : isTabSwitch
      ? {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        }
      : {
          initial: { opacity: 0, x: slideX },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -slideX },
        };

  // Update previous path ref after render
  const key = location.pathname;
  if (prevPath.current !== location.pathname) {
    prevPath.current = location.pathname;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={key}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ willChange: "opacity, transform" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

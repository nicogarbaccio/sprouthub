import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

/**
 * Web-based splash screen shown briefly on app launch (PWA/browser).
 * Shows the logo with a fade-in, then fades out to reveal the app — as soon as the
 * page underneath says it's ready (see `markAppReady`), or after SHOW_MS at most.
 * Only shows once per session.
 */
// Match Tailwind's lg breakpoint
const isMobile = () =>
  typeof window !== "undefined" && window.innerWidth < 1024;

/** Longest the splash stays up when nothing reports ready */
const SHOW_MS = 1200;
/** Shortest, so a fast load doesn't flash the logo */
const MIN_SHOW_MS = 500;
const FADE_OUT_MS = 400;

const READY_EVENT = "sprouthub:app-ready";
let appReady = false;

/**
 * Called by a page once its content can render without skeletons, so the splash
 * hands straight over to it instead of waiting out its timer.
 */
export function markAppReady() {
  if (appReady) return;
  appReady = true;
  window.dispatchEvent(new Event(READY_EVENT));
}

export const SplashScreen = () => {
  const [phase, setPhase] = useState<"visible" | "fading" | "gone">(() => {
    // Only show on mobile, once per session
    if (!isMobile()) return "gone";
    if (sessionStorage.getItem("splash-shown")) return "gone";
    sessionStorage.setItem("splash-shown", "1");
    return "visible";
  });

  useEffect(() => {
    if (phase === "visible") {
      const shownAt = performance.now();
      let minTimer: ReturnType<typeof setTimeout> | undefined;
      const fade = () => setPhase("fading");
      const onReady = () => {
        minTimer = setTimeout(fade, Math.max(0, MIN_SHOW_MS - (performance.now() - shownAt)));
      };
      const maxTimer = setTimeout(fade, SHOW_MS);
      if (appReady) onReady();
      else window.addEventListener(READY_EVENT, onReady, { once: true });
      return () => {
        clearTimeout(maxTimer);
        clearTimeout(minTimer);
        window.removeEventListener(READY_EVENT, onReady);
      };
    }
    if (phase === "fading") {
      const timer = setTimeout(() => setPhase("gone"), FADE_OUT_MS);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-sprout-primary transition-opacity ease-out",
        phase === "fading" && "opacity-0"
      )}
      style={{ transitionDuration: `${FADE_OUT_MS}ms` }}
    >
      <Logo
        onGreen
        alt="sprouthub"
        className="h-20 w-auto mb-4 animate-in fade-in zoom-in-[0.8] [animation-duration:400ms] delay-100 fill-mode-both"
      />
      <span className="text-3xl font-bold text-white animate-in fade-in slide-in-from-bottom-[10px] duration-300 delay-300 fill-mode-both">
        <span className="text-sprout-success">sprout</span><span className="text-sprout-cream">hub</span>
      </span>
    </div>
  );
};

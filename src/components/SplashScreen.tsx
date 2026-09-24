import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * Web-based splash screen shown briefly on app launch (PWA/browser).
 * Shows the logo with a fade-in, then fades out to reveal the app.
 * Only shows once per session.
 */
// Match Tailwind's lg breakpoint
const isMobile = () =>
  typeof window !== "undefined" && window.innerWidth < 1024;

const SHOW_MS = 1200;
const FADE_OUT_MS = 400;

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
      const timer = setTimeout(() => setPhase("fading"), SHOW_MS);
      return () => clearTimeout(timer);
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
      <img
        src="/LogoDark.svg"
        alt="sprouthub"
        className="h-20 w-auto mb-4 animate-in fade-in zoom-in-[0.8] [animation-duration:400ms] delay-100 fill-mode-both"
      />
      <span className="text-3xl font-bold text-sprout-cream animate-in fade-in slide-in-from-bottom-[10px] duration-300 delay-300 fill-mode-both">
        sprouthub
      </span>
    </div>
  );
};

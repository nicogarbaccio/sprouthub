import React from "react";
import { Download, X, Smartphone } from "lucide-react";
import { usePWA } from "@/hooks/use-pwa";

interface PWAInstallBannerProps {
  onDismiss?: () => void;
  className?: string;
  delayMs?: number; // Delay before showing banner
  maxDismissals?: number; // Max times user can dismiss before hiding permanently
}

export function PWAInstallBanner({
  onDismiss,
  className,
  delayMs = 10000, // 10 seconds delay by default
  maxDismissals = 3, // Allow 3 dismissals before hiding permanently
}: PWAInstallBannerProps) {
  const { canInstall, promptInstall, isStandalone } = usePWA();
  const [dismissed, setDismissed] = React.useState(false);
  const [shouldShow, setShouldShow] = React.useState(false);

  // Check localStorage for banner state
  React.useEffect(() => {
    const bannerState = localStorage.getItem("pwa-install-banner");
    const dismissCount = parseInt(
      localStorage.getItem("pwa-banner-dismiss-count") || "0"
    );
    const permanentlyDismissed =
      localStorage.getItem("pwa-banner-permanently-dismissed") === "true";

    // Don't show if permanently dismissed or max dismissals reached
    if (permanentlyDismissed || dismissCount >= maxDismissals) {
      return;
    }

    // Don't show if user recently dismissed (within 24 hours)
    if (bannerState) {
      const dismissedAt = parseInt(bannerState);
      const hoursSinceDismissal = (Date.now() - dismissedAt) / (1000 * 60 * 60);
      if (hoursSinceDismissal < 24) {
        return;
      }
    }

    // Show banner after delay if conditions are met
    if (canInstall && !isStandalone) {
      const timer = setTimeout(() => {
        setShouldShow(true);
      }, delayMs);

      return () => clearTimeout(timer);
    }
  }, [canInstall, isStandalone, delayMs, maxDismissals]);

  // Don't show if basic conditions aren't met
  if (!canInstall || isStandalone || dismissed || !shouldShow) {
    return null;
  }

  const handleInstall = async () => {
    await promptInstall();
    setDismissed(true);
    // Clear dismiss count since user installed
    localStorage.removeItem("pwa-banner-dismiss-count");
    localStorage.removeItem("pwa-install-banner");
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();

    // Track dismissal
    const currentCount = parseInt(
      localStorage.getItem("pwa-banner-dismiss-count") || "0"
    );
    const newCount = currentCount + 1;

    localStorage.setItem("pwa-banner-dismiss-count", newCount.toString());
    localStorage.setItem("pwa-install-banner", Date.now().toString());

    // If user dismissed too many times, hide permanently
    if (newCount >= maxDismissals) {
      localStorage.setItem("pwa-banner-permanently-dismissed", "true");
    }
  };

  const handleNotNow = () => {
    setDismissed(true);
    onDismiss?.();

    // Store timestamp for "not now" - show again in 24 hours
    localStorage.setItem("pwa-install-banner", Date.now().toString());
  };

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 z-50 rounded-tile bg-sprout-cream text-sprout-dark p-4 shadow-[0_12px_30px_rgba(29,60,40,0.25)] animate-in slide-in-from-bottom-2 duration-500 ${className ?? ""}`}
      role="dialog"
      aria-label="Install sprouthub"
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 shrink-0 rounded-[14px] bg-sprout-dark text-sprout-cream flex items-center justify-center">
          <Smartphone className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-bold tracking-[-0.02em]">Install sprouthub</h3>
          <p className="text-sm font-medium mt-0.5">
            Add it to your home screen for quick access, offline use and plant care reminders.
          </p>

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleInstall}
              className="h-10 px-4 rounded-full bg-sprout-dark text-sprout-cream text-[13px] font-bold inline-flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Install
            </button>
            <button
              type="button"
              onClick={handleNotNow}
              className="h-10 px-4 rounded-full border-[1.5px] border-sprout-dark text-[13px] font-bold"
            >
              Not now
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="w-9 h-9 shrink-0 rounded-xl bg-sprout-dark/10 flex items-center justify-center"
          aria-label="Don't show again"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Hook for manual control of PWA banner
export function usePWABanner() {
  const resetBannerState = () => {
    localStorage.removeItem("pwa-install-banner");
    localStorage.removeItem("pwa-banner-dismiss-count");
    localStorage.removeItem("pwa-banner-permanently-dismissed");
  };

  const getBannerState = () => {
    return {
      dismissCount: parseInt(
        localStorage.getItem("pwa-banner-dismiss-count") || "0"
      ),
      lastDismissed: localStorage.getItem("pwa-install-banner"),
      permanentlyDismissed:
        localStorage.getItem("pwa-banner-permanently-dismissed") === "true",
    };
  };

  return {
    resetBannerState,
    getBannerState,
  };
}

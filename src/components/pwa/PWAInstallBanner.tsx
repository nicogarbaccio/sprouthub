import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
 <Card
  className={`fixed bottom-4 left-4 right-4 z-50 shadow-lg border-plant-primary/20 bg-gradient-to-r from-plant-primary/5 to-plant-secondary/5 animate-in slide-in-from-bottom-2 duration-500 ${className}`}
 >
  <CardContent className="p-4">
  <div className="flex items-start space-x-3">
   <div className="flex-shrink-0">
   <div className="w-10 h-10 bg-plant-primary/10 rounded-full flex items-center justify-center">
    <Smartphone className="w-5 h-5 text-plant-primary" />
   </div>
   </div>

   <div className="flex-1 min-w-0">
   <h3 className="text-sm font-semibold text-plant-text mb-1">
    Install SproutHub
   </h3>
   <p className="text-xs text-plant-text/70 mb-3">
    Add to your home screen for quick access and offline use. Get
    native app experience with push notifications for plant care
    reminders.
   </p>

   <div className="flex space-x-2">
    <Button
    onClick={handleInstall}
    size="sm"
    className="bg-plant-primary hover:bg-plant-primary/90 text-white px-4 py-2 h-8 text-xs"
    >
    <Download className="w-3 h-3 mr-1" />
    Install
    </Button>
    <Button
    onClick={handleNotNow}
    variant="ghost"
    size="sm"
    className="text-plant-text/60 hover:text-plant-text px-2 py-2 h-8"
    >
    Not now
    </Button>
   </div>
   </div>

   <Button
   onClick={handleDismiss}
   variant="ghost"
   size="icon"
   className="flex-shrink-0 w-6 h-6 text-plant-text/60 hover:text-plant-text"
   title="Don't show again"
   >
   <X className="w-4 h-4" />
   </Button>
  </div>
  </CardContent>
 </Card>
 );
}

// Simplified install button for navigation or other locations
export function PWAInstallButton() {
 const { canInstall, promptInstall, isStandalone } = usePWA();

 if (!canInstall || isStandalone) {
 return null;
 }

 return (
 <Button
  onClick={promptInstall}
  variant="outline"
  size="sm"
  className="border-plant-primary text-plant-primary hover:bg-plant-primary hover:text-white"
 >
  <Download className="w-4 h-4 mr-2" />
  Install App
 </Button>
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

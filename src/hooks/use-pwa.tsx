import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
 readonly platforms: string[];
 readonly userChoice: Promise<{
 outcome: "accepted" | "dismissed";
 platform: string;
 }>;
 prompt(): Promise<void>;
}

interface PWAState {
 canInstall: boolean;
 isInstalled: boolean;
 isOnline: boolean;
 isStandalone: boolean;
 promptInstall: () => Promise<void>;
}

export function usePWA(): PWAState {
 const [installEvent, setInstallEvent] =
 useState<BeforeInstallPromptEvent | null>(null);
 const [canInstall, setCanInstall] = useState(false);
 const [isInstalled, setIsInstalled] = useState(false);
 const [isOnline, setIsOnline] = useState(navigator.onLine);
 const [isStandalone, setIsStandalone] = useState(false);

 const checkStandalone = useCallback(() => {
  const isStandaloneMode =
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as unknown as { standalone?: boolean }).standalone ||
  document.referrer.includes("android-app://");
  setIsStandalone(isStandaloneMode);
 }, []);

 const handleBeforeInstallPrompt = useCallback((event: Event) => {
  event.preventDefault();
  const installEvent = event as BeforeInstallPromptEvent;
  setInstallEvent(installEvent);
  setCanInstall(true);
 }, []);

 const handleAppInstalled = useCallback(() => {
  setIsInstalled(true);
  setCanInstall(false);
  setInstallEvent(null);
 }, []);

 const handleOnline = useCallback(() => setIsOnline(true), []);
 const handleOffline = useCallback(() => setIsOnline(false), []);

 useEffect(() => {
  checkStandalone();

  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.addEventListener("appinstalled", handleAppInstalled);
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
  window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.removeEventListener("appinstalled", handleAppInstalled);
  window.removeEventListener("online", handleOnline);
  window.removeEventListener("offline", handleOffline);
  };
 }, [checkStandalone, handleAppInstalled, handleBeforeInstallPrompt, handleOffline, handleOnline]);

 const promptInstall = async (): Promise<void> => {
 if (!installEvent) return;

 try {
  await installEvent.prompt();
  const choiceResult = await installEvent.userChoice;

  if (choiceResult.outcome === "accepted") {
  console.log("User accepted the install prompt");
  setIsInstalled(true);
  } else {
  console.log("User dismissed the install prompt");
  }

  setInstallEvent(null);
  setCanInstall(false);
 } catch (error) {
  console.error("Error during install prompt:", error);
 }
 };

 return {
 canInstall,
 isInstalled,
 isOnline,
 isStandalone,
 promptInstall,
 };
}

// Service Worker registration utility
export function registerServiceWorker() {
 if ("serviceWorker" in navigator) {
 window.addEventListener("load", () => {
  navigator.serviceWorker
  .register("/sw.js")
  .then((registration) => {
   console.log("SW registered: ", registration);
  })
  .catch((registrationError) => {
   console.log("SW registration failed: ", registrationError);
  });
 });
 }
}

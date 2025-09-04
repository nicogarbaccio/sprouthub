import { useState, useEffect } from "react";

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

 useEffect(() => {
 // Check if app is running in standalone mode
 const checkStandalone = () => {
  const isStandaloneMode =
  window.matchMedia("(display-mode: standalone)").matches ||
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window.navigator as any).standalone ||
  document.referrer.includes("android-app://");
  setIsStandalone(isStandaloneMode);
 };

 checkStandalone();

 // Listen for beforeinstallprompt event
 const handleBeforeInstallPrompt = (e: Event) => {
  e.preventDefault();
  const installEvent = e as BeforeInstallPromptEvent;
  setInstallEvent(installEvent);
  setCanInstall(true);
 };

 // Listen for app installed event
 const handleAppInstalled = () => {
  setIsInstalled(true);
  setCanInstall(false);
  setInstallEvent(null);
 };

 // Listen for online/offline events
 const handleOnline = () => setIsOnline(true);
 const handleOffline = () => setIsOnline(false);

 window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
 window.addEventListener("appinstalled", handleAppInstalled);
 window.addEventListener("online", handleOnline);
 window.addEventListener("offline", handleOffline);

 return () => {
  window.removeEventListener(
  "beforeinstallprompt",
  handleBeforeInstallPrompt
  );
  window.removeEventListener("appinstalled", handleAppInstalled);
  window.removeEventListener("online", handleOnline);
  window.removeEventListener("offline", handleOffline);
 };
 }, []);

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

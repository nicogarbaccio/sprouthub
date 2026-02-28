import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Toast } from "@capacitor/toast";
import { StatusBar, Style } from "@capacitor/status-bar";

export function useCapacitor() {
 const [isNative, setIsNative] = useState(false);
 const [deviceInfo] = useState<Record<string, unknown> | null>(
 null
 );

 useEffect(() => {
 setIsNative(Capacitor.isNativePlatform());

 // Set up status bar for iOS
 if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
  StatusBar.setStyle({ style: Style.Default });
  StatusBar.setBackgroundColor({ color: "#4a6741" });
 }
 }, []);

 const takePlantPhoto = async () => {
 try {
  const image = await Camera.getPhoto({
  quality: 90,
  allowEditing: true,
  resultType: CameraResultType.Uri,
  source: CameraSource.Camera,
  });

  // Haptic feedback on successful photo
  if (isNative) {
  await Haptics.impact({ style: ImpactStyle.Light });
  }

  return image.webPath;
 } catch (error) {
  console.error("Error taking photo:", error);
  if (isNative) {
  await showToast("Failed to take photo");
  }
  throw error;
 }
 };

 const selectPlantPhoto = async () => {
 try {
  const image = await Camera.getPhoto({
  quality: 90,
  allowEditing: true,
  resultType: CameraResultType.Uri,
  source: CameraSource.Photos,
  });

  return image.webPath;
 } catch (error) {
  console.error("Error selecting photo:", error);
  if (isNative) {
  await showToast("Failed to select photo");
  }
  throw error;
 }
 };

 const showToast = async (message: string) => {
 if (isNative) {
  await Toast.show({
  text: message,
  duration: "short",
  position: "bottom",
  });
 }
 };

 const provideFeedback = async (
 style: "light" | "medium" | "heavy" = "light"
 ) => {
 if (isNative) {
  const impactStyle = {
  light: ImpactStyle.Light,
  medium: ImpactStyle.Medium,
  heavy: ImpactStyle.Heavy,
  };

  await Haptics.impact({ style: impactStyle[style] });
 }
 };

 const successFeedback = async () => {
 if (isNative) {
  await Haptics.notification({ type: NotificationType.Success });
 }
 };

 const errorFeedback = async () => {
 if (isNative) {
  await Haptics.notification({ type: NotificationType.Error });
 }
 };

 return {
 isNative,
 deviceInfo,
 camera: {
  takePlantPhoto,
  selectPlantPhoto,
 },
 ui: {
  showToast,
  provideFeedback,
  successFeedback,
  errorFeedback,
 },
 };
}

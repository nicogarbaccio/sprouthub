import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, RotateCcw, Check, X } from "lucide-react";
import { useHaptic } from "@/hooks/use-touch";
import { cn } from "@/lib/utils";

interface CameraCaptureProps {
 onCapture: (imageBlob: Blob, imageUrl: string) => void;
 onCancel?: () => void;
 className?: string;
 quality?: number;
 maxWidth?: number;
 maxHeight?: number;
}

export function CameraCapture({
 onCapture,
 onCancel,
 className,
 quality = 0.8,
 maxWidth = 1024,
 maxHeight = 1024,
}: CameraCaptureProps) {
 const [isActive, setIsActive] = useState(false);
 const [capturedImage, setCapturedImage] = useState<string | null>(null);
 const [facingMode, setFacingMode] = useState<"user" | "environment">(
 "environment"
 );
 const [error, setError] = useState<string | null>(null);

 const videoRef = useRef<HTMLVideoElement>(null);
 const canvasRef = useRef<HTMLCanvasElement>(null);
 const streamRef = useRef<MediaStream | null>(null);

 const { mediumImpact, success } = useHaptic();

 const startCamera = useCallback(async () => {
 try {
  setError(null);
  const stream = await navigator.mediaDevices.getUserMedia({
  video: {
   facingMode,
   width: { ideal: maxWidth },
   height: { ideal: maxHeight },
  },
  });

  if (videoRef.current) {
  videoRef.current.srcObject = stream;
  streamRef.current = stream;
  setIsActive(true);
  }
 } catch (err) {
  console.error("Camera access error:", err);
  setError("Camera access denied or not available");
 }
 }, [facingMode, maxWidth, maxHeight]);

 const stopCamera = useCallback(() => {
 if (streamRef.current) {
  streamRef.current.getTracks().forEach((track) => track.stop());
  streamRef.current = null;
 }
 setIsActive(false);
 }, []);

 const switchCamera = useCallback(() => {
 stopCamera();
 setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
 mediumImpact();
 }, [stopCamera, mediumImpact]);

 const capturePhoto = useCallback(() => {
 if (!videoRef.current || !canvasRef.current) return;

 const video = videoRef.current;
 const canvas = canvasRef.current;
 const context = canvas.getContext("2d");

 if (!context) return;

 // Set canvas dimensions
 canvas.width = video.videoWidth;
 canvas.height = video.videoHeight;

 // Draw video frame to canvas
 context.drawImage(video, 0, 0);

 // Convert to blob with compression
 canvas.toBlob(
  (blob) => {
  if (blob) {
   const imageUrl = URL.createObjectURL(blob);
   setCapturedImage(imageUrl);
   success(); // Haptic feedback
  }
  },
  "image/jpeg",
  quality
 );
 }, [quality, success]);

 const confirmCapture = useCallback(() => {
 if (!capturedImage || !canvasRef.current) return;

 canvasRef.current.toBlob(
  (blob) => {
  if (blob) {
   onCapture(blob, capturedImage);
   stopCamera();
   setCapturedImage(null);
  }
  },
  "image/jpeg",
  quality
 );
 }, [capturedImage, onCapture, stopCamera, quality]);

 const retakePhoto = useCallback(() => {
 if (capturedImage) {
  URL.revokeObjectURL(capturedImage);
 }
 setCapturedImage(null);
 mediumImpact();
 }, [capturedImage, mediumImpact]);

 const handleCancel = useCallback(() => {
 stopCamera();
 if (capturedImage) {
  URL.revokeObjectURL(capturedImage);
 }
 setCapturedImage(null);
 onCancel?.();
 }, [stopCamera, capturedImage, onCancel]);

 // Start camera when component mounts
 React.useEffect(() => {
 if (!isActive && !capturedImage) {
  startCamera();
 }

 return () => {
  stopCamera();
  if (capturedImage) {
  URL.revokeObjectURL(capturedImage);
  }
 };
 }, []);

 React.useEffect(() => {
 if (facingMode && !capturedImage) {
  startCamera();
 }
 }, [facingMode, startCamera, capturedImage]);

 if (error) {
 return (
  <Card className={cn("w-full max-w-md mx-auto", className)}>
  <CardContent className="p-6 text-center">
   <div className="mb-4">
   <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
   <h3 className="text-lg font-semibold text-gray-900 mb-2">
    Camera Error
   </h3>
   <p className="text-sm text-gray-600 mb-4">{error}</p>
   </div>
   <div className="space-y-2">
   <Button onClick={startCamera} className="w-full">
    Try Again
   </Button>
   <Button onClick={handleCancel} variant="outline" className="w-full">
    Cancel
   </Button>
   </div>
  </CardContent>
  </Card>
 );
 }

 return (
 <div className={cn("relative w-full max-w-md mx-auto", className)}>
  {/* Camera View */}
  <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
  {/* Video Stream */}
  <video
   ref={videoRef}
   autoPlay
   playsInline
   muted
   className={cn(
   "w-full h-full object-cover",
   capturedImage && "hidden"
   )}
  />

  {/* Captured Image Preview */}
  {capturedImage && (
   <img
   src={capturedImage}
   alt="Captured plant"
   className="w-full h-full object-cover"
   />
  )}

  {/* Canvas for capture (hidden) */}
  <canvas ref={canvasRef} className="hidden" />

  {/* Camera Controls Overlay */}
  <div className="absolute inset-0 flex flex-col justify-between p-4">
   {/* Top Controls */}
   <div className="flex justify-between items-center">
   <Button
    onClick={handleCancel}
    variant="outline"
    size="icon"
    className="bg-black/50 border-white/20 text-white hover:bg-black/70"
   >
    <X className="w-4 h-4" />
   </Button>

   {!capturedImage && (
    <Button
    onClick={switchCamera}
    variant="outline"
    size="icon"
    className="bg-black/50 border-white/20 text-white hover:bg-black/70"
    >
    <RotateCcw className="w-4 h-4" />
    </Button>
   )}
   </div>

   {/* Bottom Controls */}
   <div className="flex justify-center items-center space-x-6">
   {capturedImage ? (
    <>
    <Button
     onClick={retakePhoto}
     variant="outline"
     size="lg"
     className="bg-black/50 border-white/20 text-white hover:bg-black/70"
    >
     <RotateCcw className="w-5 h-5 mr-2" />
     Retake
    </Button>
    <Button
     onClick={confirmCapture}
     size="lg"
     className="bg-plant-primary hover:bg-plant-primary/90"
    >
     <Check className="w-5 h-5 mr-2" />
     Use Photo
    </Button>
    </>
   ) : (
    <Button
    onClick={capturePhoto}
    size="icon"
    className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 text-black border-4 border-white/80"
    disabled={!isActive}
    >
    <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-300" />
    </Button>
   )}
   </div>
  </div>
  </div>

  {/* Instructions */}
  <div className="mt-4 text-center">
  <p className="text-sm text-gray-600">
   {capturedImage
   ? "Review your plant photo and confirm to save"
   : "Position your plant in the frame and tap to capture"}
  </p>
  </div>
 </div>
 );
}

// Quick photo capture button for existing forms
export function QuickCameraButton({
 onCapture,
 className,
}: {
 onCapture: (imageBlob: Blob, imageUrl: string) => void;
 className?: string;
}) {
 const [showCamera, setShowCamera] = useState(false);

 const handleCapture = useCallback(
 (blob: Blob, url: string) => {
  onCapture(blob, url);
  setShowCamera(false);
 },
 [onCapture]
 );

 if (showCamera) {
 return (
  <CameraCapture
  onCapture={handleCapture}
  onCancel={() => setShowCamera(false)}
  className={className}
  />
 );
 }

 return (
 <Button
  onClick={() => setShowCamera(true)}
  variant="outline"
  className={cn("w-full", className)}
 >
  <Camera className="w-4 h-4 mr-2" />
  Take Photo
 </Button>
 );
}

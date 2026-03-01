import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn, ZoomOut, RotateCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FullscreenImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt: string;
  plantName?: string;
  imageSource?: string;
  className?: string;
}

/**
 * FullscreenImageModal Component
 *
 * A fullscreen modal for viewing plant images with zoom and interaction capabilities.
 * Features:
 * - Fullscreen overlay with backdrop blur
 * - Zoom in/out functionality
 * - Image rotation
 * - Download option
 * - Keyboard navigation (Escape to close)
 * - Touch/click outside to close
 * - Accessible with proper focus management
 *
 * @example
 * ```tsx
 * <FullscreenImageModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   imageSrc={plant.image}
 *   imageAlt={plant.name}
 *   plantName={plant.name}
 * />
 * ```
 */
const FullscreenImageModal: React.FC<FullscreenImageModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  imageAlt,
  plantName,
  imageSource,
  className,
}) => {
  const [scale, setScale] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [lastTap, setLastTap] = React.useState(0);
  const [showMobileHint, setShowMobileHint] = React.useState(false);

  // Reset zoom and rotation when modal opens
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      // Show mobile hint on mobile devices
      if (window.innerWidth < 640) {
        setShowMobileHint(true);
        setTimeout(() => setShowMobileHint(false), 3000);
      }
    }
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          onClose();
          break;
        case "+":
        case "=":
          event.preventDefault();
          handleZoomIn();
          break;
        case "-":
          event.preventDefault();
          handleZoomOut();
          break;
        case "r":
        case "R":
          event.preventDefault();
          handleRotate();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev / 1.2, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${plantName || "plant-image"}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    // Close modal when clicking on the backdrop (dark area)
    const target = event.target as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;

    // Check if we clicked directly on the backdrop or an area marked as closeable
    if (
      target === currentTarget ||
      target.hasAttribute("data-backdrop-close")
    ) {
      onClose();
    }
  };

  // Handle double tap to zoom on mobile
  const handleImageClick = (event: React.MouseEvent) => {
    // Prevent click from bubbling up to backdrop (which would close the modal)
    event.stopPropagation();

    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;

    if (tapLength < 300 && tapLength > 0) {
      // Double tap detected
      if (scale === 1) {
        setScale(2);
      } else {
        setScale(1);
      }
    }
    setLastTap(currentTime);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm",
        className
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fullscreen-image-title"
    >
      {/* Header with controls */}
      <div
        className="absolute top-4 left-4 right-4 flex items-center justify-between z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-2">
          {plantName && (
            <div className="flex flex-col">
              <h2
                id="fullscreen-image-title"
                className="text-white text-lg font-medium "
              >
                {plantName}
              </h2>
              {imageSource && (
                <p className="text-white/70 text-xs mt-0.5 max-w-[200px] truncate">
                  Source: {imageSource}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1 md:space-x-2">
          {/* Zoom controls */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleZoomOut}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 hidden sm:flex"
            disabled={scale <= 0.5}
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>

          <span className="text-white text-sm font-medium min-w-[3rem] text-center hidden sm:block">
            {Math.round(scale * 100)}%
          </span>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleZoomIn}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 hidden sm:flex"
            disabled={scale >= 5}
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>

          {/* Rotate button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRotate}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 hidden sm:flex"
            title="Rotate (R)"
          >
            <RotateCw className="w-4 h-4" />
          </Button>

          {/* Download button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 hidden sm:flex"
            title="Download Image"
          >
            <Download className="w-4 h-4" />
          </Button>

          {/* Close button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            title="Close (Escape)"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Image container */}
      <div
        className="flex-1 flex items-center justify-center px-4 pt-20 pb-16 sm:px-16 sm:pt-24 sm:pb-20 overflow-hidden"
        data-backdrop-close
      >
        <div
          className="relative transition-transform duration-200 ease-out cursor-move select-none"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
          }}
          onClick={handleImageClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleImageClick(e as unknown as React.MouseEvent);
            }
          }}
          aria-label="Double tap to zoom"
        >
          <img
            src={imageSrc}
            alt={imageAlt}
            className="max-w-[85vw] max-h-[60vh] sm:max-w-[70vw] sm:max-h-[65vh] object-contain rounded-lg shadow-2xl"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src =
                "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400&h=300&fit=crop";
            }}
          />
        </div>
      </div>

      {/* Instructions - desktop */}
      <div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 hidden sm:flex flex-col items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-black/50 text-white text-xs px-3 py-2 rounded-full backdrop-blur-sm">
          Press <kbd className="bg-white/20 px-1 rounded">Esc</kbd> to close •
          <kbd className="bg-white/20 px-1 rounded mx-1">+/-</kbd> to zoom •
          <kbd className="bg-white/20 px-1 rounded">R</kbd> to rotate
        </div>
      </div>

      {/* Mobile hint */}
      {showMobileHint && (
        <div
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 sm:hidden flex flex-col items-center gap-2 w-full px-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-black/70 text-white text-sm px-4 py-2 rounded-full backdrop-blur-sm animate-fade-in whitespace-nowrap">
            Double tap to zoom • Tap outside to close
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default FullscreenImageModal;

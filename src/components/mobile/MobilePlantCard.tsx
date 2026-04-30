import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Droplets,
  Sun,
  Heart,
  Camera,
  ArrowRight,
  Edit3,
} from "lucide-react";
import { useSwipe, useHaptic } from "@/hooks/use-touch";
import { cn } from "@/lib/utils";
import PlantImage from "@/components/ui/plant-image";
import FullscreenImageModal from "@/components/ui/fullscreen-image-modal";
import { ImageExpandButton } from "@/components/ui/image-expand-button";
import WaterConfirmationDialog from "@/components/WaterConfirmationDialog";
import { shouldShowOverwateringWarning } from "@/utils/plants/overwatering";

interface MobilePlantCardProps {
  plant: {
    id: string;
    name: string;
    species?: string;
    image_url?: string;
    last_watered?: string;
    next_watering?: string;
    care_difficulty?: "easy" | "medium" | "hard";
    light_requirement?: "low" | "medium" | "high";
    is_favorite?: boolean;
    suggested_watering_days?: number;
  };
  onWater?: (plantId: string) => void;
  onFavorite?: (plantId: string) => void;
  onEdit?: (plantId: string) => void;
  onShare?: (plantId: string) => void;
  onPhotoAdd?: (plantId: string) => void;
  onView?: (plantId: string) => void;
  className?: string;
}

export function MobilePlantCard({
  plant,
  onWater,
  onFavorite,
  onEdit,
  onShare: _onShare,
  onPhotoAdd,
  onView,
  className,
}: MobilePlantCardProps) {
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(
    null
  );
  const [showActions, setShowActions] = useState(false);
  const [showWaterConfirmation, setShowWaterConfirmation] = useState(false);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const { lightImpact, mediumImpact, success } = useHaptic();

  const swipeHandlers = useSwipe(
    {
      onSwipeLeft: () => {
        setSwipeDirection("left");
        setShowActions(true);
        lightImpact();
        setTimeout(() => {
          setSwipeDirection(null);
          setShowActions(false);
        }, 2000);
      },
      onSwipeRight: () => {
        setSwipeDirection("right");
        setShowActions(true);
        lightImpact();
        setTimeout(() => {
          setSwipeDirection(null);
          setShowActions(false);
        }, 2000);
      },
      onTap: () => {
        if (!showActions) {
          onView?.(plant.id);
          lightImpact();
        }
      },
    },
    {
      threshold: 30,
      deltaXThreshold: 50,
    }
  );

  const handleWater = () => {
    setShowWaterConfirmation(true);
    setShowActions(false);
  };

  const handleConfirmWater = (_notes?: string) => {
    onWater?.(plant.id);
    success();
  };

  const handleAlreadyWatered = (_date: string, _notes?: string) => {
    // FUTURE FEATURE: Implement backdating watering to a specific date
    // This would require modifying onWater to accept a date parameter
    // For now, just water the plant with current timestamp
    onWater?.(plant.id);
    success();
  };

  // Check if we should show overwatering warning
  const { showWarning: showOverwateringWarning, daysSinceLastWatered } =
    shouldShowOverwateringWarning(
      plant.last_watered,
      plant.suggested_watering_days || 7
    );

  const handleFavorite = () => {
    onFavorite?.(plant.id);
    mediumImpact();
    setShowActions(false);
  };

  const getDaysSinceWatered = () => {
    if (!plant.last_watered) return null;
    const lastWatered = new Date(plant.last_watered);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastWatered.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getWateringStatus = () => {
    const daysSince = getDaysSinceWatered();
    if (!daysSince) return "unknown";
    if (daysSince <= 2) return "good";
    if (daysSince <= 5) return "due";
    return "overdue";
  };

  const wateringStatus = getWateringStatus();
  const daysSinceWatered = getDaysSinceWatered();

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Swipe Actions Background */}
      {showActions && (
        <div className="absolute inset-0 z-10 flex">
          {swipeDirection === "left" && (
            <div className="w-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-end pr-6 space-x-4">
              <Button
                onClick={() => onPhotoAdd?.(plant.id)}
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <Camera className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => onEdit?.(plant.id)}
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <Edit3 className="w-5 h-5" />
              </Button>
            </div>
          )}
          {swipeDirection === "right" && (
            <div className="w-full bg-gradient-to-l from-green-500 to-green-600 flex items-center justify-start pl-6 space-x-4">
              <Button
                onClick={handleWater}
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <Droplets className="w-5 h-5" />
              </Button>
              <Button
                onClick={handleFavorite}
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <Heart
                  className={cn(
                    "w-5 h-5",
                    plant.is_favorite ? "fill-white" : ""
                  )}
                />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Main Card */}
      <Card
        className={cn(
          "transition-transform duration-200 cursor-pointer active:scale-95",
          showActions &&
            swipeDirection === "left" &&
            "transform translate-x-[-80px]",
          showActions &&
            swipeDirection === "right" &&
            "transform translate-x-[80px]",
          wateringStatus === "overdue" &&
            "border-sprout-warning/50 bg-sprout-warning/10",
          wateringStatus === "due" &&
            "border-sprout-cream/60 bg-sprout-cream/15",
          "hover:shadow-md active:shadow-lg"
        )}
        {...swipeHandlers}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            {/* Plant Image */}
            <div className="flex-shrink-0">
              <div
                className="relative w-16 h-16 rounded-lg bg-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200 group"
                onClick={() => onView?.(plant.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onView?.(plant.id);
                  }
                }}
                aria-label={`View ${plant.name} details`}
              >
                {plant.image_url ? (
                  <PlantImage
                    src={plant.image_url}
                    alt={plant.name}
                    className="w-full h-full transition-transform duration-200 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                    <Sun className="w-8 h-8 text-green-500" />
                  </div>
                )}
                {plant.image_url && (
                  <ImageExpandButton
                    onExpand={() => setShowFullscreenImage(true)}
                    className="p-0.5 bottom-1 right-1 [&_svg]:w-2.5 [&_svg]:h-2.5"
                  />
                )}
              </div>
            </div>

            {/* Plant Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {plant.name}
                  </h3>
                  {plant.species && (
                    <p className="text-sm text-gray-500 truncate">
                      {plant.species}
                    </p>
                  )}
                </div>

                {/* Favorite indicator */}
                {plant.is_favorite && (
                  <Heart className="w-4 h-4 text-red-500 fill-red-500 flex-shrink-0" />
                )}
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-1 mt-2">
                {plant.care_difficulty && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs px-2 py-0.5",
                      plant.care_difficulty === "easy" &&
                        "border-sprout-success/30 text-sprout-success bg-sprout-success/20",
                      plant.care_difficulty === "medium" &&
                        "border-sprout-warning/30 text-sprout-warning bg-sprout-warning/20",
                      plant.care_difficulty === "hard" &&
                        "border-sprout-warning/50 text-sprout-dark bg-sprout-warning/40"
                    )}
                  >
                    {plant.care_difficulty}
                  </Badge>
                )}

                {plant.light_requirement && (
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-0.5 border-sprout-water/30 text-sprout-water bg-sprout-water/20"
                  >
                    <Sun className="w-3 h-3 mr-1" />
                    {plant.light_requirement}
                  </Badge>
                )}
              </div>

              {/* Watering Status */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-2">
                  <Droplets
                    className={cn(
                      "w-4 h-4",
                      wateringStatus === "good" && "text-sprout-success",
                      wateringStatus === "due" && "text-sprout-cream",
                      wateringStatus === "overdue" && "text-sprout-warning",
                      wateringStatus === "unknown" && "text-neutral-medium"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm",
                      wateringStatus === "good" && "text-sprout-success",
                      wateringStatus === "due" && "text-sprout-dark",
                      wateringStatus === "overdue" && "text-sprout-warning",
                      wateringStatus === "unknown" && "text-neutral-medium"
                    )}
                  >
                    {daysSinceWatered
                      ? `${daysSinceWatered} day${
                          daysSinceWatered > 1 ? "s" : ""
                        } ago`
                      : "Not tracked"}
                  </span>
                </div>

                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Swipe instruction hint */}
      {!showActions && (
        <div className="absolute bottom-1 right-1 opacity-30">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full" />
            <div className="w-1 h-1 bg-gray-400 rounded-full" />
            <div className="w-1 h-1 bg-gray-400 rounded-full" />
          </div>
        </div>
      )}

      <WaterConfirmationDialog
        open={showWaterConfirmation}
        onOpenChange={setShowWaterConfirmation}
        onConfirm={handleConfirmWater}
        onAlreadyWatered={handleAlreadyWatered}
        plantName={plant.name}
        showOverwateringWarning={showOverwateringWarning}
        daysSinceLastWatered={daysSinceLastWatered}
        wateringScheduleDays={plant.suggested_watering_days || 7}
        lastWateredDate={plant.last_watered}
      />

      <FullscreenImageModal
        isOpen={showFullscreenImage}
        onClose={() => setShowFullscreenImage(false)}
        imageSrc={plant.image_url || ""}
        imageAlt={plant.name}
        plantName={plant.name}
      />
    </div>
  );
}

// Quick actions overlay for when swipe isn't available
export function PlantQuickActions({
  plant,
  onWater,
  onFavorite,
  onEdit: _onEdit,
  onShare: _onShare,
  onPhotoAdd,
  className,
}: {
  plant: { id: string; is_favorite?: boolean };
  onWater?: (plantId: string) => void;
  onFavorite?: (plantId: string) => void;
  onEdit?: (plantId: string) => void;
  onShare?: (plantId: string) => void;
  onPhotoAdd?: (plantId: string) => void;
  className?: string;
}) {
  const { mediumImpact, success } = useHaptic();

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Button
        onClick={() => {
          onWater?.(plant.id);
          success();
        }}
        size="sm"
        variant="outline"
        className="text-blue-600 border-blue-200 hover:bg-blue-50"
      >
        <Droplets className="w-4 h-4 mr-1" />
        Water
      </Button>

      <Button
        onClick={() => {
          onFavorite?.(plant.id);
          mediumImpact();
        }}
        size="sm"
        variant="outline"
        className={cn(
          "border-red-200 hover:bg-red-50",
          plant.is_favorite ? "text-red-600 bg-red-50" : "text-gray-600"
        )}
      >
        <Heart
          className={cn(
            "w-4 h-4",
            plant.is_favorite ? "fill-red-500 text-red-500" : ""
          )}
        />
      </Button>

      <Button
        onClick={() => onPhotoAdd?.(plant.id)}
        size="sm"
        variant="outline"
        className="text-green-600 border-green-200 hover:bg-green-50"
      >
        <Camera className="w-4 h-4" />
      </Button>
    </div>
  );
}

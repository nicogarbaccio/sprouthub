import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Droplets, AlertTriangle, Edit, Clock, History } from "lucide-react";
import type { OverwateringRisk } from "@/utils/overwatering";
import { shouldShowOverwateringWarning } from "@/utils/overwatering";
import PlantImage from "@/components/ui/plant-image";
import WaterConfirmationDialog from "@/components/WaterConfirmationDialog";

interface MyPlantCardProps {
  id: string;
  name: string;
  plantType: string;
  image: string;
  lastWatered: string;
  lastWateredDate?: string; // Raw ISO date string for calculations
  nextWateringDue: string;
  isOverdue: boolean;
  daysUntilWatering: number;
  hasUnknownWateringDate: boolean;
  isPostponed?: boolean; // If the latest watering record is a postponement
  suggestedWateringDays?: number; // For overwatering warning calculation
  onWater: () => void;
  onEdit: () => void;
  onPostpone?: () => void;
  onViewHistory?: () => void;
  overwatering?: OverwateringRisk;
}

const MyPlantCard = ({
  name,
  plantType,
  image,
  lastWatered,
  lastWateredDate,
  nextWateringDue,
  isOverdue,
  daysUntilWatering,
  hasUnknownWateringDate,
  isPostponed,
  suggestedWateringDays = 7,
  onWater,
  onEdit,
  onPostpone,
  onViewHistory,
  overwatering,
}: MyPlantCardProps) => {
  const [showWaterConfirmation, setShowWaterConfirmation] = useState(false);

  const isOverwateringActive = !!(
    overwatering && overwatering.level !== "none"
  );

  // Check if we should show overwatering warning
  const { showWarning: showOverwateringWarning, daysSinceLastWatered } =
    shouldShowOverwateringWarning(lastWateredDate, suggestedWateringDays);

  const handleWaterClick = () => {
    setShowWaterConfirmation(true);
  };

  const handleConfirmWater = () => {
    onWater();
  };
  const getStatusColor = () => {
    if (hasUnknownWateringDate)
      return "bg-neutral-500 text-white border-neutral-500";
    if (isPostponed) return "bg-sprout-water text-white border-sprout-water";
    if (isOverdue) return "bg-red-500 text-white border-red-500";

    if (daysUntilWatering === 0) {
      // Check if truly just watered vs due today
      if (lastWateredDate) {
        const today = new Date();
        const lastWateredDateObj = new Date(lastWateredDate);
        const timeDiff = today.getTime() - lastWateredDateObj.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // If watered within the last 12 hours, show success green (watered today)
        if (hoursDiff <= 12) {
          return "bg-sprout-success text-white border-sprout-success";
        }
      }

      // Due today - show orange
      return "bg-orange-500 text-white border-orange-500";
    }

    // Due in 1-2 days - show orange
    if (daysUntilWatering <= 2)
      return "bg-orange-500 text-white border-orange-500";

    // Not due for 3+ days - show sprout-success green
    return "bg-sprout-success text-white border-sprout-success";
  };

  const getStatusText = () => {
    if (hasUnknownWateringDate) return "Unknown schedule";
    if (isPostponed) return "Postponed until tomorrow";
    if (isOverdue) return `Overdue by ${Math.abs(daysUntilWatering)} days`;

    // Check if plant was watered within the last day (show "Watered today")
    if (daysUntilWatering === 0) {
      // Additional check: if last watered was very recent (same day), show "Watered today"
      // Otherwise, it means it's exactly on schedule and due today
      if (lastWateredDate) {
        const today = new Date();
        const lastWateredDateObj = new Date(lastWateredDate);
        const timeDiff = today.getTime() - lastWateredDateObj.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // If watered within the last 12 hours, show "Watered today"
        if (hoursDiff <= 12) {
          return "Watered today";
        }
      }

      return "Due today";
    }

    if (daysUntilWatering === 1) return "Water tomorrow";
    if (daysUntilWatering < 0)
      return `Overdue by ${Math.abs(daysUntilWatering)} days`;
    return `Water in ${daysUntilWatering} days`;
  };

  return (
    <div className="bg-card rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-border">
      <div className="relative">
        <PlantImage src={image} alt={name} className="w-full h-40" />
        <div
          className={`absolute top-3 right-3 transition-opacity duration-200 ${
            isOverwateringActive
              ? "opacity-0 pointer-events-none"
              : "opacity-100"
          }`}
          aria-hidden={isOverwateringActive}
        >
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}
          >
            {isPostponed && <Clock className="w-3 h-3 inline mr-1" />}
            {(isOverdue || hasUnknownWateringDate) && !isPostponed && (
              <AlertTriangle className="w-3 h-3 inline mr-1" />
            )}
            {getStatusText()}
          </span>
        </div>
        <div
          className={`absolute top-3 left-3 transition-opacity duration-200 ${
            isOverwateringActive
              ? "opacity-100"
              : "opacity-0 pointer-events-none"
          }`}
          aria-hidden={!isOverwateringActive}
        >
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              overwatering?.level === "high"
                ? "bg-red-600 text-white border-red-600"
                : "bg-orange-500 text-white border-orange-500"
            }`}
          >
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            {overwatering?.level === "high"
              ? "Possible overwatering"
              : "Watch watering"}
          </span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="absolute bottom-3 right-3 bg-card hover:bg-card/80 border border-border shadow-sm transition-all duration-200"
          onClick={onEdit}
        >
          <Edit className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-semibold text-foreground mb-1 font-poppins">
          {name}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">{plantType}</p>

        {hasUnknownWateringDate && (
          <div className="flex items-center gap-2 p-2 bg-sprout-cream/20 border border-sprout-cream/40 rounded-md mb-4">
            <AlertTriangle className="h-4 w-4 text-sprout-dark" />
            <p className="text-xs text-sprout-dark">
              Last watering date unknown - please water and record or edit the
              plant details
            </p>
          </div>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last watered:</span>
            <span className="text-foreground font-medium">{lastWatered}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Next watering:</span>
            <span className="text-foreground font-medium">
              {nextWateringDue}
            </span>
          </div>
          {overwatering && overwatering.level !== "none" && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Frequency</span>
              <span className="text-foreground">
                {overwatering.count} in {overwatering.windowDays}d
                {overwatering.avgIntervalDays
                  ? ` • avg ${overwatering.avgIntervalDays}d`
                  : ""}
              </span>
            </div>
          )}

          {/* View History Button */}
          {onViewHistory && (
            <div className="pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewHistory}
                className="w-full text-xs text-sprout-cream hover:text-sprout-white hover:bg-sprout-medium/20 dark:text-sprout-cream dark:hover:text-sprout-white dark:hover:bg-sprout-light/10 font-medium border border-sprout-cream/20 hover:border-sprout-cream/40"
              >
                <History className="w-3 h-3 mr-1" />
                View Watering History
              </Button>
            </div>
          )}
        </div>

        {/* Show postpone option only when plant is due/overdue AND has watering history */}
        {daysUntilWatering <= 0 &&
        !isPostponed &&
        !hasUnknownWateringDate &&
        lastWateredDate &&
        onPostpone ? (
          <div className="space-y-2">
            <Button
              onClick={handleWaterClick}
              className="w-full bg-sprout-water hover:bg-sprout-water/90 text-sprout-white rounded-xl font-medium"
            >
              <Droplets className="w-4 h-4 mr-2" />
              Water Now
            </Button>
            <Button
              onClick={onPostpone}
              variant="outline"
              className="w-full rounded-xl font-medium border-sprout-water/30 text-sprout-water hover:bg-sprout-water/10"
            >
              <Clock className="w-4 h-4 mr-2" />
              Push to Tomorrow
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleWaterClick}
            className="w-full bg-sprout-water hover:bg-sprout-water/90 text-sprout-white rounded-xl font-medium"
          >
            <Droplets className="w-4 h-4 mr-2" />
            Water Now
          </Button>
        )}
      </div>

      <WaterConfirmationDialog
        open={showWaterConfirmation}
        onOpenChange={setShowWaterConfirmation}
        onConfirm={handleConfirmWater}
        plantName={name}
        showOverwateringWarning={showOverwateringWarning}
        daysSinceLastWatered={daysSinceLastWatered}
      />
    </div>
  );
};

export default MyPlantCard;

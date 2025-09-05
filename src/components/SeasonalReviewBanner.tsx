import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Droplets,
  Sun,
  Snowflake,
  Flower,
  Leaf,
  X,
  Clock,
} from "lucide-react";
import {
  Season,
  SeasonalTransition,
} from "@/services/seasonalDetectionService";

interface SeasonalReviewBannerProps {
  transition: SeasonalTransition;
  plantsNeedingReview: number;
  onReviewClick: () => void;
  onDismiss: () => void;
  onSnooze: (weeks: number) => void;
}

const seasonIcons: Record<
  Season,
  React.ComponentType<{ className?: string }>
> = {
  spring: Flower,
  summer: Sun,
  fall: Leaf,
  winter: Snowflake,
};

const seasonColors: Record<Season, string> = {
  spring: "text-green-600 bg-green-50 border-green-200",
  summer: "text-yellow-600 bg-yellow-50 border-yellow-200",
  fall: "text-orange-600 bg-orange-50 border-orange-200",
  winter: "text-blue-600 bg-blue-50 border-blue-200",
};

const seasonEmoji: Record<Season, string> = {
  spring: "🌸",
  summer: "☀️",
  fall: "🍂",
  winter: "❄️",
};

export function SeasonalReviewBanner({
  transition,
  plantsNeedingReview,
  onReviewClick,
  onDismiss,
  onSnooze,
}: SeasonalReviewBannerProps) {
  const SeasonIcon = seasonIcons[transition.to_season];
  const seasonColorClass = seasonColors[transition.to_season];

  const getSeasonMessage = () => {
    const seasonName =
      transition.to_season.charAt(0).toUpperCase() +
      transition.to_season.slice(1);
    return `${seasonEmoji[transition.to_season]} ${seasonName} has arrived!`;
  };

  const getConfidenceColor = (confidence: SeasonalTransition["confidence"]) => {
    switch (confidence) {
      case "high":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Alert className={`mb-6 ${seasonColorClass} border-l-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <SeasonIcon className="h-6 w-6 mt-0.5 flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-lg">{getSeasonMessage()}</h3>
              <Badge
                variant="outline"
                className={`text-xs ${getConfidenceColor(
                  transition.confidence
                )}`}
              >
                {transition.confidence} confidence
              </Badge>
            </div>

            <AlertDescription className="text-sm mb-3">
              <div className="flex items-center space-x-1 mb-2">
                <Droplets className="h-4 w-4" />
                <span>
                  <strong>{plantsNeedingReview}</strong> plant
                  {plantsNeedingReview !== 1 ? "s" : ""}
                  {plantsNeedingReview === 1 ? " needs" : " need"} seasonal
                  watering schedule review
                </span>
              </div>

              {transition.triggering_factors.length > 0 && (
                <div className="text-xs opacity-75 mt-1">
                  <strong>Detected changes:</strong>{" "}
                  {transition.triggering_factors.join(", ")}
                </div>
              )}
            </AlertDescription>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={onReviewClick}
                size="sm"
                className="bg-white/80 hover:bg-white text-current border border-current/20"
              >
                <Calendar className="h-4 w-4 mr-1" />
                Review Schedules
              </Button>

              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSnooze(1)}
                  className="text-xs opacity-75 hover:opacity-100"
                >
                  <Clock className="h-3 w-3 mr-1" />1 week
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSnooze(2)}
                  className="text-xs opacity-75 hover:opacity-100"
                >
                  2 weeks
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="opacity-50 hover:opacity-100 flex-shrink-0 ml-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}

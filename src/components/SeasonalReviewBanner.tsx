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
  spring: "text-green-900 dark:text-green-100 bg-green-100 dark:bg-green-900/40 border-green-400 dark:border-green-600",
  summer: "text-yellow-900 dark:text-yellow-100 bg-yellow-100 dark:bg-yellow-900/40 border-yellow-400 dark:border-yellow-600",
  fall: "text-orange-900 dark:text-orange-100 bg-orange-100 dark:bg-orange-900/40 border-orange-400 dark:border-orange-600",
  winter: "text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-600",
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
        return "bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100 border-green-300 dark:border-green-700";
      case "medium":
        return "bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 border-yellow-300 dark:border-yellow-700";
      case "low":
        return "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600";
    }
  };

  return (
    <Alert data-testid="seasonal-review-banner-alert" className={`mb-6 ${seasonColorClass} border-l-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <SeasonIcon className="h-6 w-6 mt-0.5 flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 data-testid="seasonal-banner-title" className="font-semibold text-lg">{getSeasonMessage()}</h3>
              <Badge
                data-testid="seasonal-confidence-badge"
                variant="outline"
                className={`text-xs ${getConfidenceColor(
                  transition.confidence
                )}`}
              >
                {transition.confidence} confidence
              </Badge>
            </div>

            <AlertDescription data-testid="seasonal-banner-description" className="text-sm mb-3 font-medium">
              <div className="flex items-center space-x-1 mb-2">
                <Droplets className="h-4 w-4" />
                <span>
                  <strong className="font-bold">{plantsNeedingReview}</strong> plant
                  {plantsNeedingReview !== 1 ? "s" : ""}
                  {plantsNeedingReview === 1 ? " needs" : " need"} seasonal
                  watering schedule review
                </span>
              </div>

              {transition.triggering_factors.length > 0 && (
                <div className="text-xs mt-1 opacity-90">
                  <strong className="font-bold">Detected changes:</strong>{" "}
                  {transition.triggering_factors.join(", ")}
                </div>
              )}
            </AlertDescription>

            <div className="flex flex-wrap gap-2">
              <Button
                data-testid="review-schedules-button"
                onClick={onReviewClick}
                size="sm"
                className="bg-white dark:bg-white/20 hover:bg-white/90 dark:hover:bg-white/30 text-current border-2 border-current/40 dark:border-current/60 font-semibold shadow-sm backdrop-blur-sm"
              >
                <Calendar className="h-4 w-4 mr-1" />
                Review Schedules
              </Button>

              <div className="flex items-center space-x-1">
                <Button
                  data-testid="snooze-1-week-button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onSnooze(1)}
                  className="text-xs font-medium hover:bg-white/60 dark:hover:bg-white/20"
                >
                  <Clock className="h-3 w-3 mr-1" />1 week
                </Button>

                <Button
                  data-testid="snooze-2-weeks-button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onSnooze(2)}
                  className="text-xs font-medium hover:bg-white/60 dark:hover:bg-white/20"
                >
                  2 weeks
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Button
          data-testid="dismiss-seasonal-banner-button"
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

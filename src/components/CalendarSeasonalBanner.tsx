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
import { Season } from "@/services/calendarSeasonalService";
import { UpcomingSeasonChange } from "@/services/calendarSeasonalService";

interface CalendarSeasonalBannerProps {
  upcomingChange: UpcomingSeasonChange;
  plantCount: number;
  onReviewClick: () => void;
  onDismiss: () => void;
  onSnooze: (days: number) => void;
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

export function CalendarSeasonalBanner({
  upcomingChange,
  plantCount,
  onReviewClick,
  onDismiss,
  onSnooze,
}: CalendarSeasonalBannerProps) {
  const SeasonIcon = seasonIcons[upcomingChange.nextSeason];
  const seasonColorClass = seasonColors[upcomingChange.nextSeason];

  const getSeasonMessage = () => {
    const seasonName =
      upcomingChange.nextSeason.charAt(0).toUpperCase() +
      upcomingChange.nextSeason.slice(1);
    const emoji = seasonEmoji[upcomingChange.nextSeason];
    const { daysUntilChange } = upcomingChange;

    if (daysUntilChange === 0) {
      return `${emoji} ${seasonName} begins today!`;
    } else if (daysUntilChange === 1) {
      return `${emoji} ${seasonName} starts tomorrow`;
    } else {
      return `${emoji} ${seasonName} starts in ${daysUntilChange} days`;
    }
  };

  const getGuidanceMessage = () => {
    const guidance: Record<Season, string> = {
      spring:
        "As we transition to spring, most plants need more frequent watering due to active growth and warming temperatures.",
      summer:
        "Summer heat and longer daylight hours mean most plants need much more frequent watering.",
      fall: "As we transition to fall, most plants need less frequent watering as temperatures cool and growth slows.",
      winter:
        "Winter dormancy and reduced light mean most plants need much less frequent watering.",
    };

    return guidance[upcomingChange.nextSeason];
  };

  const getChangeDate = () => {
    return upcomingChange.changeDate.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Alert className={`mb-6 ${seasonColorClass} border-l-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <SeasonIcon className="h-6 w-6 mt-0.5 flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-lg">{getSeasonMessage()}</h3>
              <Badge variant="outline" className="text-xs">
                {getChangeDate()}
              </Badge>
            </div>

            <AlertDescription className="text-sm mb-3">
              <p className="mb-2">{getGuidanceMessage()}</p>

              <div className="flex items-center space-x-1">
                <Droplets className="h-4 w-4" />
                <span>
                  {plantCount > 0 ? (
                    <>
                      <strong>{plantCount}</strong> plant
                      {plantCount !== 1 ? "s" : ""} may benefit from schedule
                      adjustments
                    </>
                  ) : (
                    "Review your plant watering schedules for the new season"
                  )}
                </span>
              </div>
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
                  onClick={() => onSnooze(3)}
                  className="text-xs opacity-75 hover:opacity-100"
                >
                  <Clock className="h-3 w-3 mr-1" />3 days
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSnooze(7)}
                  className="text-xs opacity-75 hover:opacity-100"
                >
                  1 week
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

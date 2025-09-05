import { CloudRain, Calendar, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RainDelayResult } from "@/utils/rainDelayLogic";
import { WeatherData } from "@/services/weatherTypes";
import { cn } from "@/lib/utils";

interface RainDelayNotificationProps {
  delayResult: RainDelayResult;
  weatherData: WeatherData;
  plantName?: string;
  onWaterAnyway?: () => void;
  onPostpone?: (days: number) => void;
  className?: string;
  variant?: "card" | "alert" | "compact";
}

export function RainDelayNotification({
  delayResult,
  weatherData,
  plantName,
  onWaterAnyway,
  onPostpone,
  className,
  variant = "card",
}: RainDelayNotificationProps) {
  if (!delayResult.shouldDelay) {
    return null;
  }

  const plantRef = plantName || "this plant";
  const delayDays = delayResult.recommendedDelayDays || 1;
  const rainProbability = weatherData.upcoming_rain_probability;

  const content = (
    <>
      <div className="flex items-start gap-3">
        <CloudRain className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-sprout-white">Rain Expected</h4>
            <Badge variant="secondary" className="text-xs">
              {rainProbability}% chance
            </Badge>
          </div>

          <p className="text-sm text-sprout-light">
            {delayResult.delayReason ||
              `Watering ${plantRef} can be delayed due to expected rain.`}
          </p>

          {delayResult.nextCheckDate && (
            <div className="flex items-center gap-2 text-xs text-sprout-light">
              <Calendar className="w-3 h-3" />
              <span>
                Check again on {delayResult.nextCheckDate.toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {(onWaterAnyway || onPostpone) && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-sprout-medium">
          {onWaterAnyway && (
            <Button
              variant="outline"
              size="sm"
              onClick={onWaterAnyway}
              className="text-xs border-sprout-light text-sprout-light hover:bg-sprout-light hover:text-sprout-dark"
            >
              Water Anyway
            </Button>
          )}
          {onPostpone && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPostpone(delayDays)}
              className="text-xs text-sprout-water hover:bg-sprout-water/20"
            >
              Postpone {delayDays} day{delayDays !== 1 ? "s" : ""}
            </Button>
          )}
        </div>
      )}
    </>
  );

  if (variant === "alert") {
    return (
      <Alert className={cn("border-blue-400 bg-blue-400/10", className)}>
        <CloudRain className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-sprout-white">
          {content}
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 p-2 bg-blue-400/10 border border-blue-400/20 rounded text-sm",
          className
        )}
      >
        <CloudRain className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <span className="text-sprout-light">
          Rain expected ({rainProbability}%) - watering can be delayed
        </span>
        {onPostpone && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPostpone(delayDays)}
            className="text-xs h-6 px-2 text-sprout-water hover:bg-sprout-water/20"
          >
            Postpone
          </Button>
        )}
      </div>
    );
  }

  // Default: card variant
  return (
    <Card className={cn("border-blue-400 bg-blue-400/5", className)}>
      <CardContent className="p-4">{content}</CardContent>
    </Card>
  );
}

interface RainDelayBadgeProps {
  rainProbability: number;
  className?: string;
}

export function RainDelayBadge({
  rainProbability,
  className,
}: RainDelayBadgeProps) {
  if (rainProbability < 30) {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs border-blue-400 text-blue-400",
        rainProbability >= 60 && "bg-blue-400/10",
        className
      )}
    >
      <CloudRain className="w-3 h-3 mr-1" />
      {rainProbability}% rain
    </Badge>
  );
}

interface RainDelayInfoProps {
  weatherData: WeatherData;
  className?: string;
}

export function RainDelayInfo({ weatherData, className }: RainDelayInfoProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs text-sprout-light",
        className
      )}
    >
      <Info className="w-3 h-3" />
      <span>
        Outdoor plants: Watering may be delayed if rain probability exceeds 60%
      </span>
      <RainDelayBadge rainProbability={weatherData.upcoming_rain_probability} />
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import type { WeatherData } from "@/services/weatherTypes";
import { formatTemperature } from "@/utils/temperature";

interface WeatherStatusDisplayProps {
  weatherData: WeatherData;
  isFallback: boolean;
  temperatureUnit?: "F" | "C";
}

export function WeatherStatusDisplay({
  weatherData,
  isFallback,
  temperatureUnit = "F",
}: WeatherStatusDisplayProps) {
  return (
    <Card
      className="bg-green-50 border-green-200"
      data-testid="weather-status-active"
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-green-900 mb-1">
              Weather data is active!
            </div>
            <div
              className="text-sm text-green-700"
              data-testid="weather-status-text"
            >
              Current:{" "}
              {formatTemperature(
                weatherData.current_temp_celsius,
                temperatureUnit
              )}
              , {weatherData.current_humidity_percent}% humidity
            </div>
            {isFallback && (
              <Badge variant="secondary" className="mt-2 text-xs">
                Using fallback data
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

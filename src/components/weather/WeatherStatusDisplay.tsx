import { CheckCircle } from "lucide-react";
import type { WeatherData } from "@/services/weatherTypes";
import { formatTemperature } from "@/utils/weather/temperature";

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
    <div
      className="flex items-start gap-3 rounded-[18px] bg-sprout-success text-sprout-dark px-4 py-3.5"
      data-testid="weather-status-active"
    >
      <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="text-[15px] font-bold">Weather data is active</div>
        <div className="text-[13px] font-medium mt-0.5" data-testid="weather-status-text">
          Current:{" "}
          {formatTemperature(weatherData.current_temp_celsius, temperatureUnit)},{" "}
          {weatherData.current_humidity_percent}% humidity
        </div>
        {isFallback && (
          <span className="inline-block mt-2 text-xs font-bold px-2.5 py-1 rounded-full bg-sprout-dark/15">
            Using fallback data
          </span>
        )}
      </div>
    </div>
  );
}

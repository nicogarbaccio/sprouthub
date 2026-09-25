import { CloudRain, Sun, Thermometer, Droplets, AlertCircle, RefreshCw, Snowflake } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WeatherData } from "@/services/weatherTypes";
import { getWeatherSummary } from "@/utils/weather/mapping";
import { cn } from "@/lib/utils";
import {
  formatTemperature,
  celsiusToFahrenheit,
  getTemperatureIconThresholds,
} from "@/utils/weather/temperature";

interface WeatherIndicatorProps {
  weatherData: WeatherData | null;
  isLoading?: boolean;
  isFallback?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  temperatureUnit?: "F" | "C";
  className?: string;
}

const pill = "inline-flex items-center gap-1.5 rounded-full bg-field px-3 py-1.5 text-[13px] font-bold text-foreground";

/** One-line weather readout as pills: temperature, humidity and rain chance */
export function WeatherIndicator({
  weatherData,
  isLoading = false,
  isFallback = false,
  error = null,
  onRefresh,
  temperatureUnit = "F",
  className,
}: WeatherIndicatorProps) {
  if (isLoading) {
    return (
      <p className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <RefreshCw className="w-4 h-4 animate-spin" />
        Loading weather...
      </p>
    );
  }

  if (error && !weatherData) {
    return (
      <div className={cn("flex items-center justify-between gap-2", className)}>
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <AlertCircle className="w-4 h-4 text-sprout-warning" />
          Weather unavailable
        </p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="w-9 h-9 rounded-xl bg-field text-foreground flex items-center justify-center"
            aria-label="Retry weather"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  if (!weatherData) {
    return null;
  }

  const tempF = celsiusToFahrenheit(weatherData.current_temp_celsius);
  const thresholds = getTemperatureIconThresholds();
  const TempIcon = tempF > thresholds.hot ? Sun : Thermometer;
  const RainIcon = weatherData.is_snowing ? Snowflake : CloudRain;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
            <span className={pill}>
              <TempIcon className="w-3.5 h-3.5" />
              {formatTemperature(weatherData.current_temp_celsius, temperatureUnit)}
            </span>
            <span className={pill}>
              <Droplets className="w-3.5 h-3.5" />
              {weatherData.current_humidity_percent}%
            </span>
            <span className={pill}>
              <RainIcon className="w-3.5 h-3.5" />
              {weatherData.upcoming_rain_probability}% {weatherData.is_snowing ? "snow" : "rain"}
            </span>
            {isFallback && <span className={cn(pill, "bg-sprout-cream text-sprout-dark")}>Estimated</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Current Weather</p>
            <p className="text-sm">{getWeatherSummary(weatherData)}</p>
            {isFallback && <p className="text-xs text-muted-foreground">Using estimated values</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

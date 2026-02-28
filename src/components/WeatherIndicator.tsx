import {
  Cloud,
  CloudRain,
  Sun,
  Thermometer,
  Droplets,
  AlertCircle,
  RefreshCw,
  Snowflake,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  compact?: boolean;
  temperatureUnit?: 'F' | 'C';
  className?: string;
}

export function WeatherIndicator({
  weatherData,
  isLoading = false,
  isFallback = false,
  error = null,
  onRefresh,
  compact = false,
  temperatureUnit = 'F',
  className,
}: WeatherIndicatorProps) {
  if (isLoading) {
    return (
      <Card
        className={cn("border-sprout-medium bg-sprout-primary/30", className)}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-sprout-light" />
            <span className="text-sm text-sprout-light">
              Loading weather...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !weatherData) {
    return (
      <Card
        className={cn("border-sprout-warning bg-sprout-warning/10", className)}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-sprout-warning" />
              <span className="text-sm text-sprout-warning">
                Weather unavailable
              </span>
            </div>
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-6 px-2 text-sprout-warning hover:bg-sprout-warning/20"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weatherData) {
    return null;
  }

  const getTemperatureIcon = (tempCelsius: number) => {
    const tempFahrenheit = celsiusToFahrenheit(tempCelsius);
    const thresholds = getTemperatureIconThresholds();

    if (tempFahrenheit < thresholds.cold)
      return <Thermometer className="w-4 h-4 text-blue-400" />;
    if (tempFahrenheit > thresholds.hot)
      return <Sun className="w-4 h-4 text-orange-400" />;
    return <Thermometer className="w-4 h-4 text-sprout-light" />;
  };

  const getPrecipitationIcon = (probability: number, isSnow: boolean = false) => {
    if (probability > 60)
      return isSnow ? (
        <Snowflake className="w-4 h-4 text-white" />
      ) : (
        <CloudRain className="w-4 h-4 text-blue-400" />
      );
    if (probability > 30) return <Cloud className="w-4 h-4 text-gray-400" />;
    return <Sun className="w-4 h-4 text-yellow-400" />;
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-1", className)}>
              {getTemperatureIcon(weatherData.current_temp_celsius)}
              <span className="text-sm text-sprout-light">
                {formatTemperature(weatherData.current_temp_celsius, temperatureUnit)}
              </span>
              <Droplets className="w-3 h-3 text-sprout-water ml-1" />
              <span className="text-sm text-sprout-light">
                {weatherData.current_humidity_percent}%
              </span>
              {isFallback && (
                <Badge variant="outline" className="text-xs ml-1">
                  Est.
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">Current Weather</p>
              <p className="text-sm">{getWeatherSummary(weatherData)}</p>
              {isFallback && (
                <p className="text-xs text-muted-foreground">
                  Using estimated values
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card
      className={cn(
        "border-sprout-medium bg-sprout-primary/30",
        isFallback && "border-sprout-warning/50 bg-sprout-warning/5",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-sprout-light" />
            <span className="font-medium text-sprout-white">
              Current Weather
            </span>
            {isFallback && (
              <Badge variant="outline" className="text-xs">
                Estimated
              </Badge>
            )}
          </div>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-8 px-2 text-sprout-light hover:bg-sprout-light/20"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Temperature */}
          <div className="flex items-center gap-2">
            {getTemperatureIcon(weatherData.current_temp_celsius)}
            <div>
              <p className="text-sm text-sprout-light">Temperature</p>
              <p className="font-medium text-sprout-white">
                {formatTemperature(weatherData.current_temp_celsius, temperatureUnit)}
              </p>
            </div>
          </div>

          {/* Humidity */}
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-sprout-water" />
            <div>
              <p className="text-sm text-sprout-light">Humidity</p>
              <p className="font-medium text-sprout-white">
                {weatherData.current_humidity_percent}%
              </p>
            </div>
          </div>

          {/* Rain/Snow Probability */}
          <div className="flex items-center gap-2">
            {getPrecipitationIcon(weatherData.upcoming_rain_probability, weatherData.is_snowing)}
            <div>
              <p className="text-sm text-sprout-light">
                {weatherData.is_snowing ? "Snow Chance" : "Rain Chance"}
              </p>
              <p className="font-medium text-sprout-white">
                {weatherData.upcoming_rain_probability}%
              </p>
            </div>
          </div>

          {/* Season */}
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-yellow-400" />
            <div>
              <p className="text-sm text-sprout-light">Season</p>
              <p className="font-medium text-sprout-white capitalize">
                {weatherData.season}
              </p>
            </div>
          </div>
        </div>

        {/* Weather Summary */}
        <div className="mt-3 pt-3 border-t border-sprout-medium">
          <p className="text-sm text-sprout-light">
            {getWeatherSummary(weatherData)}
          </p>
          {isFallback && (
            <p className="text-xs text-sprout-warning mt-1">
              Using estimated weather data - actual conditions may vary
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

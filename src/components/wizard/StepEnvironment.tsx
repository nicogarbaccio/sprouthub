import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Lightbulb,
  Thermometer,
  Droplets,
  Cloud,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { OptionCard } from "./OptionCard";
import { formatTemperature } from "@/utils/weather/temperature";
import { WeatherIndicator } from "@/components/WeatherIndicator";
import type { WizardStepProps } from "./types";
import type { WeatherData } from "@/services/weatherTypes";

interface StepEnvironmentProps extends WizardStepProps {
  enableWeatherData: boolean;
  onToggleWeatherData: (enabled: boolean) => void;
  weatherData: WeatherData | null;
  weatherIsLoading: boolean;
  weatherIsFallback: boolean;
  weatherError: string | undefined;
  onRefreshWeather: () => void;
  locationExists: boolean;
  locationIsLoading: boolean;
  weatherMappingReasons: string[];
  temperatureUnit: "F" | "C";
}

export const StepEnvironment = ({
  factors,
  updateFactor,
  labels,
  enableWeatherData,
  onToggleWeatherData,
  weatherData,
  weatherIsLoading,
  weatherIsFallback,
  weatherError,
  onRefreshWeather,
  locationExists,
  locationIsLoading,
  weatherMappingReasons,
  temperatureUnit,
}: StepEnvironmentProps) => (
  <div className="space-y-6">
    <div className="text-center mb-6">
      <Thermometer className="w-12 h-12 text-sprout-light mx-auto mb-2" />
      <h3 className="text-lg font-semibold text-sprout-white">
        Environmental Conditions
      </h3>
      <p className="text-sprout-light">
        These factors affect how quickly your plant uses water
      </p>
    </div>

    {/* Weather Data Toggle */}
    <Card className="border-sprout-medium bg-sprout-primary/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-sprout-light" />
            <span className="font-medium text-sprout-white">
              Use Current Weather
            </span>
          </div>
          <Switch
            checked={enableWeatherData}
            onCheckedChange={onToggleWeatherData}
            data-testid="weather-data-toggle"
          />
        </div>

        {enableWeatherData && (
          <div className="space-y-3">
            {locationExists && weatherData ? (
              <WeatherIndicator
                weatherData={weatherData}
                isLoading={weatherIsLoading}
                isFallback={weatherIsFallback}
                error={weatherError}
                temperatureUnit={temperatureUnit}
                onRefresh={onRefreshWeather}
                compact
              />
            ) : locationIsLoading || weatherIsLoading ? (
              <div className="flex items-center gap-2 text-sm text-sprout-light">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading weather data...
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-sprout-warning">
                <MapPin className="w-4 h-4" />
                Location needed for weather data
              </div>
            )}

            {weatherMappingReasons.length > 0 && (
              <div className="text-xs text-sprout-light bg-sprout-medium/20 p-2 rounded">
                <p className="font-medium mb-1">Weather-based adjustments:</p>
                <ul className="list-disc list-inside space-y-1">
                  {weatherMappingReasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!enableWeatherData && (
          <p className="text-sm text-sprout-light">
            Manual environmental settings will be used instead
          </p>
        )}
      </CardContent>
    </Card>

    {/* Light Level */}
    <div className="space-y-3">
      <Label className="text-base font-medium flex items-center gap-2 text-sprout-white">
        <Lightbulb className="w-4 h-4" />
        Light Conditions
      </Label>
      <div className="space-y-2">
        {(
          Object.keys(labels.lightLevel) as Array<
            keyof typeof labels.lightLevel
          >
        ).map((level) => (
          <div key={level}>
            <OptionCard
              value={level}
              currentValue={factors.lightLevel}
              onClick={(value) => updateFactor("lightLevel", value)}
              label={level.charAt(0).toUpperCase() + level.slice(1)}
              description={labels.lightLevel[level]}
              testId={`light-level-${level}`}
            />
          </div>
        ))}
      </div>
    </div>

    {/* Temperature */}
    <div className="space-y-3">
      <Label className="text-base font-medium flex items-center gap-2 text-sprout-white">
        <Thermometer className="w-4 h-4" />
        Room Temperature
        {enableWeatherData && weatherData && (
          <Badge variant="secondary" className="text-xs ml-2">
            Auto-detected
          </Badge>
        )}
      </Label>
      <div className="space-y-2">
        {(
          Object.keys(labels.temperature) as Array<
            keyof typeof labels.temperature
          >
        ).map((temp) => (
          <div key={temp}>
            <OptionCard
              value={temp}
              currentValue={factors.temperature}
              onClick={(value) => updateFactor("temperature", value)}
              label={temp.charAt(0).toUpperCase() + temp.slice(1)}
              description={labels.temperature[temp]}
              testId={`temperature-${temp}`}
            />
          </div>
        ))}
      </div>
      {enableWeatherData && weatherData && (
        <p className="text-xs text-sprout-light">
          Current temperature:{" "}
          {formatTemperature(weatherData.current_temp_celsius)}
        </p>
      )}
    </div>

    {/* Humidity */}
    <div className="space-y-3">
      <Label className="text-base font-medium flex items-center gap-2 text-sprout-white">
        <Droplets className="w-4 h-4" />
        Air Humidity
        {enableWeatherData && weatherData && (
          <Badge variant="secondary" className="text-xs ml-2">
            Auto-detected
          </Badge>
        )}
      </Label>
      <div className="space-y-2">
        {(
          Object.keys(labels.humidity) as Array<keyof typeof labels.humidity>
        ).map((humidity) => (
          <div key={humidity}>
            <OptionCard
              value={humidity}
              currentValue={factors.humidity}
              onClick={(value) => updateFactor("humidity", value)}
              label={humidity.charAt(0).toUpperCase() + humidity.slice(1)}
              description={labels.humidity[humidity]}
              testId={`humidity-${humidity}`}
            />
          </div>
        ))}
      </div>
      {enableWeatherData && weatherData && (
        <p className="text-xs text-sprout-light">
          Current humidity: {weatherData.current_humidity_percent}%
        </p>
      )}
    </div>
  </div>
);

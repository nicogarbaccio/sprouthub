import { Switch } from "@/components/ui/switch";
import { MapPin, RefreshCw } from "lucide-react";
import { OptionCard, OptionGroup, WizardStepHeading } from "./OptionCard";
import { SettingRow } from "@/components/settings/SettingsUI";
import { capitalize } from "@/lib/utils";
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
}: StepEnvironmentProps) => {
  const autoDetected = enableWeatherData && weatherData ? "Auto-detected" : undefined;

  return (
    <div className="space-y-5">
      <WizardStepHeading
        title="Where it lives"
        body="Light, temperature and humidity change how quickly your plant uses water"
      />

      <div className="rounded-3xl bg-card p-2 space-y-2">
        <SettingRow
          htmlFor="wizard-weather-toggle"
          label="Use current weather"
          description={enableWeatherData ? undefined : "Otherwise the settings below are used"}
          className="bg-transparent"
          control={
            <Switch
              id="wizard-weather-toggle"
              checked={enableWeatherData}
              onCheckedChange={onToggleWeatherData}
              data-testid="weather-data-toggle"
            />
          }
        />

        {enableWeatherData && (
          <div className="px-2 pb-2 space-y-2">
            {locationExists && weatherData ? (
              <WeatherIndicator
                weatherData={weatherData}
                isLoading={weatherIsLoading}
                isFallback={weatherIsFallback}
                error={weatherError}
                temperatureUnit={temperatureUnit}
                onRefresh={onRefreshWeather}
                className="px-2"
              />
            ) : locationIsLoading || weatherIsLoading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground px-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading weather data...
              </p>
            ) : (
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground px-2">
                <MapPin className="w-4 h-4" />
                Location needed for weather data
              </p>
            )}

            {weatherMappingReasons.length > 0 && (
              <div className="rounded-[16px] bg-field px-3.5 py-3 text-[13px] text-muted-foreground">
                <p className="font-bold text-foreground mb-1">Weather-based adjustments</p>
                <ul className="list-disc list-inside space-y-1">
                  {weatherMappingReasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <OptionGroup label="Light">
        {(Object.keys(labels.lightLevel) as Array<keyof typeof labels.lightLevel>).map((level) => (
          <OptionCard
            key={level}
            value={level}
            currentValue={factors.lightLevel}
            onClick={(value) => updateFactor("lightLevel", value)}
            label={capitalize(level)}
            description={labels.lightLevel[level]}
            testId={`light-level-${level}`}
          />
        ))}
      </OptionGroup>

      <OptionGroup
        label="Room temperature"
        badge={autoDetected}
        footnote={
          autoDetected &&
          `Current temperature: ${formatTemperature(weatherData!.current_temp_celsius, temperatureUnit)}`
        }
      >
        {(Object.keys(labels.temperature) as Array<keyof typeof labels.temperature>).map((temp) => (
          <OptionCard
            key={temp}
            value={temp}
            currentValue={factors.temperature}
            onClick={(value) => updateFactor("temperature", value)}
            label={capitalize(temp)}
            description={labels.temperature[temp]}
            testId={`temperature-${temp}`}
          />
        ))}
      </OptionGroup>

      <OptionGroup
        label="Air humidity"
        badge={autoDetected}
        footnote={autoDetected && `Current humidity: ${weatherData!.current_humidity_percent}%`}
      >
        {(Object.keys(labels.humidity) as Array<keyof typeof labels.humidity>).map((humidity) => (
          <OptionCard
            key={humidity}
            value={humidity}
            currentValue={factors.humidity}
            onClick={(value) => updateFactor("humidity", value)}
            label={capitalize(humidity)}
            description={labels.humidity[humidity]}
            testId={`humidity-${humidity}`}
          />
        ))}
      </OptionGroup>
    </div>
  );
};

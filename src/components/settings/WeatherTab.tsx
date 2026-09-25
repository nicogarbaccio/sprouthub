import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CloudSun, Loader2, Info } from "lucide-react";
import { useSmartWateringPreferences } from "@/hooks/useSmartWateringPreferences";
import { useLocation } from "@/hooks/useLocation";
import { useWeatherData } from "@/hooks/useWeatherData";
import { toast } from "sonner";
import { weatherService } from "@/services/weatherService";
import type { LocationData } from "@/services/weatherTypes";
import { LocationSection } from "@/components/weather/LocationSection";
import { WeatherStatusDisplay } from "@/components/weather/WeatherStatusDisplay";
import { cn } from "@/lib/utils";
import { SettingsCard, SettingRow, settingsPrimaryButtonClasses } from "./SettingsUI";

export const WeatherTab = () => {
  const { preferences, savePreferences, isLoading: isSavingPreferences } =
    useSmartWateringPreferences();

  const [useWeather, setUseWeather] = useState(false);
  const [temperatureUnit, setTemperatureUnit] = useState<"F" | "C">("F");
  const [manualLocation, setManualLocation] = useState("");
  const [manualLocationData, setManualLocationData] =
    useState<LocationData | null>(null);
  const [isGeocodingLocation, setIsGeocodingLocation] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const userEditedRef = useRef(false);

  const location = useLocation({
    autoRequest: false,
  });

  // Use manual location if available, otherwise use browser location
  const effectiveLocation = manualLocationData || location.location;

  const weather = useWeatherData({
    location: effectiveLocation,
    autoFetch: useWeather && !!effectiveLocation,
  });

  // Initialize from preferences — skip if user has unsaved changes
  useEffect(() => {
    if (preferences && !userEditedRef.current) {
      setUseWeather(preferences.use_weather_data ?? false);
      setTemperatureUnit(preferences.temperature_unit ?? "F");
      setManualLocation(preferences.manual_location || "");
    }
  }, [preferences]);

  // Check if there are unsaved changes
  useEffect(() => {
    if (preferences) {
      const changed =
        useWeather !== preferences.use_weather_data ||
        temperatureUnit !== preferences.temperature_unit ||
        manualLocation !== (preferences.manual_location || "");
      setHasChanges(changed);
      if (changed) userEditedRef.current = true;
    }
  }, [useWeather, temperatureUnit, manualLocation, preferences]);

  const handleToggleWeather = async (enabled: boolean) => {
    setUseWeather(enabled);

    // If enabling and no location yet, request it
    if (enabled && !effectiveLocation) {
      location.requestLocation();
    }
  };

  const handleGeocodeLocation = async () => {
    if (!manualLocation.trim()) {
      setGeocodingError("Please enter a location");
      return;
    }

    setIsGeocodingLocation(true);
    setGeocodingError(null);

    try {
      const locationData = await weatherService.getLocationFromInput(
        manualLocation
      );
      setManualLocationData(locationData);
      toast.success("Location found", {
        description: `${locationData.city}${locationData.country ? `, ${locationData.country}` : ""}`,
      });
    } catch (error: unknown) {
      setGeocodingError(
        error instanceof Error ? error.message :
          "Failed to find location. Please try a different search."
      );
      setManualLocationData(null);
    } finally {
      setIsGeocodingLocation(false);
    }
  };

  const handleClearManualLocation = () => {
    setManualLocation("");
    setManualLocationData(null);
    setGeocodingError(null);
  };

  const handleSave = async () => {
    // Check if weather is being toggled or just settings updated
    const weatherToggled = preferences?.use_weather_data !== useWeather;

    const success = await savePreferences({
      ...preferences,
      use_weather_data: useWeather,
      temperature_unit: temperatureUnit,
      manual_location: manualLocation || null,
      last_weather_update:
        useWeather && weather.weatherData
          ? new Date().toISOString()
          : null,
    });

    if (success) {
      if (weatherToggled) {
        if (useWeather) {
          toast.success("Weather enabled", {
            description: "Your dashboard will now show weather-based insights",
          });
        } else {
          toast.success("Weather disabled", {
            description: "Weather features have been turned off",
          });
        }
      } else {
        toast.success("Weather settings updated", {
          description: "Your preferences have been saved",
        });
      }
      setHasChanges(false);
      userEditedRef.current = false;
    }
  };

  const isWeatherDataAvailable =
    useWeather && weather.weatherData && !weather.isLoading;

  return (
    <div className="space-y-3">
      <SettingsCard
        title="Weather Integration"
        description="Care tips based on your local conditions"
        icon={CloudSun}
        iconClasses="bg-sprout-water text-sprout-dark"
      >
        <SettingRow
          htmlFor="weather-toggle"
          label="Use Weather Data"
          description="Real-time, weather-based care recommendations"
          control={
            <Switch
              id="weather-toggle"
              checked={useWeather}
              onCheckedChange={handleToggleWeather}
              data-testid="weather-toggle"
            />
          }
        />

        {/* Temperature Unit */}
        {useWeather && (
          <div className="pt-2">
            <div className="text-[15px] font-bold text-foreground px-1 mb-2">Temperature Unit</div>
            <RadioGroup
              value={temperatureUnit}
              onValueChange={(value) => setTemperatureUnit(value as "F" | "C")}
              className="grid grid-cols-2 gap-2"
            >
              {([
                { value: "F", id: "fahrenheit", label: "Fahrenheit (°F)", testId: "temp-unit-f" },
                { value: "C", id: "celsius", label: "Celsius (°C)", testId: "temp-unit-c" },
              ] as const).map((unit) => (
                <Label
                  key={unit.value}
                  htmlFor={unit.id}
                  className={cn(
                    "flex items-center gap-2.5 min-h-[52px] rounded-[18px] px-4 cursor-pointer font-bold text-[15px] transition-colors",
                    temperatureUnit === unit.value
                      ? "bg-sprout-cream text-sprout-dark"
                      : "bg-field text-foreground"
                  )}
                >
                  <RadioGroupItem
                    value={unit.value}
                    id={unit.id}
                    data-testid={unit.testId}
                    className="border-current text-current"
                  />
                  {unit.label}
                </Label>
              ))}
            </RadioGroup>
          </div>
        )}

        {/* Location Section */}
        {useWeather && (
          <div className="pt-2">
            <LocationSection
              browserLocation={location.location}
              isBrowserLoading={location.isLoading}
              browserError={location.error}
              onRequestBrowserLocation={() => location.requestLocation()}
              manualLocation={manualLocation}
              manualLocationData={manualLocationData}
              isGeocoding={isGeocodingLocation}
              geocodingError={geocodingError}
              onManualLocationChange={setManualLocation}
              onGeocode={handleGeocodeLocation}
              onClearManualLocation={handleClearManualLocation}
              onGeocodingErrorClear={() => setGeocodingError(null)}
            />
          </div>
        )}

        {/* Weather Status */}
        {isWeatherDataAvailable && (
          <WeatherStatusDisplay
            weatherData={weather.weatherData}
            isFallback={weather.isFallback}
            temperatureUnit={temperatureUnit}
          />
        )}

        {/* Features Info */}
        {useWeather && (
          <div className="rounded-[18px] bg-field px-4 py-3.5">
            <div className="flex items-center gap-2 text-[15px] font-bold text-foreground">
              <Info className="h-4 w-4 text-muted-foreground" />
              What weather adds
            </div>
            <ul className="text-[13px] text-muted-foreground space-y-1 mt-2 ml-6 list-disc">
              <li>A daily weather tile with care tips on Home</li>
              <li>Rain delay suggestions for outdoor plants</li>
              <li>Extreme weather alerts</li>
              <li>Seasonal schedule suggestions</li>
            </ul>
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSavingPreferences || !hasChanges}
            className={settingsPrimaryButtonClasses}
          >
            {isSavingPreferences && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Settings
          </button>
        </div>
      </SettingsCard>
    </div>
  );
};

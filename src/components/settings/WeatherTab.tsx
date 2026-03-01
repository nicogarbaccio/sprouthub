import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CloudSun, Loader2, Info } from "lucide-react";
import { useSmartWateringPreferences } from "@/hooks/useSmartWateringPreferences";
import { useLocation } from "@/hooks/useLocation";
import { useWeatherData } from "@/hooks/useWeatherData";
import { toast } from "sonner";
import { weatherService } from "@/services/weatherService";
import type { LocationData } from "@/services/weatherTypes";
import { LocationSection } from "@/components/weather/LocationSection";
import { WeatherStatusDisplay } from "@/components/weather/WeatherStatusDisplay";
import { CascadingContainer } from "@/components/ui/cascading-container";

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

  const location = useLocation({
    autoRequest: false,
  });

  // Use manual location if available, otherwise use browser location
  const effectiveLocation = manualLocationData || location.location;

  const weather = useWeatherData({
    location: effectiveLocation,
    autoFetch: useWeather && !!effectiveLocation,
  });

  // Initialize from preferences
  useEffect(() => {
    if (preferences) {
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
    }
  };

  const isWeatherDataAvailable =
    useWeather && weather.weatherData && !weather.isLoading;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CloudSun className="h-5 w-5 text-blue-500" />
            <CardTitle>Weather Integration</CardTitle>
          </div>
          <CardDescription>
            Enable weather features to get personalized plant care insights based
            on your local conditions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Weather Toggle */}
          <CascadingContainer delay={0}>
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label
                      htmlFor="weather-toggle"
                      className="text-base font-medium"
                    >
                      Use Weather Data
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get real-time weather-based care recommendations
                    </p>
                  </div>
                  <Switch
                    id="weather-toggle"
                    checked={useWeather}
                    onCheckedChange={handleToggleWeather}
                    className="data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                    data-testid="weather-toggle"
                  />
                </div>
              </CardContent>
            </Card>
          </CascadingContainer>

          {/* Temperature Unit */}
          {useWeather && (
            <CascadingContainer delay={50}>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Label className="text-base font-medium">
                      Temperature Unit
                    </Label>
                    <RadioGroup
                      value={temperatureUnit}
                      onValueChange={(value) =>
                        setTemperatureUnit(value as "F" | "C")
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="F"
                          id="fahrenheit"
                          data-testid="temp-unit-f"
                        />
                        <Label
                          htmlFor="fahrenheit"
                          className="font-normal cursor-pointer"
                        >
                          Fahrenheit (°F)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="C"
                          id="celsius"
                          data-testid="temp-unit-c"
                        />
                        <Label
                          htmlFor="celsius"
                          className="font-normal cursor-pointer"
                        >
                          Celsius (°C)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            </CascadingContainer>
          )}

          {/* Location Section */}
          {useWeather && (
            <CascadingContainer delay={100}>
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
            </CascadingContainer>
          )}

          {/* Weather Status */}
          {isWeatherDataAvailable && (
            <CascadingContainer delay={150}>
              <WeatherStatusDisplay
                weatherData={weather.weatherData}
                isFallback={weather.isFallback}
                temperatureUnit={temperatureUnit}
              />
            </CascadingContainer>
          )}

          {/* Features Info */}
          {useWeather && (
            <CascadingContainer delay={200}>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Weather features include:</div>
                  <ul className="text-sm space-y-1 ml-4 list-disc">
                    <li>Weather mood banner with daily care tips</li>
                    <li>Rain delay notifications for outdoor plants</li>
                    <li>Extreme weather alerts</li>
                    <li>Seasonal schedule suggestions</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CascadingContainer>
          )}

          {/* Save Button */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={isSavingPreferences || !hasChanges}
              className="flex-1"
            >
              {isSavingPreferences && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

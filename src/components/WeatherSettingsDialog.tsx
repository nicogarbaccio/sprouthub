import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
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

interface WeatherSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WeatherSettingsDialog({
  isOpen,
  onClose,
}: WeatherSettingsDialogProps) {
  const { preferences, savePreferences, isLoading: isSavingPreferences } =
    useSmartWateringPreferences();

  const [useWeather, setUseWeather] = useState(false);
  const [temperatureUnit, setTemperatureUnit] = useState<'F' | 'C'>('F');
  const [manualLocation, setManualLocation] = useState("");
  const [manualLocationData, setManualLocationData] = useState<LocationData | null>(null);
  const [isGeocodingLocation, setIsGeocodingLocation] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

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
      setTemperatureUnit(preferences.temperature_unit ?? 'F');
      setManualLocation(preferences.manual_location || "");
    }
  }, [preferences]);

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
      const locationData = await weatherService.getLocationFromInput(manualLocation);
      setManualLocationData(locationData);
      toast.success("Location found", {
        description: `${locationData.city}${locationData.country ? `, ${locationData.country}` : ''}`,
      });
    } catch (error: any) {
      setGeocodingError(error.message || "Failed to find location. Please try a different search.");
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
      last_weather_update: useWeather && weather.weatherData
        ? new Date().toISOString()
        : null,
    });

    if (success) {
      // Show toast before closing dialog to ensure it displays
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

      // Close dialog after toast is triggered
      onClose();
    }
  };

  const isWeatherDataAvailable = useWeather && weather.weatherData && !weather.isLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col" data-testid="weather-settings-dialog">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CloudSun className="h-5 w-5 text-blue-500" />
            Weather Settings
          </DialogTitle>
          <DialogDescription>
            Enable weather features to get personalized plant care insights
            based on your local conditions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto flex-1">
          {/* Weather Toggle */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="weather-toggle" className="text-base font-medium">
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

          {/* Temperature Unit */}
          {useWeather && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Temperature Unit
                  </Label>
                  <RadioGroup
                    value={temperatureUnit}
                    onValueChange={(value) => setTemperatureUnit(value as 'F' | 'C')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="F" id="fahrenheit" data-testid="temp-unit-f" />
                      <Label htmlFor="fahrenheit" className="font-normal cursor-pointer">
                        Fahrenheit (°F)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="C" id="celsius" data-testid="temp-unit-c" />
                      <Label htmlFor="celsius" className="font-normal cursor-pointer">
                        Celsius (°C)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Section */}
          {useWeather && (
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
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose} data-testid="cancel-settings-button">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSavingPreferences} data-testid="save-settings-button">
            {isSavingPreferences && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

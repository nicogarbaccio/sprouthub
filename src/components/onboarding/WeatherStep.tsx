import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CloudSun, ChevronLeft, Loader2, MapPin } from "lucide-react";
import { useLocation } from "@/hooks/useLocation";
import { LocationSection } from "@/components/weather/LocationSection";
import { weatherService } from "@/services/weatherService";
import type { LocationData } from "@/services/weatherTypes";
import { toast } from "sonner";

interface WeatherStepProps {
  onNext: () => void;
  onBack: () => void;
}

export const WeatherStep = ({ onNext, onBack }: WeatherStepProps) => {
  const [useWeather, setUseWeather] = useState(false);
  const [temperatureUnit, setTemperatureUnit] = useState<"F" | "C">("F");
  const [manualLocation, setManualLocation] = useState("");
  const [manualLocationData, setManualLocationData] =
    useState<LocationData | null>(null);
  const [isGeocodingLocation, setIsGeocodingLocation] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  const location = useLocation({
    autoRequest: false,
  });

  const handleToggleWeather = (enabled: boolean) => {
    setUseWeather(enabled);

    // If enabling and no location yet, request it
    if (enabled && !location.location && !manualLocationData) {
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
    } catch (error: any) {
      setGeocodingError(
        error.message ||
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

  const handleContinue = () => {
    // Store preferences in sessionStorage to be saved later
    sessionStorage.setItem(
      "onboarding_weather",
      JSON.stringify({
        use_weather_data: useWeather,
        temperature_unit: temperatureUnit,
        manual_location: manualLocation || null,
      })
    );

    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-plant-primary/10 rounded-full flex items-center justify-center">
            <CloudSun className="w-8 h-8 text-plant-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Enable Weather Features
        </h2>
        <p className="text-muted-foreground">
          Get personalized plant care insights based on your local weather conditions
        </p>
      </div>

      {/* Weather Toggle */}
      <div className="border-2 rounded-lg p-4 bg-card">
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
          />
        </div>
      </div>

      {/* Temperature Unit */}
      {useWeather && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <Label className="text-base font-medium">Temperature Unit</Label>
          <RadioGroup
            value={temperatureUnit}
            onValueChange={(value) => setTemperatureUnit(value as "F" | "C")}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
              <RadioGroupItem value="F" id="fahrenheit" />
              <Label
                htmlFor="fahrenheit"
                className="font-normal cursor-pointer flex-1"
              >
                Fahrenheit (°F)
              </Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
              <RadioGroupItem value="C" id="celsius" />
              <Label
                htmlFor="celsius"
                className="font-normal cursor-pointer flex-1"
              >
                Celsius (°C)
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Location Section */}
      {useWeather && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
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

      {/* Features Info */}
      {useWeather && (
        <Alert className="animate-in fade-in slide-in-from-top-2 duration-300">
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Weather features include:</div>
            <ul className="text-sm space-y-1 ml-4 list-disc">
              <li>Weather-based care tips on your dashboard</li>
              <li>Rain delay notifications for outdoor plants</li>
              <li>Extreme weather alerts</li>
              <li>Seasonal watering adjustments</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <Button onClick={handleContinue} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
};

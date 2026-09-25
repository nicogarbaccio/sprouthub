import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MapPin } from "lucide-react";
import { StepHeading, StepNav } from "./OnboardingUI";
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
    <div className="space-y-4">
      <StepHeading
        title="Enable Weather Features"
        body="We use your local forecast to spot season changes early and flag rain for outdoor plants."
      />

      {/* Weather Toggle */}
      <label
        htmlFor="weather-toggle"
        className="flex items-center justify-between gap-4 rounded-[18px] bg-card p-4 cursor-pointer"
      >
        <span>
          <span className="block font-bold text-[15px] text-foreground">Use Weather Data</span>
          <span className="block text-sm text-muted-foreground mt-0.5">
            Real-time, weather-based care tips
          </span>
        </span>
        <Switch
          id="weather-toggle"
          checked={useWeather}
          onCheckedChange={handleToggleWeather}
        />
      </label>

      {/* Temperature Unit */}
      {useWeather && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground px-1.5">
            Temperature unit
          </div>
          <RadioGroup
            value={temperatureUnit}
            onValueChange={(value) => setTemperatureUnit(value as "F" | "C")}
            className="grid grid-cols-2 gap-2"
          >
            {([
              { value: "F", id: "fahrenheit", label: "Fahrenheit (°F)" },
              { value: "C", id: "celsius", label: "Celsius (°C)" },
            ] as const).map((unit) => (
              <Label
                key={unit.value}
                htmlFor={unit.id}
                className={`flex items-center gap-2.5 min-h-[52px] rounded-[18px] px-4 cursor-pointer font-bold text-[15px] transition-colors ${
                  temperatureUnit === unit.value
                    ? "bg-sprout-cream text-sprout-dark"
                    : "bg-card text-foreground"
                }`}
              >
                <RadioGroupItem value={unit.value} id={unit.id} className="border-current text-current" />
                {unit.label}
              </Label>
            ))}
          </RadioGroup>
        </div>
      )}

      {/* Location Section */}
      {useWeather && (
        <div className="rounded-3xl bg-card p-4 animate-in fade-in slide-in-from-top-2 duration-300">
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
        <div className="rounded-3xl bg-sprout-water text-sprout-dark p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 font-bold text-[15px]">
            <MapPin className="h-4 w-4" />
            Weather features include:
          </div>
          <ul className="text-sm font-medium space-y-1 mt-2 ml-5 list-disc">
            <li>Weather-based care tips on your dashboard</li>
            <li>Rain delay notifications for outdoor plants</li>
            <li>Extreme weather alerts</li>
            <li>Seasonal watering adjustments</li>
          </ul>
        </div>
      )}

      <div className="pt-4">
        <StepNav onBack={onBack} onNext={handleContinue} label="Continue" />
      </div>
    </div>
  );
};

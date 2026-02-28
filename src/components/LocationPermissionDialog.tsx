import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  AlertCircle,
  CheckCircle,
  Search,
  Loader2,
} from "lucide-react";
import { LocationData, WeatherError } from "@/services/weatherTypes";

interface LocationPermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelected: (location: LocationData) => void;
  onUseCurrentLocation: () => Promise<void>;
  onSearchCity: (cityName: string) => Promise<LocationData>;
  error?: WeatherError | null;
  isLoading?: boolean;
  currentLocation?: LocationData | null;
}

export function LocationPermissionDialog({
  isOpen,
  onClose,
  onLocationSelected,
  onUseCurrentLocation,
  onSearchCity,
  error,
  isLoading = false,
  currentLocation,
}: LocationPermissionDialogProps) {
  const [citySearch, setCitySearch] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleUseCurrentLocation = async () => {
    try {
      await onUseCurrentLocation();
    } catch (err) {
      // Error is handled by parent component
    }
  };

  const handleCitySearch = async () => {
    if (!citySearch.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const location = await onSearchCity(citySearch.trim());
      onLocationSelected(location);
      onClose();
    } catch (err) {
      const weatherError = err as WeatherError;
      setSearchError(weatherError.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSearching) {
      handleCitySearch();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-sprout-dark text-sprout-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sprout-light" />
            Location for Weather Data
          </DialogTitle>
          <DialogDescription className="text-sprout-light">
            We need your location to provide accurate weather-based watering
            recommendations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Location Option */}
          <Card className="border-sprout-medium bg-sprout-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-sprout-light" />
                  <span className="font-medium text-sprout-white">
                    Use Current Location
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Recommended
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-sprout-light mb-3">
                Get the most accurate weather data for your exact location.
              </p>

              {error?.type === "permission_denied" && (
                <div className="flex items-center gap-2 p-2 bg-sprout-warning/20 rounded mb-3">
                  <AlertCircle className="w-4 h-4 text-sprout-warning" />
                  <span className="text-sm text-sprout-warning">
                    Location access denied. Please enable location permissions
                    or search for your city.
                  </span>
                </div>
              )}

              {currentLocation && (
                <div className="flex items-center gap-2 p-2 bg-sprout-success/20 rounded mb-3">
                  <CheckCircle className="w-4 h-4 text-sprout-success" />
                  <span className="text-sm text-sprout-success">
                    Location detected:{" "}
                    {currentLocation.city || "Current location"}
                  </span>
                </div>
              )}

              <Button
                onClick={handleUseCurrentLocation}
                disabled={isLoading}
                className="w-full bg-sprout-success hover:bg-sprout-success/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 mr-2" />
                    Use My Current Location
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Manual City Search */}
          <Card className="border-sprout-medium bg-sprout-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-sprout-light" />
                <span className="font-medium text-sprout-white">
                  Search by City
                </span>
              </div>

              <p className="text-sm text-sprout-light mb-3">
                Enter your city name to get weather data for your area.
              </p>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="city-search" className="text-sprout-light">
                    City Name
                  </Label>
                  <Input
                    id="city-search"
                    type="text"
                    placeholder="e.g., New York, London, Tokyo"
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-sprout-primary border-sprout-medium text-sprout-white"
                  />
                </div>

                {searchError && (
                  <div className="flex items-center gap-2 p-2 bg-sprout-danger/20 rounded">
                    <AlertCircle className="w-4 h-4 text-sprout-danger" />
                    <span className="text-sm text-sprout-danger">
                      {searchError}
                    </span>
                  </div>
                )}

                <Button
                  onClick={handleCitySearch}
                  disabled={!citySearch.trim() || isSearching}
                  variant="outline"
                  className="w-full border-sprout-light text-sprout-light hover:bg-sprout-light hover:text-sprout-dark"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search City
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-sprout-light hover:bg-sprout-light/20"
          >
            Skip for Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

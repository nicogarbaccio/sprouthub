import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, AlertCircle, CheckCircle, Search, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldLabel, settingsInputClasses } from "@/components/settings/SettingsUI";
import {
  SheetGrabber,
  dialogSheetClasses,
  sheetHeaderClasses,
  sheetIconButtonClasses,
  sheetPrimaryButtonClasses,
  sheetSecondaryButtonClasses,
  sheetTitleClasses,
} from "@/components/ui/bento-sheet";
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
      <DialogContent className={cn(dialogSheetClasses, "sm:max-w-md")}>
        <SheetGrabber />
        <DialogHeader className={sheetHeaderClasses}>
          <div className="w-[52px] h-[52px] shrink-0 rounded-[18px] bg-sprout-cream text-sprout-dark flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className={sheetTitleClasses}>Your location</DialogTitle>
            <DialogDescription className="text-sm font-medium">
              For accurate weather-based watering advice
            </DialogDescription>
          </div>
          <button type="button" onClick={onClose} className={cn(sheetIconButtonClasses, "self-start")} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="mt-4 space-y-2">
          {/* Current location */}
          <div className="rounded-3xl bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-foreground">Use current location</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sprout-success text-sprout-dark">
                Recommended
              </span>
            </div>
            <p className="text-sm text-muted-foreground -mt-1.5">The most accurate weather for exactly where you are.</p>

            {error?.type === "permission_denied" && (
              <div className="flex items-start gap-2 rounded-[16px] bg-sprout-warning text-sprout-dark px-3.5 py-2.5 text-sm font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                Location access denied. Enable location permissions or search for your city.
              </div>
            )}

            {currentLocation && (
              <div className="flex items-center gap-2 rounded-[16px] bg-sprout-success text-sprout-dark px-3.5 py-2.5 text-sm font-semibold">
                <CheckCircle className="w-4 h-4 shrink-0" />
                Location detected: {currentLocation.city || "Current location"}
              </div>
            )}

            <button type="button" onClick={handleUseCurrentLocation} disabled={isLoading} className={sheetPrimaryButtonClasses}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
              {isLoading ? "Getting Location..." : "Use My Current Location"}
            </button>
          </div>

          {/* City search */}
          <div className="rounded-3xl bg-card p-4 space-y-3">
            <div>
              <FieldLabel htmlFor="city-search">Or search by city</FieldLabel>
              <Input
                id="city-search"
                type="text"
                placeholder="e.g., New York, London, Tokyo"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                onKeyDown={handleKeyPress}
                className={settingsInputClasses}
              />
            </div>

            {searchError && (
              <div className="flex items-start gap-2 rounded-[16px] bg-sprout-warning text-sprout-dark px-3.5 py-2.5 text-sm font-semibold" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {searchError}
              </div>
            )}

            <button
              type="button"
              onClick={handleCitySearch}
              disabled={!citySearch.trim() || isSearching}
              className="w-full h-12 rounded-[18px] bg-field text-foreground font-bold text-[15px] inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {isSearching ? "Searching..." : "Search City"}
            </button>
          </div>

          <button type="button" onClick={onClose} className={sheetSecondaryButtonClasses}>
            Skip for Now
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { ManualLocationInput } from "./ManualLocationInput";
import type { LocationData, WeatherError } from "@/services/weatherTypes";

interface LocationSectionProps {
  // Browser location state
  browserLocation: LocationData | null;
  isBrowserLoading: boolean;
  browserError: WeatherError | null;
  onRequestBrowserLocation: () => void;

  // Manual location state
  manualLocation: string;
  manualLocationData: LocationData | null;
  isGeocoding: boolean;
  geocodingError: string | null;
  onManualLocationChange: (value: string) => void;
  onGeocode: () => void;
  onClearManualLocation: () => void;
  onGeocodingErrorClear: () => void;
}

export function LocationSection({
  browserLocation,
  isBrowserLoading,
  browserError,
  onRequestBrowserLocation,
  manualLocation,
  manualLocationData,
  isGeocoding,
  geocodingError,
  onManualLocationChange,
  onGeocode,
  onClearManualLocation,
  onGeocodingErrorClear,
}: LocationSectionProps) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-500" />
          <Label className="text-base font-medium">Location</Label>
        </div>

        {/* Browser Location Loading */}
        {isBrowserLoading && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Detecting your location...
            </AlertDescription>
          </Alert>
        )}

        {/* Browser Location Error */}
        {browserError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {browserError.message}
              {browserError.type === 'permission_denied' && (
                <span className="block mt-2 text-xs">
                  You can manually enter your location below instead.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Browser Location Success */}
        {browserLocation && !manualLocationData && (
          <Alert data-testid="browser-location-success">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription>
              <div className="font-medium">Browser location detected</div>
              <div className="text-xs text-muted-foreground mt-1">
                Latitude: {browserLocation.latitude.toFixed(4)},
                Longitude: {browserLocation.longitude.toFixed(4)}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Manual Location Success */}
        {manualLocationData && (
          <Alert data-testid="manual-location-success">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium">Manual location set</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {manualLocationData.city}{manualLocationData.country && `, ${manualLocationData.country}`}
                    <br />
                    Lat: {manualLocationData.latitude.toFixed(4)}, Lon: {manualLocationData.longitude.toFixed(4)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearManualLocation}
                  className="h-6 w-6 p-0"
                  data-testid="clear-manual-location-button"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Manual Location Input */}
        <ManualLocationInput
          value={manualLocation}
          onChange={onManualLocationChange}
          onGeocode={onGeocode}
          isGeocoding={isGeocoding}
          error={geocodingError}
          onErrorClear={onGeocodingErrorClear}
        />

        {/* Request Location Button */}
        {!browserLocation && !isBrowserLoading && (
          <Button
            variant="outline"
            onClick={onRequestBrowserLocation}
            className="w-full"
            data-testid="detect-location-button"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Detect My Location
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

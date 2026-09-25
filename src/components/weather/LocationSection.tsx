import { cn } from "@/lib/utils";
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
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1 text-[15px] font-bold text-foreground">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        Location
      </div>

      {/* Browser Location Loading */}
      {isBrowserLoading && (
        <StatusRow icon={<Loader2 className="h-5 w-5 animate-spin" />} title="Detecting your location..." />
      )}

      {/* Browser Location Error */}
      {browserError && (
        <StatusRow
          tone="warning"
          icon={<AlertCircle className="h-5 w-5" />}
          title={browserError.message}
          detail={
            browserError.type === "permission_denied"
              ? "You can enter your location below instead."
              : undefined
          }
        />
      )}

      {/* Browser Location Success */}
      {browserLocation && !manualLocationData && (
        <StatusRow
          testId="browser-location-success"
          tone="success"
          icon={<CheckCircle className="h-5 w-5" />}
          title="Browser location detected"
          detail={`Latitude ${browserLocation.latitude.toFixed(4)}, longitude ${browserLocation.longitude.toFixed(4)}`}
        />
      )}

      {/* Manual Location Success */}
      {manualLocationData && (
        <StatusRow
          testId="manual-location-success"
          tone="success"
          icon={<CheckCircle className="h-5 w-5" />}
          title={`${manualLocationData.city}${manualLocationData.country ? `, ${manualLocationData.country}` : ""}`}
          detail={`Lat ${manualLocationData.latitude.toFixed(4)}, lon ${manualLocationData.longitude.toFixed(4)}`}
          action={
            <button
              type="button"
              onClick={onClearManualLocation}
              className="w-9 h-9 rounded-xl bg-card flex items-center justify-center"
              aria-label="Clear manual location"
              data-testid="clear-manual-location-button"
            >
              <X className="h-4 w-4" />
            </button>
          }
        />
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
        <button
          type="button"
          onClick={onRequestBrowserLocation}
          className="w-full h-12 rounded-2xl bg-field text-foreground font-bold text-[15px] inline-flex items-center justify-center gap-2"
          data-testid="detect-location-button"
        >
          <MapPin className="h-4 w-4" />
          Detect My Location
        </button>
      )}
    </div>
  );
}

function StatusRow({
  icon,
  title,
  detail,
  tone = "neutral",
  action,
  testId,
}: {
  icon: React.ReactNode;
  title: string;
  detail?: string;
  tone?: "neutral" | "success" | "warning";
  action?: React.ReactNode;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "flex items-start gap-3 rounded-[18px] px-4 py-3",
        tone === "success" && "bg-sprout-success text-sprout-dark",
        tone === "warning" && "bg-sprout-warning text-sprout-dark",
        tone === "neutral" && "bg-field text-foreground"
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-bold">{title}</div>
        {detail && <div className="text-[13px] font-medium opacity-80 mt-0.5">{detail}</div>}
      </div>
      {action}
    </div>
  );
}

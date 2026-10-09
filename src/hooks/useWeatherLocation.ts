import { useEffect, useState } from 'react';
import type { LocationData } from '@/services/weatherTypes';
import weatherService from '@/services/weatherService';
import { useLocation } from '@/hooks/useLocation';
import { isDeviceLocationDenied, loadManualLocation, saveManualLocation } from '@/utils/weather/savedLocation';
import { hookLogger } from '@/utils/hookLogging';

const HOOK_NAME = 'useWeatherLocation';

/** A saved device location older than this is refreshed, but only when that can't prompt */
const DEVICE_LOCATION_REFRESH_MS = 6 * 60 * 60 * 1000;

interface UseWeatherLocationOptions {
  /** Whether the user has weather features turned on */
  enabled: boolean;
  /** The location the user typed into weather settings; when set, the device is never asked */
  manualLocation?: string | null;
  /**
   * Whether this caller may ask for the device's location when none is saved yet. Leave it
   * off for background consumers so only one place can trigger the permission prompt.
   */
  canPrompt?: boolean;
}

/**
 * The location to fetch weather for: the user's manual location when they've set one,
 * otherwise the device's location, remembered across visits so it isn't requested (and
 * potentially prompted for) on every load.
 */
export function useWeatherLocation({
  enabled,
  manualLocation,
  canPrompt = false,
}: UseWeatherLocationOptions) {
  const query = manualLocation?.trim() || null;
  const device = useLocation();
  const [manual, setManual] = useState<LocationData | null>(() => loadManualLocation(query));
  const { location: deviceLocation, requestLocation, refreshLocationIfPermitted } = device;
  const hasDeviceLocation = !!deviceLocation;

  // Look up the manual location; coordinates are remembered per query, so this hits the
  // geocoding API once per change of location rather than on every load
  useEffect(() => {
    if (!enabled || !query) return;

    const saved = loadManualLocation(query);
    if (saved) {
      setManual(saved);
      return;
    }

    let cancelled = false;
    weatherService
      .getLocationFromInput(query)
      .then((location) => {
        saveManualLocation(query, location);
        if (!cancelled) setManual(location);
      })
      .catch((error) => {
        hookLogger.warn(HOOK_NAME, 'Could not look up manual location', { error });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, query]);

  useEffect(() => {
    if (!enabled || query) return;

    if (!hasDeviceLocation) {
      if (canPrompt && !isDeviceLocationDenied()) requestLocation();
      return;
    }

    void refreshLocationIfPermitted(DEVICE_LOCATION_REFRESH_MS);
  }, [enabled, query, hasDeviceLocation, canPrompt, requestLocation, refreshLocationIfPermitted]);

  return {
    location: enabled ? (query ? manual : deviceLocation) : null,
    error: query ? null : device.error,
  };
}

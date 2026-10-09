import type { LocationData } from '@/services/weatherTypes';

/**
 * Locations remembered across visits, so weather doesn't need a fresh geolocation request on
 * every load. iOS browsers don't reliably remember a site's location permission, so each
 * request there can mean another "allow location?" prompt.
 *
 * Plants stay put, so a saved location stays good; it's refreshed only when that can happen
 * without a prompt, or when the user asks for their current location.
 */

const DEVICE_KEY = 'sprouthub:weather-location:device';
const MANUAL_KEY = 'sprouthub:weather-location:manual';
const DENIED_KEY = 'sprouthub:weather-location:denied';

interface SavedDeviceLocation extends LocationData {
  savedAt: number;
}

interface SavedManualLocation extends LocationData {
  query: string;
}

const read = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode, quota); the location just won't be remembered
  }
};

const isLocation = (value: LocationData | null): value is LocationData =>
  !!value && Number.isFinite(value.latitude) && Number.isFinite(value.longitude);

const toLocation = ({ latitude, longitude, city, country }: LocationData): LocationData => ({
  latitude,
  longitude,
  ...(city ? { city } : {}),
  ...(country ? { country } : {}),
});

const normalizeQuery = (query: string) => query.trim().toLowerCase();

/** The last location the device reported, if any */
export const loadDeviceLocation = (): LocationData | null => {
  const saved = read<SavedDeviceLocation>(DEVICE_KEY);
  return isLocation(saved) ? toLocation(saved) : null;
};

/** How long ago the device location was saved, or null when there isn't one */
export const deviceLocationAge = (): number | null => {
  const saved = read<SavedDeviceLocation>(DEVICE_KEY);
  return isLocation(saved) && Number.isFinite(saved.savedAt) ? Date.now() - saved.savedAt : null;
};

export const saveDeviceLocation = (location: LocationData) => {
  write(DEVICE_KEY, { ...toLocation(location), savedAt: Date.now() });
  setDeviceLocationDenied(false);
};

/**
 * Whether the user turned down a location request. Weather stops asking on its own until they
 * ask for their location themselves (e.g. "use my location" in settings).
 */
export const isDeviceLocationDenied = () => read<boolean>(DENIED_KEY) === true;

export const setDeviceLocationDenied = (denied: boolean) => {
  if (denied) {
    write(DENIED_KEY, true);
    return;
  }
  try {
    localStorage.removeItem(DENIED_KEY);
  } catch {
    // Nothing to clear when storage is unavailable
  }
};

/** The geocoded coordinates for a manually entered location, if that same text was looked up before */
export const loadManualLocation = (query: string | null | undefined): LocationData | null => {
  if (!query?.trim()) return null;
  const saved = read<SavedManualLocation>(MANUAL_KEY);
  return isLocation(saved) && saved.query === normalizeQuery(query) ? toLocation(saved) : null;
};

export const saveManualLocation = (query: string, location: LocationData) =>
  write(MANUAL_KEY, { ...toLocation(location), query: normalizeQuery(query) });

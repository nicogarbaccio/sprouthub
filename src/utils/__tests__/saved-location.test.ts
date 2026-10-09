import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  deviceLocationAge,
  isDeviceLocationDenied,
  loadDeviceLocation,
  loadManualLocation,
  saveDeviceLocation,
  saveManualLocation,
  setDeviceLocationDenied,
} from '@/utils/weather/savedLocation';

const portland = { latitude: 45.52, longitude: -122.68, city: 'Portland', country: 'US' };

describe('saved weather location', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('remembers the device location across loads', () => {
    expect(loadDeviceLocation()).toBeNull();
    saveDeviceLocation({ latitude: 45.52, longitude: -122.68 });
    expect(loadDeviceLocation()).toEqual({ latitude: 45.52, longitude: -122.68 });
  });

  it('reports how old the device location is', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-08T12:00:00Z'));
    expect(deviceLocationAge()).toBeNull();

    saveDeviceLocation(portland);
    vi.setSystemTime(new Date('2026-10-08T15:00:00Z'));
    expect(deviceLocationAge()).toBe(3 * 60 * 60 * 1000);
  });

  it('ignores corrupt or partial saved data', () => {
    localStorage.setItem('sprouthub:weather-location:device', '{not json');
    expect(loadDeviceLocation()).toBeNull();

    localStorage.setItem('sprouthub:weather-location:device', JSON.stringify({ latitude: 45 }));
    expect(loadDeviceLocation()).toBeNull();
  });

  it('reuses a manual lookup only for the same text', () => {
    saveManualLocation('  Portland, OR ', portland);
    expect(loadManualLocation('portland, or')).toEqual(portland);
    expect(loadManualLocation('Seattle')).toBeNull();
    expect(loadManualLocation('')).toBeNull();
    expect(loadManualLocation(null)).toBeNull();
  });

  it('clears a remembered denial once the device reports a location', () => {
    setDeviceLocationDenied(true);
    expect(isDeviceLocationDenied()).toBe(true);

    saveDeviceLocation(portland);
    expect(isDeviceLocationDenied()).toBe(false);
  });
});

/**
 * Rain delay advice for a set of plants.
 *
 * Encapsulates the preferences + location + weather wiring so every surface reads rain delay
 * the same way. Previously only the Dashboard did this, inline, which is why the Dashboard was
 * the only place that mentioned rain while the notification center and the plant pages
 * reported the same plants as plainly overdue.
 *
 * Weather requests are cached in `weatherService` for an hour, so mounting this in more than
 * one component does not multiply API calls. Location is requested with `autoRequest: false`
 * so mounting it can never trigger an unexpected permission prompt.
 */

import { useMemo } from 'react';
import { useLocation } from '@/hooks/useLocation';
import { useWeatherData } from '@/hooks/useWeatherData';
import { useSmartWateringPreferences } from '@/hooks/useSmartWateringPreferences';
import {
    getRainDelayByPlantId,
    type RainDelayAdvice,
    type RainDelayPlant,
} from '@/utils/watering/rainDelay';
import type { WeatherData } from '@/services/weatherTypes';

export interface UseRainDelayReturn {
    /** Advice keyed by plant id. Plants without advice are absent. */
    rainDelayByPlantId: Record<string, RainDelayAdvice>;
    /** True when the user has weather features on and data is available. */
    isEnabled: boolean;
    weatherData: WeatherData | null;
}

export function useRainDelay<T extends RainDelayPlant & { id: string }>(
    plants: T[]
): UseRainDelayReturn {
    const { preferences } = useSmartWateringPreferences();
    const location = useLocation({ autoRequest: false });

    const weatherEnabled = Boolean(preferences?.use_weather_data);

    const weather = useWeatherData({
        location: location.location,
        autoFetch: weatherEnabled && !!location.location,
    });

    const isEnabled = weatherEnabled && !!weather.weatherData;

    const rainDelayByPlantId = useMemo(
        () =>
            getRainDelayByPlantId(plants, {
                weather: weather.weatherData,
                enabled: weatherEnabled,
            }),
        [plants, weather.weatherData, weatherEnabled]
    );

    return {
        rainDelayByPlantId,
        isEnabled,
        weatherData: weather.weatherData,
    };
}

/**
 * Variant for callers that already hold weather data and just need the mapping, avoiding a
 * second `useWeatherData` instance.
 */
export function useRainDelayFromWeather<T extends RainDelayPlant & { id: string }>(
    plants: T[],
    weatherData: WeatherData | null,
    enabled: boolean
): Record<string, RainDelayAdvice> {
    return useMemo(
        () => getRainDelayByPlantId(plants, { weather: weatherData, enabled }),
        [plants, weatherData, enabled]
    );
}

/**
 * Tests for rain delay advice.
 *
 * Rain delay is advisory: it never changes whether a plant is due, it annotates a due plant and
 * offers a postponement. These tests pin that down, along with the due-awareness the previous
 * implementation lacked.
 */

import { describe, it, expect } from 'vitest';
import {
  getRainDelayAdvice,
  getRainDelayByPlantId,
  getRainDelayMessage,
  getRainDelayAnnotation,
  RAIN_DELAY_THRESHOLD_PCT,
  MAX_RAIN_DELAY_DAYS,
  type RainDelayPlant,
} from '../watering/rainDelay';
import type { WeatherData } from '@/services/weatherTypes';

const NOW = new Date('2026-06-15T12:00:00Z');

function weather(overrides: Partial<WeatherData> = {}): WeatherData {
  return {
    current_temp_celsius: 20,
    current_humidity_percent: 55,
    season: 'summer',
    daylight_hours: 14,
    upcoming_rain_probability: 75,
    is_snowing: false,
    weather_condition: 'Rain',
    ...overrides,
  };
}

/** ISO timestamp N days before NOW. */
function daysBefore(days: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

/** An outdoor plant that is due today on a 7-day schedule. */
function duePlant(overrides: Partial<RainDelayPlant> = {}): RainDelayPlant {
  return {
    is_outdoor_plant: true,
    latest_watering: daysBefore(7),
    suggested_watering_days: 7,
    ...overrides,
  };
}

describe('getRainDelayAdvice', () => {
  it('advises a delay for a due outdoor plant when rain is likely', () => {
    const advice = getRainDelayAdvice({
      plant: duePlant(),
      weather: weather(),
      now: NOW,
    });

    expect(advice).not.toBeNull();
    expect(advice!.rainProbability).toBe(75);
    expect(advice!.suggestedDelayDays).toBe(2);
  });

  it('advises a delay for an overdue outdoor plant', () => {
    const advice = getRainDelayAdvice({
      plant: duePlant({ latest_watering: daysBefore(12) }),
      weather: weather(),
      now: NOW,
    });

    expect(advice).not.toBeNull();
  });

  it('gives no advice for an indoor plant', () => {
    // Rain does not water an indoor plant.
    const advice = getRainDelayAdvice({
      plant: duePlant({ is_outdoor_plant: false }),
      weather: weather(),
      now: NOW,
    });

    expect(advice).toBeNull();
  });

  it('gives no advice when weather features are disabled', () => {
    const advice = getRainDelayAdvice({
      plant: duePlant(),
      weather: weather(),
      enabled: false,
      now: NOW,
    });

    expect(advice).toBeNull();
  });

  it('gives no advice without weather data', () => {
    const advice = getRainDelayAdvice({
      plant: duePlant(),
      weather: null,
      now: NOW,
    });

    expect(advice).toBeNull();
  });

  it('gives no advice below the probability threshold', () => {
    const advice = getRainDelayAdvice({
      plant: duePlant(),
      weather: weather({ upcoming_rain_probability: RAIN_DELAY_THRESHOLD_PCT - 1 }),
      now: NOW,
    });

    expect(advice).toBeNull();
  });

  it('advises at exactly the threshold', () => {
    const advice = getRainDelayAdvice({
      plant: duePlant(),
      weather: weather({ upcoming_rain_probability: RAIN_DELAY_THRESHOLD_PCT }),
      now: NOW,
    });

    expect(advice).not.toBeNull();
  });

  describe('due-awareness', () => {
    it('gives no advice for a plant that is not due yet', () => {
      // Regression: the previous implementation ignored due-ness entirely, so it reported
      // "delay watering" for a plant watered the day before.
      const advice = getRainDelayAdvice({
        plant: duePlant({ latest_watering: daysBefore(1) }),
        weather: weather(),
        now: NOW,
      });

      expect(advice).toBeNull();
    });

    it('gives no advice for a plant with no watering history', () => {
      const advice = getRainDelayAdvice({
        plant: duePlant({ latest_watering: null }),
        weather: weather(),
        now: NOW,
      });

      expect(advice).toBeNull();
    });

    it('gives no advice for a plant already postponed', () => {
      // Its due date has already moved, so there is nothing to defer.
      const postponeTo = new Date(NOW);
      postponeTo.setDate(postponeTo.getDate() + 2);

      const advice = getRainDelayAdvice({
        plant: duePlant({ postponement_date: postponeTo.toISOString() }),
        weather: weather(),
        now: NOW,
      });

      expect(advice).toBeNull();
    });
  });

  describe('delay length', () => {
    it('suggests one day for a moderate chance', () => {
      const advice = getRainDelayAdvice({
        plant: duePlant(),
        weather: weather({ upcoming_rain_probability: 65 }),
        now: NOW,
      });

      expect(advice!.suggestedDelayDays).toBe(1);
    });

    it('suggests two days for a high chance', () => {
      const advice = getRainDelayAdvice({
        plant: duePlant(),
        weather: weather({ upcoming_rain_probability: 75 }),
        now: NOW,
      });

      expect(advice!.suggestedDelayDays).toBe(2);
    });

    it('suggests three days for a very high chance', () => {
      const advice = getRainDelayAdvice({
        plant: duePlant(),
        weather: weather({ upcoming_rain_probability: 85 }),
        now: NOW,
      });

      expect(advice!.suggestedDelayDays).toBe(3);
    });

    it('never exceeds the maximum delay', () => {
      const advice = getRainDelayAdvice({
        plant: duePlant(),
        weather: weather({ upcoming_rain_probability: 100 }),
        now: NOW,
      });

      expect(advice!.suggestedDelayDays).toBeLessThanOrEqual(MAX_RAIN_DELAY_DAYS);
    });

    it('respects a caller-supplied maximum', () => {
      const advice = getRainDelayAdvice({
        plant: duePlant(),
        weather: weather({ upcoming_rain_probability: 95 }),
        options: { maxDelayDays: 1 },
        now: NOW,
      });

      expect(advice!.suggestedDelayDays).toBe(1);
    });

    it('respects a caller-supplied threshold', () => {
      const advice = getRainDelayAdvice({
        plant: duePlant(),
        weather: weather({ upcoming_rain_probability: 40 }),
        options: { rainThreshold: 40 },
        now: NOW,
      });

      expect(advice).not.toBeNull();
    });

    it('sets nextCheckDate to the end of the suggested delay', () => {
      const advice = getRainDelayAdvice({
        plant: duePlant(),
        weather: weather({ upcoming_rain_probability: 85 }),
        now: NOW,
      });

      const expected = new Date(NOW);
      expected.setDate(expected.getDate() + 3);

      expect(advice!.nextCheckDate.toDateString()).toBe(expected.toDateString());
    });
  });

  it('describes snow rather than rain when the forecast is snow', () => {
    const advice = getRainDelayAdvice({
      plant: duePlant(),
      weather: weather({ is_snowing: true }),
      now: NOW,
    });

    expect(advice!.isSnowing).toBe(true);
    expect(advice!.reason).toContain('Snow');
  });
});

describe('getRainDelayByPlantId', () => {
  it('keys advice by plant id and omits plants without advice', () => {
    const plants = [
      { id: 'outdoor-due', ...duePlant() },
      { id: 'indoor-due', ...duePlant({ is_outdoor_plant: false }) },
      { id: 'outdoor-not-due', ...duePlant({ latest_watering: daysBefore(1) }) },
    ];

    const result = getRainDelayByPlantId(plants, { weather: weather(), now: NOW });

    expect(Object.keys(result)).toEqual(['outdoor-due']);
  });

  it('returns an empty map when weather is unavailable', () => {
    const plants = [{ id: 'a', ...duePlant() }];

    expect(getRainDelayByPlantId(plants, { weather: null, now: NOW })).toEqual({});
  });
});

describe('messaging', () => {
  const advice = getRainDelayAdvice({
    plant: duePlant(),
    weather: weather(),
    now: NOW,
  })!;

  it('frames the message as a choice rather than a decision already made', () => {
    const message = getRainDelayMessage(advice, 'Tomato');

    expect(message).toContain('Tomato');
    expect(message).toContain('is due');
    expect(message).toContain('may want to wait');
    // The old copy asserted watering "can be skipped", implying the reminder was handled.
    expect(message.toLowerCase()).not.toContain('skip');
  });

  it('falls back to a generic subject without a plant name', () => {
    expect(getRainDelayMessage(advice)).toContain('this outdoor plant');
  });

  it('produces a compact annotation for appending to existing copy', () => {
    const annotation = getRainDelayAnnotation(advice);

    expect(annotation).toContain('75%');
    expect(annotation).toContain('rain');
  });
});

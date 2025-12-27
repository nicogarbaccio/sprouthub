/**
 * Weather Mood Service
 *
 * Generates fun, contextual messages and mood data based on current weather conditions.
 * Used to create a dynamic, personality-filled weather banner on the dashboard.
 *
 * All messages and copy are stored in src/config/weatherMoodMessages.ts for easy editing.
 */

import { WeatherData } from './weatherTypes';
import {
  weatherMoodMessages,
  formatWeatherMessage,
  getRandomMessage,
} from '@/config/weatherMoodMessages';

export interface WeatherMood {
  mood: 'excellent' | 'great' | 'good' | 'fair' | 'challenging';
  message: string;
  plantAdvice: string;
  emoji: string;
  gradient: string; // CSS gradient for background
  animation: 'sunny' | 'cloudy' | 'rainy' | 'hot' | 'cold' | 'perfect';
}

class WeatherMoodService {
  /**
   * Determine the overall weather mood based on conditions
   */
  getWeatherMood(weather: WeatherData, temperatureUnit: 'F' | 'C' = 'F'): WeatherMood {
    const temp = weather.current_temp_celsius;
    const humidity = weather.current_humidity_percent;
    const rainProb = weather.upcoming_rain_probability;

    // Snowy conditions
    if (weather.is_snowing) {
      return this.buildMood(
        "fair",
        weatherMoodMessages.snowy,
        { temp, humidity, rainProb },
        temperatureUnit
      );
    }

    // Perfect conditions: 18-24°C, 40-60% humidity, low rain
    if (temp >= 18 && temp <= 24 && humidity >= 40 && humidity <= 60 && rainProb < 30) {
      return this.buildMood('excellent', weatherMoodMessages.perfect, { temp, humidity, rainProb }, temperatureUnit);
    }

    // Hot & sunny conditions
    if (temp > 28 && rainProb < 20) {
      const mood = temp > 35 ? 'challenging' : 'good';
      return this.buildMood(mood, weatherMoodMessages.hotSunny, { temp, humidity, rainProb }, temperatureUnit);
    }

    // Rainy conditions
    if (rainProb > 60) {
      return this.buildMood('good', weatherMoodMessages.rainy, { temp, humidity, rainProb }, temperatureUnit);
    }

    // Cold conditions
    if (temp < 10) {
      const mood = temp < 0 ? 'challenging' : 'fair';
      return this.buildMood(mood, weatherMoodMessages.cold, { temp, humidity, rainProb }, temperatureUnit);
    }

    // Warm & pleasant
    if (temp >= 20 && temp <= 28) {
      return this.buildMood('great', weatherMoodMessages.pleasant, { temp, humidity, rainProb }, temperatureUnit);
    }

    // Cool but nice
    if (temp >= 10 && temp < 20) {
      return this.buildMood('good', weatherMoodMessages.cool, { temp, humidity, rainProb }, temperatureUnit);
    }

    // Default: Fair conditions
    return this.buildMood('fair', weatherMoodMessages.fair, { temp, humidity, rainProb }, temperatureUnit);
  }

  /**
   * Build a weather mood object from config
   */
  private buildMood(
    mood: WeatherMood['mood'],
    config: { messages: readonly string[]; advice: readonly string[]; emoji: string; gradient: string; animation: WeatherMood['animation'] },
    data: { temp: number; humidity: number; rainProb: number },
    temperatureUnit: 'F' | 'C' = 'F'
  ): WeatherMood {
    const message = getRandomMessage(config.messages);
    const advice = getRandomMessage(config.advice);

    return {
      mood,
      message: formatWeatherMessage(message, data, temperatureUnit),
      plantAdvice: formatWeatherMessage(advice, data, temperatureUnit),
      emoji: config.emoji,
      gradient: config.gradient,
      animation: config.animation,
    };
  }

  /**
   * Get time-of-day greeting
   */
  getTimeOfDayMessage(): string {
    const hour = new Date().getHours();
    const { timeOfDay } = weatherMoodMessages;

    if (timeOfDay.earlyMorning.hours.includes(hour)) {
      return timeOfDay.earlyMorning.message;
    } else if (timeOfDay.morning.hours.includes(hour)) {
      return timeOfDay.morning.message;
    } else if (timeOfDay.afternoon.hours.includes(hour)) {
      return timeOfDay.afternoon.message;
    } else if (timeOfDay.evening.hours.includes(hour)) {
      return timeOfDay.evening.message;
    } else if (timeOfDay.lateNight.hours.includes(hour)) {
      return timeOfDay.lateNight.message;
    }

    return "Hello, plant parent! 👋";
  }

  /**
   * Get special weather event messages
   */
  getSpecialEventMessage(weather: WeatherData): string | null {
    const temp = weather.current_temp_celsius;
    const humidity = weather.current_humidity_percent;
    const rainProb = weather.upcoming_rain_probability;
    const { specialEvents } = weatherMoodMessages;

    // Extreme heat
    if (temp > specialEvents.extremeHeat.threshold) {
      return specialEvents.extremeHeat.message;
    }

    // Freeze warning
    if (temp < specialEvents.freeze.threshold) {
      return specialEvents.freeze.message;
    }

    // Perfect storm - check if conditions are absolutely ideal
    if (
      temp >= 20 &&
      temp <= 24 &&
      humidity >= 45 &&
      humidity <= 55 &&
      rainProb < 20
    ) {
      return specialEvents.perfectStorm.message;
    }

    // Heavy rain
    if (rainProb > specialEvents.heavyRain.threshold) {
      return specialEvents.heavyRain.message;
    }

    // Extremely dry
    if (humidity < specialEvents.veryDry.threshold) {
      return specialEvents.veryDry.message;
    }

    // Extremely humid
    if (humidity > specialEvents.veryHumid.threshold) {
      return specialEvents.veryHumid.message;
    }

    return null;
  }
}

export const weatherMoodService = new WeatherMoodService();
export default weatherMoodService;

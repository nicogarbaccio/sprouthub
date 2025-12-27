/**
 * Weather Mood Messages Configuration
 *
 * Centralized location for all weather mood messages, advice, and visual settings.
 * Edit this file to customize the copy shown in the Weather Mood Banner.
 */

import { WeatherMood } from '@/services/weatherMoodService';

export interface WeatherMoodConfig {
  messages: string[];
  advice: string[];
  emoji: string;
  gradient: string;
  animation: WeatherMood['animation'];
}

export const weatherMoodMessages = {
  /**
   * PERFECT CONDITIONS
   * Triggers: 18-24°C, 40-60% humidity, <30% rain probability
   * The ideal weather for plant growth
   */
  perfect: {
    messages: [
      "Perfect weather for plant parents! ☀️",
      "Your plants are living their best life today!",
      "Ideal conditions detected! 🌟",
      "Mother Nature is showing off today!",
      "Peak plant thriving weather! 🌿",
      "Plant paradise conditions! 🌺",
      "This is what plant dreams are made of!",
    ],
    advice: [
      "Perfect time for propagation or repotting",
      "Your indoor plants should be thriving in these conditions",
      "Great day to open windows for fresh air circulation",
      "Excellent conditions for plant maintenance tasks",
      "Good time to fertilize if it's been a while",
      "Consider rotating plants for even growth",
    ],
    emoji: "✨",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    animation: "perfect" as const,
  },

  /**
   * HOT & SUNNY
   * Triggers: >28°C, <20% rain probability
   * High temperature conditions
   */
  hotSunny: {
    messages: [
      "Sizzling {temp}° outside! 🌞",
      "It's a scorcher out there! ☀️",
      "Hot, hot, hot! Stay hydrated (plants too)!",
      "The sun is bringing the heat today! 🔥",
      "Summer vibes in full swing! 😎",
      "Feeling the burn at {temp}°!",
      "Solar power mode activated! ☀️",
    ],
    advice: [
      "Check soil moisture more frequently today",
      "Perfect weather for heat-loving tropical plants!",
      "Keep plants away from hot window glass",
      "Watch for signs of heat stress or wilting",
      "Indoor air may be drier - consider misting",
      "AC can dry out air - monitor humidity levels",
    ],
    emoji: "🌞",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    animation: "hot" as const,
  },

  /**
   * RAINY
   * Triggers: >60% rain probability
   * Precipitation expected
   */
  rainy: {
    messages: [
      "Rainy day vibes! ☁️💧",
      "Cozy indoor plant time! 🌧️",
      "Pitter-patter outside, plant care inside! 🌧️",
      "Perfect day for indoor gardening! ☔",
      "Rainy weather means higher humidity! 💧",
      "Cloudy skies, happy plant vibes! ☁️",
      "Moisture in the air today! 🌿",
    ],
    advice: [
      "Higher humidity is great for tropical plants",
      "Perfect cozy day for plant maintenance",
      "Good time to clean and inspect plant leaves",
      "Less light today - plants may need less water",
      "Great conditions for ferns and humidity-lovers",
      "Consider moving plants closer to windows for light",
    ],
    emoji: "🌧️",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    animation: "rainy" as const,
  },

  /**
   * SNOWY
   * Triggers: Snowing condition detected
   * Snowing
   */
  snowy: {
    messages: [
      "Let it snow! ❄️",
      "Winter wonderland outside! ☃️",
      "Cozy plant care day indoors! 🌨️",
      "Frosty outside, warm inside! ❄️",
      "Keep your plants cozy inside! 🧣",
      "Snowy vibes, houseplant thrives! ⛄",
    ],
    advice: [
      "Heating systems dry air - boost humidity for plants",
      "Keep plants away from cold window drafts",
      "Great time to plan your spring plant additions",
      "Indoor air can be very dry - consider a humidifier",
      "Move plants from cold windows at night",
    ],
    emoji: "🌨️",
    gradient: "linear-gradient(135deg, #E0EAFC 0%, #CFDEF3 100%)",
    animation: "cold" as const,
  },

  /**
   * COLD
   * Triggers: <10°C
   * Chilly weather conditions
   */
  cold: {
    messages: [
      "Brr! {temp}° and chilly! ❄️",
      "Winter vibes today! 🥶",
      "Cold outside, cozy plant time inside!",
      "Frosty weather detected! ⛄",
      "Time for hot cocoa and plant care! ☕",
      "Cold snap alert! {temp}°",
      "Chilly day, cozy plant check! 🧣",
    ],
    advice: [
      "Indoor plants need less water in cold weather",
      "Check for cold drafts near your plants",
      "Keep plants away from cold windows at night",
      "Reduce watering frequency during cold spells",
      "Heating can dry air - watch humidity levels",
      "Most plants enter slower growth in winter",
    ],
    emoji: "❄️",
    gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    animation: "cold" as const,
  },

  /**
   * PLEASANT
   * Triggers: 20-28°C, comfortable conditions
   * Nice, comfortable weather
   */
  pleasant: {
    messages: [
      "Beautiful day outside! 🌤️",
      "Lovely {temp}° weather! 🌸",
      "What a pleasant day for plants!",
      "Nature is feeling generous today! 🌺",
      "Just right - Goldilocks weather! 🐻",
      "Prime plant parent weather! 🌿",
      "The perfect balance! ⚖️",
    ],
    advice: [
      "Perfect conditions for most houseplants",
      "Consider opening windows for fresh air circulation",
      "Great weather for all your indoor plants",
      "Good day for rotating plants for even growth",
      "Ideal time for plant inspections and care",
      "Your plants should be happy in these conditions!",
    ],
    emoji: "🌤️",
    gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    animation: "sunny" as const,
  },

  /**
   * COOL
   * Triggers: 10-20°C, moderate conditions
   * Cool but not cold
   */
  cool: {
    messages: [
      "Cool {temp}° day! 🍃",
      "Crisp and refreshing outside!",
      "Perfect sweater weather! 🍂",
      "Cool and comfortable! 🌬️",
      "Autumn vibes! 🍁",
      "Refreshingly cool at {temp}°!",
      "Comfortable conditions all around! 😌",
    ],
    advice: [
      "Most indoor plants enjoy these moderate temperatures",
      "Good day to check plant placement and lighting",
      "Plants may need less frequent watering",
      "Perfect time to assess seasonal care changes",
      "Great temperature for most houseplants",
      "Consider opening windows for air circulation",
    ],
    emoji: "🍃",
    gradient: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
    animation: "cloudy" as const,
  },

  /**
   * FAIR / DEFAULT
   * Triggers: Normal, unremarkable conditions
   * Standard weather day
   */
  fair: {
    messages: [
      "Another day, another opportunity to grow! 🌱",
      "Your plants are counting on you today!",
      "Steady as she goes! ⚓",
      "Normal conditions for plant care! 🪴",
      "Keep calm and water on! 💚",
      "Just another beautiful day with plants! 🌿",
      "Standard care routine today! ✅",
    ],
    advice: [
      "Stick to your regular watering schedule",
      "Good day for routine plant maintenance",
      "Check in on your plant buddies",
      "Keep up the great plant parenting!",
      "Perfect time for leaf cleaning",
      "Consider checking for pests today",
    ],
    emoji: "🌱",
    gradient: "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)",
    animation: "cloudy" as const,
  },

  /**
   * SPECIAL EVENT MESSAGES
   * Shown in addition to main message for extreme conditions
   */
  specialEvents: {
    extremeHeat: {
      threshold: 38, // °C
      message: "🔥 Extreme heat alert! AC may dry indoor air - check plant moisture levels.",
    },
    freeze: {
      threshold: 0, // °C
      message: "❄️ Freeze warning! Keep plants away from cold windows and drafts.",
    },
    perfectStorm: {
      // Shown when conditions are absolutely ideal
      message: "🌟 Perfect plant weather detected! This is as good as it gets!",
    },
    heavyRain: {
      threshold: 80, // % probability
      message: "☔ Heavy rain means high humidity - great for tropical houseplants!",
    },
    veryDry: {
      threshold: 20, // % humidity
      message: "🏜️ Very dry air today! Indoor plants may appreciate extra humidity or misting.",
    },
    veryHumid: {
      threshold: 85, // % humidity
      message: "💧 Very humid today! Perfect conditions for ferns and tropical plants.",
    },
  },

  /**
   * TIME OF DAY GREETINGS
   * Optional greetings based on time of day
   */
  timeOfDay: {
    earlyMorning: {
      hours: [0, 1, 2, 3, 4, 5] as number[],
      message: "Early bird plant parent! 🌅",
    },
    morning: {
      hours: [6, 7, 8, 9, 10, 11] as number[],
      message: "Good morning, plant parent! ☀️",
    },
    afternoon: {
      hours: [12, 13, 14, 15, 16] as number[],
      message: "Good afternoon! 🌤️",
    },
    evening: {
      hours: [17, 18, 19, 20] as number[],
      message: "Good evening! 🌇",
    },
    lateNight: {
      hours: [21, 22, 23] as number[],
      message: "Late night plant check? 🌙",
    },
  },
} as const;

/**
 * Helper function to replace placeholders in messages
 */
export function formatWeatherMessage(
  message: string,
  data: {
    temp?: number;
    rainProb?: number;
    humidity?: number;
  },
  temperatureUnit: 'F' | 'C' = 'F'
): string {
  let formattedTemp = '';
  if (data.temp !== undefined) {
    if (temperatureUnit === 'F') {
      // Convert Celsius to Fahrenheit
      const tempF = Math.round((data.temp * 9) / 5 + 32);
      formattedTemp = tempF.toString();
    } else {
      // Keep as Celsius
      formattedTemp = Math.round(data.temp).toString();
    }
  }

  return message
    .replace('{temp}', formattedTemp)
    .replace('{rainProb}', data.rainProb ? data.rainProb.toString() : '')
    .replace('{humidity}', data.humidity ? data.humidity.toString() : '');
}

/**
 * Helper function to get random message from array
 */
export function getRandomMessage(messages: readonly string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

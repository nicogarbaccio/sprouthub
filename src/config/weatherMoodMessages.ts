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
      "Great day for checking on outdoor plants",
      "Perfect time for propagation or repotting",
      "Your plants should be thriving in these conditions",
      "Consider moving indoor plants near windows today",
      "Excellent day for plant maintenance tasks",
      "Good time to fertilize if it's been a while",
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
      "Outdoor plants may need extra watering today",
      "Move sensitive plants to shade if possible",
      "Check soil moisture more frequently today",
      "Perfect weather for heat-loving plants!",
      "Consider watering in early morning or evening",
      "Watch for signs of heat stress in plants",
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
      "{rainProb}% chance of rain! ☔",
      "Nature's watering the garden today! 🌧️",
      "Rainy day vibes! ☁️💧",
      "The clouds are doing your job today!",
      "Free watering service courtesy of Mother Nature!",
      "Pitter-patter plant party! 🌧️",
      "Sky sprinklers activated! ☔",
      "Rain rain, plants say 'yay'! 💧",
    ],
    advice: [
      "Outdoor plants won't need watering today",
      "Great day to check on indoor plant moisture",
      "Perfect cozy day for plant maintenance inside",
      "Let nature handle the outdoor watering!",
      "Good time to clean plant leaves indoors",
      "Watch for overwatering signs in covered areas",
    ],
    emoji: "🌧️",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    animation: "rainy" as const,
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
      "Bundle up - it's cold out there!",
      "Frosty weather detected! ⛄",
      "Time for hot cocoa and plant care! ☕",
      "Cold snap alert! {temp}°",
      "Chilly day, cozy plant check! 🧣",
    ],
    advice: [
      "Bring sensitive outdoor plants inside",
      "Most plants need less water in cold weather",
      "Check for drafts near your indoor plants",
      "Perfect weather for hardy winter plants",
      "Move plants away from cold windows at night",
      "Reduce watering frequency during cold spells",
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
      "Great weather for all your plants",
      "Consider giving your plants some fresh air",
      "Perfect conditions for most houseplants",
      "Your plants should be happy today!",
      "Good day for rotating plants for even growth",
      "Ideal time for plant inspections",
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
      "Cool breeze day! 🌬️",
      "Autumn vibes! 🍁",
      "Refreshingly cool at {temp}°!",
      "Comfortable conditions all around! 😌",
    ],
    advice: [
      "Most plants enjoy these moderate temperatures",
      "Good day to check plant placement",
      "Plants may need less frequent watering",
      "Perfect time to assess seasonal changes",
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
      message: "🔥 Extreme heat alert! Keep plants hydrated and in shade if possible.",
    },
    freeze: {
      threshold: 0, // °C
      message: "❄️ Freeze warning! Protect sensitive plants immediately.",
    },
    perfectStorm: {
      // Shown when conditions are absolutely ideal
      message: "🌟 Perfect plant weather detected! This is as good as it gets!",
    },
    heavyRain: {
      threshold: 80, // % probability
      message: "☔ Heavy rain expected! Outdoor plants are getting a good soak.",
    },
    veryDry: {
      threshold: 20, // % humidity
      message: "🏜️ Very dry air today! Indoor plants may appreciate extra humidity.",
    },
    veryHumid: {
      threshold: 85, // % humidity
      message: "💧 Very humid today! Watch for signs of overwatering or mold.",
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

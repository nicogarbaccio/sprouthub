/**
 * Mock plant data utilities for Playwright tests
 * This provides consistent mock data for watering schedule tests
 */

export interface MockPlant {
  id: string;
  nickname: string;
  plant_type: string;
  image?: string;
  room?: string;
  suggested_watering_days: number;
  latest_watering?: string;
  days_since_watering?: number;
  is_outdoor_plant?: boolean;
  household_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  // Postponement fields
  postponement_date?: string;
  postponement_notes?: string;
  last_postponement_date?: string;
  postponement_count?: number;
  // Additional fields from plants_with_watering_info view
  last_watered_at?: string;
  watering_frequency?: number;
}

export const MOCK_CURRENT_DATE = '2025-09-10T12:00:00Z'; // September 10th, 2025 (time irrelevant for calendar-based watering logic)

// Mock weather data for seasonal testing
export interface MockWeatherData {
  current_temp_celsius: number;
  current_humidity_percent: number;
  daylight_hours: number;
  upcoming_rain_probability: number;
  season: string;
  location: {
    latitude: number;
    longitude: number;
    city: string;
  };
}

export const mockWeatherData = {
  // Spring weather conditions
  springWeather: {
    current_temp_celsius: 18,
    current_humidity_percent: 60,
    daylight_hours: 13,
    upcoming_rain_probability: 30,
    season: 'spring',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York'
    }
  } as MockWeatherData,

  // Summer weather conditions
  summerWeather: {
    current_temp_celsius: 28,
    current_humidity_percent: 75,
    daylight_hours: 15,
    upcoming_rain_probability: 20,
    season: 'summer',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York'
    }
  } as MockWeatherData,

  // Fall weather conditions
  fallWeather: {
    current_temp_celsius: 15,
    current_humidity_percent: 55,
    daylight_hours: 11,
    upcoming_rain_probability: 40,
    season: 'fall',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York'
    }
  } as MockWeatherData,

  // Winter weather conditions
  winterWeather: {
    current_temp_celsius: 2,
    current_humidity_percent: 45,
    daylight_hours: 9,
    upcoming_rain_probability: 10,
    season: 'winter',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York'
    }
  } as MockWeatherData,

  // Extreme weather conditions for edge cases
  extremeHot: {
    current_temp_celsius: 35,
    current_humidity_percent: 30,
    daylight_hours: 16,
    upcoming_rain_probability: 5,
    season: 'summer',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York'
    }
  } as MockWeatherData,

  extremeCold: {
    current_temp_celsius: -5,
    current_humidity_percent: 40,
    daylight_hours: 8,
    upcoming_rain_probability: 15,
    season: 'winter',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York'
    }
  } as MockWeatherData
};

// Mock seasonal transition data
export interface MockSeasonalTransition {
  from_season: 'winter' | 'spring' | 'summer' | 'fall';
  to_season: 'winter' | 'spring' | 'summer' | 'fall';
  transition_date: Date;
  confidence: 'high' | 'medium' | 'low';
  triggering_factors: string[];
}

export const mockSeasonalTransitions = {
  winterToSpring: {
    from_season: 'winter',
    to_season: 'spring',
    transition_date: new Date('2025-03-20T12:00:00Z'),
    confidence: 'high',
    triggering_factors: [
      'Daylight hours exceeding 12 hours',
      'Temperature consistently above 15°C with rising trend',
      'Temperature above 10°C with warming trend'
    ]
  } as MockSeasonalTransition,

  springToSummer: {
    from_season: 'spring',
    to_season: 'summer',
    transition_date: new Date('2025-06-21T12:00:00Z'),
    confidence: 'high',
    triggering_factors: [
      'Temperature consistently above 24°C',
      'Daylight hours exceeding 14 hours',
      'No cold snaps below 18°C in past week'
    ]
  } as MockSeasonalTransition,

  summerToFall: {
    from_season: 'summer',
    to_season: 'fall',
    transition_date: new Date('2025-09-23T12:00:00Z'),
    confidence: 'high',
    triggering_factors: [
      'Daylight hours below 12 hours',
      'Temperature below 18°C with falling trend',
      'Temperature dropped 10°C from summer peak'
    ]
  } as MockSeasonalTransition,

  fallToWinter: {
    from_season: 'fall',
    to_season: 'winter',
    transition_date: new Date('2025-12-21T12:00:00Z'),
    confidence: 'high',
    triggering_factors: [
      'Temperature consistently below 10°C',
      'Daylight hours below 10 hours',
      'No warm days above 15°C in past week'
    ]
  } as MockSeasonalTransition,

  // Medium confidence transition for testing
  mediumConfidenceTransition: {
    from_season: 'summer',
    to_season: 'fall',
    transition_date: new Date('2025-09-10T12:00:00Z'),
    confidence: 'medium',
    triggering_factors: [
      'Daylight hours below 12 hours',
      'Temperature showing cooling trend'
    ]
  } as MockSeasonalTransition,

  // Low confidence transition for testing
  lowConfidenceTransition: {
    from_season: 'spring',
    to_season: 'summer',
    transition_date: new Date('2025-06-15T12:00:00Z'),
    confidence: 'low',
    triggering_factors: [
      'Temperature occasionally above 20°C'
    ]
  } as MockSeasonalTransition
};

/**
 * Creates mock plants for different test scenarios
 */
export const createMockPlants = {
  // Normal plants with different watering schedules
  normalPlants: (userId: string): MockPlant[] => [
    {
      id: 'test-monstera-1',
      nickname: 'Test Monstera',
      plant_type: 'Monstera deliciosa',
      suggested_watering_days: 7,
      latest_watering: '2025-09-08T12:00:00Z', // September 8th (2 calendar days ago)
      days_since_watering: 2,
      last_watered_at: '2025-09-08T10:00:00Z',
      watering_frequency: 7,
      postponement_date: undefined,
      postponement_notes: undefined,
      last_postponement_date: undefined,
      postponement_count: undefined,
      image: 'https://example.com/monstera.jpg',
      room: 'Living Room',
      is_outdoor_plant: false,
      household_id: undefined,
      user_id: userId,
      created_at: '2025-08-01T10:00:00Z',
      updated_at: '2025-09-08T10:00:00Z'
    },
    {
      id: 'test-snake-plant-1',
      nickname: 'Test Snake Plant',
      plant_type: 'Sansevieria trifasciata',
      suggested_watering_days: 14,
      latest_watering: '2025-09-03T12:00:00Z', // September 3rd (7 calendar days ago)
      days_since_watering: 7,
      last_watered_at: '2025-09-03T12:00:00Z',
      watering_frequency: 14,
      postponement_date: undefined,
      postponement_notes: undefined,
      last_postponement_date: undefined,
      postponement_count: undefined,
      image: 'https://example.com/snake-plant.jpg',
      room: 'Bedroom',
      is_outdoor_plant: false,
      household_id: undefined,
      user_id: userId,
      created_at: '2025-08-01T10:00:00Z',
      updated_at: '2025-09-03T10:00:00Z'
    },
    {
      id: 'test-overdue-plant-1',
      nickname: 'Test Overdue Plant',
      plant_type: 'Ficus lyrata',
      suggested_watering_days: 5,
      latest_watering: '2025-09-01T12:00:00Z', // September 1st (9 calendar days ago)
      days_since_watering: 9,
      last_watered_at: '2025-09-01T12:00:00Z',
      watering_frequency: 5,
      postponement_date: undefined,
      postponement_notes: undefined,
      last_postponement_date: undefined,
      postponement_count: undefined,
      image: 'https://example.com/fiddle-leaf.jpg',
      room: 'Office',
      is_outdoor_plant: false,
      household_id: undefined,
      user_id: userId,
      created_at: '2025-08-01T10:00:00Z',
      updated_at: '2025-09-01T10:00:00Z'
    }
  ],

  // Plant that's due tomorrow
  tomorrowPlant: (userId: string): MockPlant[] => [
    {
      id: 'test-tomorrow-plant-1',
      nickname: 'Tomorrow Plant',
      plant_type: 'Pothos',
      suggested_watering_days: 7,
      latest_watering: '2025-09-03T10:00:00Z', // 7 days ago (due tomorrow)
      days_since_watering: 7,
      last_watered_at: '2025-09-03T10:00:00Z',
      watering_frequency: 7,
      postponement_date: undefined,
      postponement_notes: undefined,
      last_postponement_date: undefined,
      postponement_count: undefined,
      image: 'https://example.com/pothos.jpg',
      room: 'Kitchen',
      is_outdoor_plant: false,
      household_id: undefined,
      user_id: userId,
      created_at: '2025-08-01T10:00:00Z',
      updated_at: '2025-09-03T10:00:00Z'
    }
  ],

  // Plant that's due today
  todayPlant: (userId: string): MockPlant[] => [
    {
      id: 'test-today-plant-1',
      nickname: 'Today Plant',
      plant_type: 'Spider Plant',
      suggested_watering_days: 7,
      latest_watering: '2025-09-03T10:00:00Z', // 7 days ago (due today)
      days_since_watering: 7,
      last_watered_at: '2025-09-03T10:00:00Z',
      watering_frequency: 7,
      postponement_date: undefined,
      postponement_notes: undefined,
      last_postponement_date: undefined,
      postponement_count: undefined,
      image: 'https://example.com/spider-plant.jpg',
      room: 'Bathroom',
      is_outdoor_plant: false,
      household_id: undefined,
      user_id: userId,
      created_at: '2025-08-01T10:00:00Z',
      updated_at: '2025-09-03T10:00:00Z'
    }
  ],

  // Plant with postponement
  postponedPlant: (userId: string): MockPlant[] => [
    {
      id: 'test-postponed-plant-1',
      nickname: 'Test Postponed Plant',
      plant_type: 'Rubber Tree',
      suggested_watering_days: 7,
      latest_watering: '2025-09-08T10:00:00Z', // 2 days ago
      days_since_watering: 2,
      last_watered_at: '2025-09-08T10:00:00Z',
      watering_frequency: 7,
      postponement_date: '2025-09-13T00:00:00Z', // Postponed to September 13th (3 days from mock current date)
      postponement_notes: 'Going out of town',
      last_postponement_date: '2025-09-10T14:00:00Z',
      postponement_count: 1,
      image: 'https://example.com/rubber-tree.jpg',
      room: 'Living Room',
      is_outdoor_plant: false,
      household_id: undefined,
      user_id: userId,
      created_at: '2025-08-01T10:00:00Z',
      updated_at: '2025-09-10T14:00:00Z'
    }
  ],

  // Plant with no watering history
  newPlant: (userId: string): MockPlant[] => [
    {
      id: 'test-new-plant-1',
      nickname: 'Test New Plant',
      plant_type: 'New Pothos',
      suggested_watering_days: 7,
      latest_watering: undefined,
      days_since_watering: undefined,
      last_watered_at: undefined,
      watering_frequency: 7,
      postponement_date: undefined,
      postponement_notes: undefined,
      last_postponement_date: undefined,
      postponement_count: undefined,
      image: 'https://example.com/pothos.jpg',
      room: 'Kitchen',
      is_outdoor_plant: false,
      household_id: undefined,
      user_id: userId,
      created_at: '2025-09-10T10:00:00Z',
      updated_at: '2025-09-10T10:00:00Z'
    }
  ],



  // Long schedule plant (for cactus-like plants with 30-day schedules)
  longSchedulePlant: (userId: string): MockPlant[] => [
    {
      id: 'test-long-schedule-plant-1',
      nickname: 'Monthly Cactus',
      plant_type: 'Barrel Cactus',
      suggested_watering_days: 30,
      latest_watering: '2025-08-25T10:00:00Z', // 16 days ago
      days_since_watering: 16,
      last_watered_at: '2025-08-25T10:00:00Z',
      watering_frequency: 30,
      postponement_date: undefined,
      postponement_notes: undefined,
      last_postponement_date: undefined,
      postponement_count: undefined,
      image: 'https://example.com/cactus.jpg',
      room: 'Office',
      is_outdoor_plant: false,
      household_id: undefined,
      user_id: userId,
      created_at: '2025-08-01T10:00:00Z',
      updated_at: '2025-08-25T10:00:00Z'
    }
  ],

  // Very overdue plant (30+ days overdue)
  veryOverduePlant: (userId: string): MockPlant[] => [
    {
      id: 'test-very-overdue-plant-1',
      nickname: 'Neglected Plant',
      plant_type: 'Peace Lily',
      suggested_watering_days: 7,
      latest_watering: '2025-08-05T10:00:00Z', // 36 days ago
      days_since_watering: 36,
      last_watered_at: '2025-08-05T10:00:00Z',
      watering_frequency: 7,
      postponement_date: undefined,
      postponement_notes: undefined,
      last_postponement_date: undefined,
      postponement_count: undefined,
      image: 'https://example.com/peace-lily.jpg',
      room: 'Forgotten Corner',
      is_outdoor_plant: false,
      household_id: undefined,
      user_id: userId,
      created_at: '2025-08-01T10:00:00Z',
      updated_at: '2025-08-05T10:00:00Z'
    }
  ],

  // Just watered plant (0 days since watering)
  justWateredPlant: (userId: string): MockPlant[] => [
    {
      id: 'test-just-watered-plant-1',
      nickname: 'Just Watered Plant',
      plant_type: 'Pothos',
      suggested_watering_days: 7,
      latest_watering: '2025-09-10T14:00:00Z', // Just now (same as mock current date)
      days_since_watering: 0,
      last_watered_at: '2025-09-10T14:00:00Z',
      watering_frequency: 7,
      postponement_date: undefined,
      postponement_notes: undefined,
      last_postponement_date: undefined,
      postponement_count: undefined,
      image: 'https://example.com/pothos.jpg',
      room: 'Kitchen',
      is_outdoor_plant: false,
      household_id: undefined,
      user_id: userId,
      created_at: '2025-08-01T10:00:00Z',
      updated_at: '2025-09-10T14:00:00Z'
    }
  ],

  // Plants with specific watering patterns for pattern detection tests
  
  // Plant with consistent early watering pattern (watered 2 days early each time)
  earlyWateringPatternPlant: (userId: string): MockPlant[] => [
    {
      id: 'test-early-pattern-plant-1',
      nickname: 'Early Pattern Plant',
      plant_type: 'Monstera deliciosa',
      suggested_watering_days: 7,
      latest_watering: '2025-09-08T10:00:00Z', // 2 days ago
      days_since_watering: 2,
      last_watered_at: '2025-09-08T10:00:00Z',
      watering_frequency: 7,
      postponement_date: undefined,
      postponement_notes: undefined,
      last_postponement_date: undefined,
      postponement_count: undefined,
      image: 'https://example.com/monstera.jpg',
      room: 'Living Room',
      is_outdoor_plant: false,
      household_id: undefined,
      user_id: userId,
      created_at: '2025-08-01T10:00:00Z',
      updated_at: '2025-09-08T10:00:00Z'
    }
  ],

  // Plant with consistent late watering pattern (watered 2 days late each time)  
  lateWateringPatternPlant: (userId: string): MockPlant[] => [
    {
      id: 'test-late-pattern-plant-1',
      nickname: 'Late Pattern Plant',
      plant_type: 'Snake Plant',
      suggested_watering_days: 7,
      latest_watering: '2025-09-01T10:00:00Z', // 9 days ago (2 days late from 7-day schedule)
      days_since_watering: 9,
      last_watered_at: '2025-09-01T10:00:00Z',
      watering_frequency: 7,
      postponement_date: undefined,
      postponement_notes: undefined,
      last_postponement_date: undefined,
      postponement_count: undefined,
      image: 'https://example.com/snake-plant.jpg',
      room: 'Bedroom',
      is_outdoor_plant: false,
      household_id: undefined,
      user_id: userId,
      created_at: '2025-08-01T10:00:00Z',
      updated_at: '2025-09-01T10:00:00Z'
    }
  ],

  // Plant with irregular watering pattern (very inconsistent timing)
  irregularWateringPatternPlant: (userId: string): MockPlant[] => [
    {
      id: 'test-irregular-pattern-plant-1',
      nickname: 'Irregular Pattern Plant',
      plant_type: 'Peace Lily',
      suggested_watering_days: 7,
      latest_watering: '2025-09-07T10:00:00Z', // 3 days ago
      days_since_watering: 3,
      last_watered_at: '2025-09-07T10:00:00Z',
      watering_frequency: 7,
      postponement_date: undefined,
      postponement_notes: undefined,
      last_postponement_date: undefined,
      postponement_count: undefined,
      image: 'https://example.com/peace-lily.jpg',
      room: 'Office',
      is_outdoor_plant: false,
      household_id: undefined,
      user_id: userId,
      created_at: '2025-08-01T10:00:00Z',
      updated_at: '2025-09-07T10:00:00Z'
    }
  ],

  // Plant with consistent watering pattern (exactly on schedule)
  consistentWateringPatternPlant: (userId: string): MockPlant[] => [
    {
      id: 'test-consistent-pattern-plant-1',
      nickname: 'Consistent Pattern Plant',
      plant_type: 'Rubber Tree',
      suggested_watering_days: 7,
      latest_watering: '2025-09-03T10:00:00Z', // Exactly 7 days ago
      days_since_watering: 7,
      last_watered_at: '2025-09-03T10:00:00Z',
      watering_frequency: 7,
      postponement_date: undefined,
      postponement_notes: undefined,
      last_postponement_date: undefined,
      postponement_count: undefined,
      image: 'https://example.com/rubber-tree.jpg',
      room: 'Hallway',
      is_outdoor_plant: false,
      household_id: undefined,
      user_id: userId,
      created_at: '2025-08-01T10:00:00Z',
      updated_at: '2025-09-03T10:00:00Z'
    }
  ],

  // Plant with insufficient data for pattern analysis (new plant with minimal history)
  insufficientDataPlant: (userId: string): MockPlant[] => [
    {
      id: 'test-insufficient-data-plant-1',
      nickname: 'Insufficient Data Plant',
      plant_type: 'Fiddle Leaf Fig',
      suggested_watering_days: 7,
      latest_watering: '2025-09-08T10:00:00Z', // Only one watering
      days_since_watering: 2,
      last_watered_at: '2025-09-08T10:00:00Z',
      watering_frequency: 7,
      postponement_date: undefined,
      postponement_notes: undefined,
      last_postponement_date: undefined,
      postponement_count: undefined,
      image: 'https://example.com/fiddle-leaf.jpg',
      room: 'Living Room',
      is_outdoor_plant: false,
      household_id: undefined,
      user_id: userId,
      created_at: '2025-09-05T10:00:00Z', // Recently created
      updated_at: '2025-09-08T10:00:00Z'
    }
  ],

  // Expired postponement plant (postponed to a date that's already passed)
  expiredPostponementPlant: (userId: string): MockPlant[] => [
    {
      id: 'test-expired-postponement-plant-1',
      nickname: 'Expired Postponement Plant',
      plant_type: 'Snake Plant',
      suggested_watering_days: 7,
      latest_watering: '2025-09-01T10:00:00Z', // 9 days ago
      days_since_watering: 9,
      last_watered_at: '2025-09-01T10:00:00Z',
      watering_frequency: 7,
      postponement_date: '2025-09-08T00:00:00Z', // Postponed to September 8th (2 days ago)
      postponement_notes: 'Trip ended early',
      last_postponement_date: '2025-09-06T10:00:00Z',
      postponement_count: 1,
      image: 'https://example.com/snake-plant.jpg',
      room: 'Bedroom',
      is_outdoor_plant: false,
      household_id: undefined,
      user_id: userId,
      created_at: '2025-08-01T10:00:00Z',
      updated_at: '2025-09-06T10:00:00Z'
    }
  ],

  // Seasonal mock plants for testing seasonal review system

  // Outdoor plants with different seasonal needs
  outdoorSeasonalPlants: (userId: string): MockPlant[] => [
    {
      id: 'test-outdoor-spring-plant-1',
      nickname: 'Spring Garden Plant',
      plant_type: 'Rose Bush',
      suggested_watering_days: 5,
      latest_watering: '2025-09-08T10:00:00Z', // 2 days ago
      days_since_watering: 2,
      last_watered_at: '2025-09-08T10:00:00Z',
      watering_frequency: 5,
      postponement_date: undefined,
      postponement_notes: undefined,
      last_postponement_date: undefined,
      postponement_count: undefined,
      image: 'https://example.com/rose.jpg',
      room: 'Garden',
      is_outdoor_plant: true,
      household_id: undefined,
      user_id: userId,
      created_at: '2025-03-01T10:00:00Z',
      updated_at: '2025-09-08T10:00:00Z'
    },
    {
      id: 'test-outdoor-summer-plant-1',
      nickname: 'Summer Patio Plant',
      plant_type: 'Tomato Plant',
      suggested_watering_days: 3,
      latest_watering: '2025-09-09T10:00:00Z', // 1 day ago
      days_since_watering: 1,
      last_watered_at: '2025-09-09T10:00:00Z',
      watering_frequency: 3,
      postponement_date: undefined,
      postponement_notes: undefined,
      last_postponement_date: undefined,
      postponement_count: undefined,
      image: 'https://example.com/tomato.jpg',
      room: 'Patio',
      is_outdoor_plant: true,
      household_id: undefined,
      user_id: userId,
      created_at: '2025-05-01T10:00:00Z',
      updated_at: '2025-09-09T10:00:00Z'
    }
  ],

  // Indoor plants with minimal seasonal needs
  indoorSeasonalPlants: (userId: string): MockPlant[] => [
    {
      id: 'test-indoor-seasonal-plant-1',
      nickname: 'Consistent Indoor Plant',
      plant_type: 'Snake Plant',
      suggested_watering_days: 14,
      latest_watering: '2025-09-03T10:00:00Z', // 7 days ago
      days_since_watering: 7,
      last_watered_at: '2025-09-03T10:00:00Z',
      watering_frequency: 14,
      postponement_date: undefined,
      postponement_notes: undefined,
      last_postponement_date: undefined,
      postponement_count: undefined,
      image: 'https://example.com/snake-plant.jpg',
      room: 'Living Room',
      is_outdoor_plant: false,
      household_id: undefined,
      user_id: userId,
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-09-03T10:00:00Z'
    },
    {
      id: 'test-indoor-light-dependent-plant-1',
      nickname: 'Light-Loving Indoor Plant',
      plant_type: 'Fiddle Leaf Fig',
      suggested_watering_days: 10,
      latest_watering: '2025-09-05T10:00:00Z', // 5 days ago
      days_since_watering: 5,
      last_watered_at: '2025-09-05T10:00:00Z',
      watering_frequency: 10,
      postponement_date: undefined,
      postponement_notes: undefined,
      last_postponement_date: undefined,
      postponement_count: undefined,
      image: 'https://example.com/fiddle-leaf.jpg',
      room: 'Living Room',
      is_outdoor_plant: false,
      household_id: undefined,
      user_id: userId,
      created_at: '2025-02-01T10:00:00Z',
      updated_at: '2025-09-05T10:00:00Z'
    }
  ],

  // Plants with historical seasonal data (for testing previous year functionality)
  plantsWithSeasonalHistory: (userId: string): MockPlant[] => [
    {
      id: 'test-historical-plant-1',
      nickname: 'Historical Seasonal Plant',
      plant_type: 'Monstera deliciosa',
      suggested_watering_days: 7,
      latest_watering: '2025-09-08T10:00:00Z', // 2 days ago
      days_since_watering: 2,
      last_watered_at: '2025-09-08T10:00:00Z',
      watering_frequency: 7,
      postponement_date: undefined,
      postponement_notes: undefined,
      last_postponement_date: undefined,
      postponement_count: undefined,
      image: 'https://example.com/monstera.jpg',
      room: 'Living Room',
      is_outdoor_plant: false,
      household_id: undefined,
      user_id: userId,
      created_at: '2024-01-01T10:00:00Z', // Created last year
      updated_at: '2025-09-08T10:00:00Z'
    }
  ],

  // Plants needing seasonal review
  plantsNeedingReview: (userId: string): MockPlant[] => [
    {
      id: 'test-review-needed-plant-1',
      nickname: 'Review Needed Plant',
      plant_type: 'Peace Lily',
      suggested_watering_days: 7,
      latest_watering: '2025-09-07T10:00:00Z', // 3 days ago
      days_since_watering: 3,
      last_watered_at: '2025-09-07T10:00:00Z',
      watering_frequency: 7,
      postponement_date: undefined,
      postponement_notes: undefined,
      last_postponement_date: undefined,
      postponement_count: undefined,
      image: 'https://example.com/peace-lily.jpg',
      room: 'Office',
      is_outdoor_plant: false,
      household_id: undefined,
      user_id: userId,
      created_at: '2025-06-01T10:00:00Z', // No last_schedule_review
      updated_at: '2025-09-07T10:00:00Z'
    },
    {
      id: 'test-review-needed-plant-2',
      nickname: 'Another Review Plant',
      plant_type: 'Rubber Tree',
      suggested_watering_days: 10,
      latest_watering: '2025-09-05T10:00:00Z', // 5 days ago
      days_since_watering: 5,
      last_watered_at: '2025-09-05T10:00:00Z',
      watering_frequency: 10,
      postponement_date: undefined,
      postponement_notes: undefined,
      last_postponement_date: undefined,
      postponement_count: undefined,
      image: 'https://example.com/rubber-tree.jpg',
      room: 'Living Room',
      is_outdoor_plant: false,
      household_id: undefined,
      user_id: userId,
      created_at: '2025-04-01T10:00:00Z',
      updated_at: '2025-09-05T10:00:00Z'
    }
  ]
};

/**
 * Sets up mock data for Supabase calls in Playwright tests
 * Enhanced for cross-browser reliability
 */
export async function setupMockPlantData(page: any, mockPlants: MockPlant[], options: { verbose?: boolean } = {}) {
  const { verbose = false } = options;
  
  // Enhanced client-side mocking with better error handling
  await page.addInitScript((plants: MockPlant[], verbose: boolean) => {
    // Store mock plants in window for access
    (window as any).__mockPlants = plants;
    (window as any).__mockDataActive = true;
    
    if (verbose) console.log('🔧 Mock data initialization script running', { plantsCount: plants.length });
    
    // Wait for Supabase to be available with timeout
    const waitForSupabase = () => {
      return new Promise((resolve) => {
        const checkSupabase = () => {
          if ((window as any).supabase) {
            resolve((window as any).supabase);
          } else {
            setTimeout(checkSupabase, 100);
          }
        };
        checkSupabase();
        // Timeout after 5 seconds
        setTimeout(() => resolve(null), 5000);
      });
    };
    
    // Override Supabase methods when available
    waitForSupabase().then((supabase) => {
      if (!supabase) {
        if (verbose) console.log('⚠️ Supabase not available for mocking');
        return;
      }
      
      const originalFrom = (supabase as any).from;
      if (originalFrom) {
        (supabase as any).from = function(tableName: string) {
          if (verbose) console.log('🔍 Supabase query for table:', tableName);
          
          if (tableName === 'plants_with_watering_info') {
            if (verbose) console.log('✅ Returning mock plants data');
            return {
              select: () => ({
                eq: () => ({
                  order: () => Promise.resolve({
                    data: plants,
                    error: null
                  })
                })
              })
            };
          }
          // For other tables, use original behavior
          return originalFrom.call(supabase, tableName);
        };
      }
      
      if (verbose) console.log('✅ Mock data setup completed');
    });
  }, mockPlants, verbose);

  // Enhanced HTTP route interception with better patterns
  const routePatterns = [
    '**/rest/v1/plants_with_watering_info*',
    '**/rest/v1/plants*',
    '**/supabase.co/rest/v1/plants*'
  ];
  
  for (const pattern of routePatterns) {
    await page.route(pattern, async (route: any) => {
      if (verbose) console.log(`🔄 HTTP intercept: ${route.request().url()}`);
      
      // Add CORS headers for browser compatibility
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
        },
        body: JSON.stringify(mockPlants)
      });
    });
  }

  // Enhanced GraphQL interception
  await page.route('**/graphql*', async (route: any) => {
    const requestBody = route.request().postData();
    if (requestBody && requestBody.includes('plants')) {
      if (verbose) console.log(`🔄 GraphQL plants intercept: ${route.request().url()}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        body: JSON.stringify({ data: { plants: mockPlants } })
      });
    } else {
      await route.continue();
    }
  });

  if (verbose) {
    console.log(`🌱 Mock data setup completed - ${mockPlants.length} plants`);
    console.log('📊 Plants:', mockPlants.map(p => `${p.nickname} (${p.plant_type})`).join(', '));
  }

  // Intercept plants_with_watering_info API calls
  await page.route('**/rest/v1/plants_with_watering_info*', async (route: any) => {
    const url = route.request().url();
    if (verbose) console.log(`🔄 Intercepting plants_with_watering_info request: ${url}`);
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
      },
      body: JSON.stringify(mockPlants)
    });
  });
  
  // Also intercept direct user_plants calls for individual plant lookups
  await page.route('**/rest/v1/user_plants*', async (route: any) => {
    const url = route.request().url();
    if (verbose) console.log(`🔄 Intercepting user_plants request: ${url}`);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
      },
      body: JSON.stringify(mockPlants)
    });
  });

  // Intercept watering_records API calls
  await page.route('**/rest/v1/watering_records*', async (route: any) => {
    const url = route.request().url();
    if (verbose) console.log(`🔄 Intercepting watering_records request: ${url}`);

    // Extract plant ID from URL if present
    const plantIdMatch = url.match(/user_plant_id=eq\.([^&]+)/);

    // Create watering records for each plant based on their latest_watering
    const wateringRecords = mockPlants
      .filter(plant => {
        // If a specific plant is requested, only return its records
        if (plantIdMatch) {
          return plant.id === plantIdMatch[1];
        }
        return true;
      })
      .filter(plant => plant.latest_watering) // Only plants with watering history
      .map(plant => ({
        id: `watering-${plant.id}-1`,
        user_plant_id: plant.id,
        watered_at: plant.latest_watering,
        created_at: plant.latest_watering,
        updated_at: plant.latest_watering
      }));

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
      },
      body: JSON.stringify(wateringRecords)
    });
  });
}

/**
 * Verify that mock data is working
 */
export async function verifyMockDataSetup(page: any): Promise<boolean> {
  return await page.evaluate(() => {
    return !!(window as any).__mockDataActive && !!(window as any).__mockPlants;
  });
}

/**
 * Sets up date mocking for consistent test results
 */
export async function setupMockDate(page: any, mockDate: string = MOCK_CURRENT_DATE) {
  await page.addInitScript((dateString: string) => {
    const mockDate = new Date(dateString);
    Date.now = () => mockDate.getTime();
    global.Date = class extends Date {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(mockDate.getTime());
        } else {
          // Handle different Date constructor overloads
          if (args.length === 1) {
            super(args[0]);
          } else if (args.length >= 2) {
            super(args[0], args[1], args[2] || 1, args[3] || 0, args[4] || 0, args[5] || 0, args[6] || 0);
          }
        }
      }
      static now() {
        return mockDate.getTime();
      }
    } as DateConstructor;
  }, mockDate);

  console.log(`📅 Mock current date set to: ${mockDate}`);
}


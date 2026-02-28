import type { UserPlant } from '@/hooks/useUserPlants';
import { differenceInDays, format, startOfWeek, startOfMonth, subDays, subMonths } from 'date-fns';

export interface WateringStats {
  totalWaterings: number;
  thisWeek: number;
  thisMonth: number;
  averagePerWeek: number;
  streak: number;
  longestStreak: number;
}

export interface PlantHealthStats {
  totalPlants: number;
  healthyPlants: number;
  needsAttention: number;
  overduePlants: number;
  onSchedule: number;
  overwateringRisk: number;
}

export interface WateringFrequency {
  date: string;
  count: number;
}

export interface PlantPerformance {
  plantId: string;
  plantName: string;
  plantType: string;
  totalWaterings: number;
  onTimeWaterings: number;
  lateWaterings: number;
  compliance: number; // Percentage of on-time waterings
  daysOwned: number;
}

export interface TimeDistribution {
  period: string;
  waterings: number;
}

/**
 * Calculate overall watering statistics
 */
export function calculateWateringStats(plants: UserPlant[]): WateringStats {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  let totalWaterings = 0;
  let thisWeek = 0;
  let thisMonth = 0;

  plants.forEach(plant => {
    if (plant.latest_watering) {
      totalWaterings++;

      const wateringDate = new Date(plant.latest_watering);
      if (wateringDate >= weekStart) thisWeek++;
      if (wateringDate >= monthStart) thisMonth++;
    }
  });

  // Calculate average waterings per week (simplified)
  const averagePerWeek = thisWeek > 0 ? thisWeek : totalWaterings / 4;

  // Calculate current streak (days with at least one watering)
  // This is simplified - in production you'd track actual watering history
  const streak = calculateCurrentStreak(plants);
  const longestStreak = streak; // Simplified

  return {
    totalWaterings,
    thisWeek,
    thisMonth,
    averagePerWeek: Math.round(averagePerWeek * 10) / 10,
    streak,
    longestStreak,
  };
}

/**
 * Calculate plant health statistics
 */
export function calculatePlantHealthStats(plants: UserPlant[]): PlantHealthStats {
  let healthyPlants = 0;
  let needsAttention = 0;
  let overduePlants = 0;
  let onSchedule = 0;
  let overwateringRisk = 0;

  plants.forEach(plant => {
    const daysSinceWatering = plant.days_since_watering || 0;
    const scheduleDays = plant.suggested_watering_days || 7;
    const daysUntilDue = scheduleDays - daysSinceWatering;

    // Overdue
    if (daysUntilDue < 0) {
      overduePlants++;
      needsAttention++;
    }
    // Due today or tomorrow
    else if (daysUntilDue <= 1) {
      needsAttention++;
    }
    // On schedule (2+ days until watering)
    else if (daysUntilDue >= 2) {
      onSchedule++;
      healthyPlants++;
    }

    // Check for overwatering risk (watered within 30% of schedule)
    if (daysSinceWatering < scheduleDays * 0.3) {
      overwateringRisk++;
    }
  });

  return {
    totalPlants: plants.length,
    healthyPlants,
    needsAttention,
    overduePlants,
    onSchedule,
    overwateringRisk,
  };
}

/**
 * Get watering frequency over the last 30 days
 */
export function getWateringFrequency(plants: UserPlant[], days: number = 30): WateringFrequency[] {
  const now = new Date();
  const frequency: Record<string, number> = {};

  // Initialize all dates with 0
  for (let i = 0; i < days; i++) {
    const date = subDays(now, i);
    frequency[format(date, 'yyyy-MM-dd')] = 0;
  }

  // Count waterings per day (simplified - uses latest_watering only)
  plants.forEach(plant => {
    if (plant.latest_watering) {
      const wateringDate = format(new Date(plant.latest_watering), 'yyyy-MM-dd');
      if (frequency.hasOwnProperty(wateringDate)) {
        frequency[wateringDate]++;
      }
    }
  });

  return Object.entries(frequency)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate plant performance metrics
 */
export function calculatePlantPerformance(plants: UserPlant[]): PlantPerformance[] {
  return plants.map(plant => {
    const daysOwned = plant.created_at
      ? differenceInDays(new Date(), new Date(plant.created_at))
      : 0;

    // Simplified metrics - in production you'd use actual watering history
    const totalWaterings = plant.latest_watering ? 1 : 0;
    const daysSinceWatering = plant.days_since_watering || 0;
    const scheduleDays = plant.suggested_watering_days || 7;
    const isOnTime = daysSinceWatering <= scheduleDays;

    const onTimeWaterings = isOnTime ? totalWaterings : 0;
    const lateWaterings = !isOnTime ? totalWaterings : 0;
    const compliance = totalWaterings > 0 ? (onTimeWaterings / totalWaterings) * 100 : 100;

    return {
      plantId: plant.id,
      plantName: plant.nickname,
      plantType: plant.plant_type,
      totalWaterings,
      onTimeWaterings,
      lateWaterings,
      compliance: Math.round(compliance),
      daysOwned,
    };
  }).sort((a, b) => b.compliance - a.compliance);
}

/**
 * Get time distribution of waterings (by day of week or month)
 */
export function getTimeDistribution(plants: UserPlant[], period: 'week' | 'month' = 'week'): TimeDistribution[] {
  const distribution: Record<string, number> = {};

  if (period === 'week') {
    // Initialize days of week
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(day => {
      distribution[day] = 0;
    });

    plants.forEach(plant => {
      if (plant.latest_watering) {
        const day = format(new Date(plant.latest_watering), 'EEEE');
        if (distribution.hasOwnProperty(day)) {
          distribution[day]++;
        }
      }
    });
  } else {
    // Last 6 months
    for (let i = 0; i < 6; i++) {
      const month = format(subMonths(new Date(), i), 'MMM yyyy');
      distribution[month] = 0;
    }

    plants.forEach(plant => {
      if (plant.latest_watering) {
        const month = format(new Date(plant.latest_watering), 'MMM yyyy');
        if (distribution.hasOwnProperty(month)) {
          distribution[month]++;
        }
      }
    });
  }

  return Object.entries(distribution).map(([period, waterings]) => ({
    period,
    waterings,
  }));
}

/**
 * Calculate current watering streak (consecutive days with waterings)
 */
function calculateCurrentStreak(plants: UserPlant[]): number {
  // Simplified - just check if any plant was watered in last 2 days
  const hasRecentWatering = plants.some(plant => {
    if (!plant.latest_watering) return false;
    const daysSince = differenceInDays(new Date(), new Date(plant.latest_watering));
    return daysSince <= 2;
  });

  return hasRecentWatering ? 1 : 0;
}

/**
 * Get summary insights based on analytics data
 */
export function getAnalyticsInsights(plants: UserPlant[]): string[] {
  const insights: string[] = [];
  const healthStats = calculatePlantHealthStats(plants);
  const wateringStats = calculateWateringStats(plants);

  // Health insights
  if (healthStats.overduePlants > 0) {
    insights.push(`${healthStats.overduePlants} plant${healthStats.overduePlants > 1 ? 's' : ''} overdue for watering`);
  }

  if (healthStats.overwateringRisk > 0) {
    insights.push(`${healthStats.overwateringRisk} plant${healthStats.overwateringRisk > 1 ? 's' : ''} at risk of overwatering`);
  }

  // Performance insights
  const compliance = healthStats.onSchedule / healthStats.totalPlants;
  if (compliance >= 0.8) {
    insights.push('Great job! Most plants are on schedule');
  } else if (compliance < 0.5) {
    insights.push('Many plants need attention - consider adjusting schedules');
  }

  // Activity insights
  if (wateringStats.thisWeek > wateringStats.averagePerWeek * 1.5) {
    insights.push('Watering activity is above average this week');
  }

  if (insights.length === 0) {
    insights.push('Your plants are doing well! Keep up the good work.');
  }

  return insights;
}

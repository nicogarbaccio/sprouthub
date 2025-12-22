import type { UserPlant } from '@/hooks/useUserPlants';
import type { PlantStatus, SortOption } from '@/components/SearchFilterBar';
import { calculateWateringSchedule } from './watering-schedule';

/**
 * Filter plants by search query (name or type)
 */
export function filterBySearch(plants: UserPlant[], query: string): UserPlant[] {
  if (!query.trim()) return plants;

  const lowerQuery = query.toLowerCase();
  return plants.filter(
    (plant) =>
      plant.nickname.toLowerCase().includes(lowerQuery) ||
      plant.plant_type.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Filter plants by status
 */
export function filterByStatus(plants: UserPlant[], status: PlantStatus): UserPlant[] {
  if (status === 'all') return plants;

  return plants.filter((plant) => {
    const { daysUntilWatering, isOverdue, hasUnknownWateringDate } =
      calculateWateringSchedule(plant);

    switch (status) {
      case 'overdue':
        return isOverdue;
      case 'due-today':
        return daysUntilWatering === 0 && !isOverdue;
      case 'needs-attention':
        return isOverdue || daysUntilWatering <= 1 || hasUnknownWateringDate;
      case 'on-schedule':
        return daysUntilWatering >= 2 && !hasUnknownWateringDate;
      default:
        return true;
    }
  });
}

/**
 * Filter plants by room
 */
export function filterByRoom(plants: UserPlant[], room: string): UserPlant[] {
  if (room === 'all') return plants;
  return plants.filter((plant) => plant.room === room);
}

/**
 * Sort plants by selected option
 */
export function sortPlants(plants: UserPlant[], sortBy: SortOption): UserPlant[] {
  const sorted = [...plants];

  switch (sortBy) {
    case 'name-asc':
      return sorted.sort((a, b) => a.nickname.localeCompare(b.nickname));

    case 'name-desc':
      return sorted.sort((a, b) => b.nickname.localeCompare(a.nickname));

    case 'last-watered':
      return sorted.sort((a, b) => {
        if (!a.latest_watering) return 1;
        if (!b.latest_watering) return -1;
        return new Date(b.latest_watering).getTime() - new Date(a.latest_watering).getTime();
      });

    case 'next-watering':
      return sorted.sort((a, b) => {
        const aSchedule = calculateWateringSchedule(a);
        const bSchedule = calculateWateringSchedule(b);
        return aSchedule.daysUntilWatering - bSchedule.daysUntilWatering;
      });

    case 'days-owned':
      return sorted.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

    default:
      return sorted;
  }
}

/**
 * Apply all filters and sorting to a plant list
 */
export function applyFiltersAndSort(
  plants: UserPlant[],
  filters: {
    searchQuery: string;
    status: PlantStatus;
    room: string;
    sortBy: SortOption;
  }
): UserPlant[] {
  let filtered = plants;

  // Apply filters
  filtered = filterBySearch(filtered, filters.searchQuery);
  filtered = filterByStatus(filtered, filters.status);
  filtered = filterByRoom(filtered, filters.room);

  // Apply sorting
  filtered = sortPlants(filtered, filters.sortBy);

  return filtered;
}

/**
 * Get unique rooms from plant list
 */
export function getUniqueRooms(plants: UserPlant[]): string[] {
  const rooms = plants
    .map((plant) => plant.room)
    .filter((room): room is string => !!room);

  return Array.from(new Set(rooms)).sort();
}

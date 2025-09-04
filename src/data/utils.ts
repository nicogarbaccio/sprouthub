
import { Plant } from './types';

export const getUniqueCategories = (plants: Plant[]) => {
 return Array.from(new Set(plants.map(plant => plant.category))).sort();
};

export const getUniqueCareLevels = (plants: Plant[]) => {
 return Array.from(new Set(plants.map(plant => plant.careLevel))).sort();
};

export const getUniqueLightRequirements = (plants: Plant[]) => {
 return Array.from(new Set(plants.map(plant => plant.lightRequirement))).sort();
};

export interface PlantData {
  name: string;
  botanicalName: string;
  image: string;
  wateringFrequency: string;
  suggestedWateringDays?: number;
  lightRequirement: string;
  careLevel: string;
  otherNames?: string[];
}

export interface AddPlantFormData {
  nickname: string;
  plant_type: string;
  image: string;
  room: string;
  watering_schedule_days: number;
  notes: string;
  is_outdoor_plant: boolean;
  household_id: string;
  alternative_names: string[];
}

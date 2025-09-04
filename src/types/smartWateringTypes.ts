import { WateringFactors } from '@/utils/smartWateringSchedule';

export interface UserWateringPreferences {
 id?: string;
 user_id: string;
 default_light_level: WateringFactors['lightLevel'];
 default_temperature: WateringFactors['temperature'];
 default_humidity: WateringFactors['humidity'];
 default_care_style: WateringFactors['careStyle'];
 default_soil_type: WateringFactors['soilType'];
 location?: string;
 created_at?: string;
 updated_at?: string;
}

export interface SmartWateringState {
 preferences: UserWateringPreferences | null;
 isLoading: boolean;
 hasPreferences: boolean;
}

export type { WateringFactors } from '@/utils/smartWateringSchedule'; 
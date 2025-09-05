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
 use_weather_data?: boolean;
 manual_location?: string;
 last_weather_update?: string;
 created_at?: string;
 updated_at?: string;
}

export interface SmartWateringState {
 preferences: UserWateringPreferences | null;
 isLoading: boolean;
 hasPreferences: boolean;
}

export type { WateringFactors } from '@/utils/smartWateringSchedule'; 
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserWateringPreferences } from '@/types/smartWateringTypes';
import { WateringFactors } from '@/utils/watering/smartSchedule';
import { hookLogger } from '@/utils/hookLogging';

const HOOK_NAME = 'useSmartWateringPreferences';

export const useSmartWateringPreferences = () => {
 const { user } = useAuth();
 const { toast } = useToast();
 const [preferences, setPreferences] = useState<UserWateringPreferences | null>(null);
 const [isLoading, setIsLoading] = useState(false);
 const [hasPreferences, setHasPreferences] = useState(false);

 // Ref to stabilize loadPreferences callback for event listener
 const loadPreferencesRef = useRef<() => Promise<void>>();

 // Load user preferences
 const loadPreferences = useCallback(async () => {
 if (!user) {
  setPreferences(null);
  setHasPreferences(false);
  return;
 }

 setIsLoading(true);
 try {
  const { data, error } = await supabase
    .from('user_watering_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
  // PGRST116 is "no rows returned" - not an actual error
  throw error;
  }

  if (data) {
  // Convert database format to our UserWateringPreferences format
  // Cast to any because Supabase types may not include all columns yet
  const dbData = data as unknown as UserWateringPreferences;
  const convertedPreferences: UserWateringPreferences = {
   id: dbData.id,
   user_id: dbData.user_id,
   default_light_level: dbData.default_light_level as 'low' | 'medium' | 'high',
   default_temperature: dbData.default_temperature as 'cool' | 'normal' | 'warm',
   default_humidity: dbData.default_humidity as 'dry' | 'normal' | 'humid',
   default_care_style: dbData.default_care_style as 'frequent' | 'balanced' | 'minimal',
   default_soil_type: dbData.default_soil_type as 'regular' | 'draining' | 'retaining',
   location: dbData.location,
   use_weather_data: dbData.use_weather_data,
   manual_location: dbData.manual_location,
   last_weather_update: dbData.last_weather_update,
   temperature_unit: dbData.temperature_unit as 'F' | 'C',
   created_at: dbData.created_at,
   updated_at: dbData.updated_at,
  };
  setPreferences(convertedPreferences);
  setHasPreferences(true);
  } else {
  setPreferences(null);
  setHasPreferences(false);
  }
 } catch (error) {
  hookLogger.error(HOOK_NAME, 'Error loading watering preferences:', error);
  setPreferences(null);
  setHasPreferences(false);
 } finally {
  setIsLoading(false);
 }
 }, [user]);

 // Update ref when loadPreferences changes
 useEffect(() => {
  loadPreferencesRef.current = loadPreferences;
 }, [loadPreferences]);

 // Save or update preferences
 const savePreferences = async (newPreferences: Partial<UserWateringPreferences>) => {
 if (!user) return false;

 setIsLoading(true);
 try {
  const preferenceData = {
  user_id: user.id,
  default_light_level: newPreferences.default_light_level || preferences?.default_light_level || 'medium',
  default_temperature: newPreferences.default_temperature || preferences?.default_temperature || 'normal',
  default_humidity: newPreferences.default_humidity || preferences?.default_humidity || 'normal',
  default_care_style: newPreferences.default_care_style || preferences?.default_care_style || 'balanced',
  default_soil_type: newPreferences.default_soil_type || preferences?.default_soil_type || 'regular',
  location: newPreferences.location || null,
  use_weather_data: newPreferences.use_weather_data ?? preferences?.use_weather_data ?? false,
  manual_location: newPreferences.manual_location || null,
  last_weather_update: newPreferences.last_weather_update || null,
  temperature_unit: newPreferences.temperature_unit || preferences?.temperature_unit || 'F',
  updated_at: new Date().toISOString(),
  };

  if (hasPreferences && preferences?.id) {
  // Update existing preferences
  const { data, error } = await supabase
   .from('user_watering_preferences')
   .update(preferenceData)
   .eq('id', preferences.id)
   .select()
   .single();

  if (error) throw error;

  // Convert database format to our UserWateringPreferences format
  // Cast to any because Supabase types may not include all columns yet
  const dbData = data as unknown as UserWateringPreferences;
  const convertedPreferences: UserWateringPreferences = {
   id: dbData.id,
   user_id: dbData.user_id,
   default_light_level: dbData.default_light_level as 'low' | 'medium' | 'high',
   default_temperature: dbData.default_temperature as 'cool' | 'normal' | 'warm',
   default_humidity: dbData.default_humidity as 'dry' | 'normal' | 'humid',
   default_care_style: dbData.default_care_style as 'frequent' | 'balanced' | 'minimal',
   default_soil_type: dbData.default_soil_type as 'regular' | 'draining' | 'retaining',
   location: dbData.location,
   use_weather_data: dbData.use_weather_data,
   manual_location: dbData.manual_location,
   last_weather_update: dbData.last_weather_update,
   temperature_unit: dbData.temperature_unit as 'F' | 'C',
   created_at: dbData.created_at,
   updated_at: dbData.updated_at,
  };
  setPreferences(convertedPreferences);
  } else {
  // Create new preferences
  const { data, error } = await supabase
   .from('user_watering_preferences')
   .insert({
   ...preferenceData,
   created_at: new Date().toISOString(),
   })
   .select()
   .single();

  if (error) throw error;

  // Convert database format to our UserWateringPreferences format
  // Cast to any because Supabase types may not include all columns yet
  const dbData = data as unknown as UserWateringPreferences;
  const convertedPreferences: UserWateringPreferences = {
   id: dbData.id,
   user_id: dbData.user_id,
   default_light_level: dbData.default_light_level as 'low' | 'medium' | 'high',
   default_temperature: dbData.default_temperature as 'cool' | 'normal' | 'warm',
   default_humidity: dbData.default_humidity as 'dry' | 'normal' | 'humid',
   default_care_style: dbData.default_care_style as 'frequent' | 'balanced' | 'minimal',
   default_soil_type: dbData.default_soil_type as 'regular' | 'draining' | 'retaining',
   location: dbData.location,
   use_weather_data: dbData.use_weather_data,
   manual_location: dbData.manual_location,
   last_weather_update: dbData.last_weather_update,
   temperature_unit: dbData.temperature_unit as 'F' | 'C',
   created_at: dbData.created_at,
   updated_at: dbData.updated_at,
  };
  setPreferences(convertedPreferences);
  setHasPreferences(true);
  }

  // Broadcast update event so other components can reload
  window.dispatchEvent(new CustomEvent('weatherPreferencesUpdated'));

  return true;
 } catch (error) {
  hookLogger.error(HOOK_NAME, 'Error saving watering preferences:', error);
  toast({
  title: 'Error',
  description: 'Failed to save watering preferences. Please try again.',
  variant: 'destructive',
  });
  return false;
 } finally {
  setIsLoading(false);
 }
 };

 // Get default factors for wizard, using saved preferences if available
 const getDefaultFactors = (): Partial<WateringFactors> => {
 if (!preferences) {
  return {
  lightLevel: 'medium',
  temperature: 'normal',
  humidity: 'normal',
  careStyle: 'balanced',
  soilType: 'regular',
  };
 }

 return {
  lightLevel: preferences.default_light_level,
  temperature: preferences.default_temperature,
  humidity: preferences.default_humidity,
  careStyle: preferences.default_care_style,
  soilType: preferences.default_soil_type,
 };
 };

 // Clear preferences
 const clearPreferences = async () => {
 if (!user || !preferences?.id) return false;

 setIsLoading(true);
 try {
  const { error } = await supabase
  .from('user_watering_preferences')
  .delete()
  .eq('id', preferences.id);

  if (error) throw error;

  setPreferences(null);
  setHasPreferences(false);

  toast({
  title: 'Preferences Cleared',
  description: 'Your smart watering preferences have been cleared.',
  });

  return true;
 } catch (error) {
  hookLogger.error(HOOK_NAME, 'Error clearing watering preferences:', error);
  toast({
  title: 'Error',
  description: 'Failed to clear watering preferences.',
  variant: 'destructive',
  });
  return false;
 } finally {
  setIsLoading(false);
 }
 };

 // Load preferences when user changes
 useEffect(() => {
 loadPreferences();
 }, [loadPreferences]);

 // Listen for preference updates via custom events
 useEffect(() => {
 const handlePreferencesUpdate = () => {
  hookLogger.info(HOOK_NAME, 'Preferences update event received, reloading...');
  loadPreferencesRef.current?.();
 };

 // Listen for custom event
 window.addEventListener('weatherPreferencesUpdated', handlePreferencesUpdate);

 return () => {
  window.removeEventListener('weatherPreferencesUpdated', handlePreferencesUpdate);
 };
 }, []); // Empty dependency - listener persists, callbacks accessed via ref

 return {
 preferences,
 isLoading,
 hasPreferences,
 loadPreferences,
 savePreferences,
 getDefaultFactors,
 clearPreferences,
 };
}; 
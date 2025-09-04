import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserWateringPreferences } from '@/types/smartWateringTypes';
import { WateringFactors } from '@/utils/smartWateringSchedule';

export const useSmartWateringPreferences = () => {
 const { user } = useAuth();
 const { toast } = useToast();
 const [preferences, setPreferences] = useState<UserWateringPreferences | null>(null);
 const [isLoading, setIsLoading] = useState(false);
 const [hasPreferences, setHasPreferences] = useState(false);

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
    .single();

   if (error && error.code !== 'PGRST116') {
    // PGRST116 is "no rows returned" - not an actual error
    throw error;
   }

   if (data) {
    // Convert database format to our UserWateringPreferences format
    const convertedPreferences: UserWateringPreferences = {
     id: data.id,
     user_id: data.user_id,
     default_light_level: data.default_light_level as 'low' | 'medium' | 'high',
     default_temperature: data.default_temperature as 'cool' | 'normal' | 'warm',
     default_humidity: data.default_humidity as 'dry' | 'normal' | 'humid',
     default_care_style: data.default_care_style as 'frequent' | 'balanced' | 'minimal',
     default_soil_type: data.default_soil_type as 'regular' | 'draining' | 'retaining',
     location: data.location,
     created_at: data.created_at,
     updated_at: data.updated_at,
    };
    setPreferences(convertedPreferences);
    setHasPreferences(true);
   } else {
    setPreferences(null);
    setHasPreferences(false);
   }
  } catch (error) {
   console.error('Error loading watering preferences:', error);
   setPreferences(null);
   setHasPreferences(false);
  } finally {
   setIsLoading(false);
  }
 }, [user]);

 // Save or update preferences
 const savePreferences = async (newPreferences: Partial<UserWateringPreferences>) => {
  if (!user) return false;

  setIsLoading(true);
  try {
   const preferenceData = {
    user_id: user.id,
    default_light_level: newPreferences.default_light_level,
    default_temperature: newPreferences.default_temperature,
    default_humidity: newPreferences.default_humidity,
    default_care_style: newPreferences.default_care_style,
    default_soil_type: newPreferences.default_soil_type,
    location: newPreferences.location || null,
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
    const convertedPreferences: UserWateringPreferences = {
     id: data.id,
     user_id: data.user_id,
     default_light_level: data.default_light_level as 'low' | 'medium' | 'high',
     default_temperature: data.default_temperature as 'cool' | 'normal' | 'warm',
     default_humidity: data.default_humidity as 'dry' | 'normal' | 'humid',
     default_care_style: data.default_care_style as 'frequent' | 'balanced' | 'minimal',
     default_soil_type: data.default_soil_type as 'regular' | 'draining' | 'retaining',
     location: data.location,
     created_at: data.created_at,
     updated_at: data.updated_at,
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
    const convertedPreferences: UserWateringPreferences = {
     id: data.id,
     user_id: data.user_id,
     default_light_level: data.default_light_level as 'low' | 'medium' | 'high',
     default_temperature: data.default_temperature as 'cool' | 'normal' | 'warm',
     default_humidity: data.default_humidity as 'dry' | 'normal' | 'humid',
     default_care_style: data.default_care_style as 'frequent' | 'balanced' | 'minimal',
     default_soil_type: data.default_soil_type as 'regular' | 'draining' | 'retaining',
     location: data.location,
     created_at: data.created_at,
     updated_at: data.updated_at,
    };
    setPreferences(convertedPreferences);
    setHasPreferences(true);
   }

   toast({
    title: 'Preferences Saved',
    description: 'Your smart watering preferences have been saved for future use.',
   });

   return true;
  } catch (error) {
   console.error('Error saving watering preferences:', error);
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
   console.error('Error clearing watering preferences:', error);
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

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { computeOverwateringRisk, OverwateringRisk } from '@/utils/overwatering';
import { utilityToast } from '@/utils/toast-helpers';

export interface UserPlant {
 id: string;
 nickname: string;
 plant_type: string;
 image?: string;
 room?: string;
 suggested_watering_days?: number;
 latest_watering?: string;
 days_since_watering?: number;
 created_at: string;
 updated_at: string;
}

export const useUserPlants = () => {
 const { user } = useAuth();
 const { toast } = useToast();
 const [plants, setPlants] = useState<UserPlant[]>([]);
 const [loading, setLoading] = useState(true);
 const [overwateringByPlantId, setOverwateringByPlantId] = useState<Record<string, OverwateringRisk>>({});

 const fetchPlants = async () => {
 if (!user) {
  setPlants([]);
  setLoading(false);
  return;
 }

 try {
  const { data, error } = await supabase
  .from('plants_with_watering_info')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });

  if (error) throw error;
  const result = data || [];
  setPlants(result);

  // After plants load, fetch recent watering records once and compute risk per plant
  try {
  const plantIds = result.map((p) => p.id);
  if (plantIds.length === 0) {
   setOverwateringByPlantId({});
  } else {
   const suggestedDaysList = result.map((p) => p.suggested_watering_days ?? 7);
   const maxWindowDays = Math.min(30, Math.max(...suggestedDaysList, 7));
   const now = new Date();
   const start = new Date(now.getTime() - maxWindowDays * 24 * 60 * 60 * 1000).toISOString();
   const end = now.toISOString();

   const { data: records, error: recordsError } = await supabase
   .from('watering_records')
   .select('plant_id, watered_at, notes')
   .in('plant_id', plantIds)
   .gte('watered_at', start)
   .lte('watered_at', end);

   if (recordsError) throw recordsError;

   const byPlant: Record<string, { watered_at: string; notes?: string | null }[]> = {};
   (records || []).forEach((r: any) => {
   if (!byPlant[r.plant_id]) byPlant[r.plant_id] = [];
   byPlant[r.plant_id].push({ watered_at: r.watered_at, notes: r.notes });
   });

   const riskMap: Record<string, OverwateringRisk> = {};
   result.forEach((p) => {
   const recs = byPlant[p.id] || [];
   riskMap[p.id] = computeOverwateringRisk({
    records: recs,
    suggestedDays: p.suggested_watering_days ?? 7,
    now,
   });
   });
   setOverwateringByPlantId(riskMap);
  }
  } catch (riskError) {
  console.warn('Failed to compute overwatering risk:', riskError);
  }
 } catch (error) {
  console.error('Error fetching plants:', error);
  toast({
  title: 'Error',
  description: 'Failed to load your plants',
  variant: 'destructive',
  });
 } finally {
  setLoading(false);
 }
 };

 const addPlant = async (plantData: { 
 nickname: string; 
 plant_type: string; 
 image?: string; 
 room?: string;
 suggested_watering_days?: number;
 last_watered_date?: string;
 }) => {
 if (!user) return false;

 try {
  // First, insert the plant
  const { data: plantResult, error: plantError } = await supabase
  .from('user_plants')
  .insert({
   nickname: plantData.nickname,
   plant_type: plantData.plant_type,
   image: plantData.image,
   room: plantData.room,
   suggested_watering_days: plantData.suggested_watering_days,
   user_id: user.id,
  })
  .select()
  .single();

  if (plantError) throw plantError;

  // If a last watered date was provided, create a watering record
  if (plantData.last_watered_date && plantResult) {
  const { error: wateringError } = await supabase
   .from('watering_records')
   .insert({
   plant_id: plantResult.id,
   watered_at: plantData.last_watered_date,
   notes: 'Initial watering record from plant creation',
   });

  if (wateringError) {
   console.error('Error creating initial watering record:', wateringError);
   // Don't fail the plant creation if watering record fails
  }
  }

  toast({
  title: 'Success',
  description: 'Plant added successfully',
  });
  
  fetchPlants();
  return true;
 } catch (error) {
  console.error('Error adding plant:', error);
  toast({
  title: 'Error',
  description: 'Failed to add plant',
  variant: 'destructive',
  });
  return false;
 }
 };

 const waterPlant = async (plantId: string, notes?: string) => {
 try {
  // First, delete any existing postponement records for this plant
  const { error: deleteError } = await supabase
  .from('watering_records')
  .delete()
  .eq('plant_id', plantId)
  .like('notes', '%POSTPONEMENT:%');

  if (deleteError) {
  console.warn('Could not delete postponement records:', deleteError);
  // Don't fail the watering if postponement cleanup fails
  }

  // Create the actual watering record
  const { error } = await supabase
  .from('watering_records')
  .insert({
   plant_id: plantId,
   watered_at: new Date().toISOString(),
   notes: notes || null,
  });

  if (error) throw error;

  toast({
  title: 'Success',
  description: 'Plant watered successfully',
  });

  // Check overwatering risk for this plant and notify if needed
  await checkOverwatering(plantId);

  fetchPlants();
  return true;
 } catch (error) {
  console.error('Error watering plant:', error);
  toast({
  title: 'Error',
  description: 'Failed to record watering',
  variant: 'destructive',
  });
  return false;
 }
 };

 const postponeWatering = async (plantId: string) => {
 try {
  // First, check if there's already a postponement record for this plant
  const { data: existingPostponements, error: fetchError } = await supabase
  .from('watering_records')
  .select('*')
  .eq('plant_id', plantId)
  .like('notes', '%POSTPONEMENT:%')
  .gt('watered_at', new Date().toISOString());

  if (fetchError) throw fetchError;

  // If there's already a future postponement, don't create another one
  if (existingPostponements && existingPostponements.length > 0) {
  toast({
   title: 'Already Postponed',
   description: 'This plant\'s watering is already postponed',
  });
  return true;
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0); // Set to 9 AM tomorrow for consistency

  const { error } = await supabase
  .from('watering_records')
  .insert({
   plant_id: plantId,
   watered_at: tomorrow.toISOString(),
   notes: 'POSTPONEMENT: Watering postponed - plant didn\'t need water yet',
  });

  if (error) throw error;

  toast({
  title: 'Watering Postponed',
  description: 'Plant watering pushed to tomorrow',
  });
  
  fetchPlants();
  return true;
 } catch (error) {
  console.error('Error postponing watering:', error);
  toast({
  title: 'Error',
  description: 'Failed to postpone watering',
  variant: 'destructive',
  });
  return false;
 }
 };

 const checkOverwatering = async (plantId: string) => {
 try {
  const plant = plants.find((p) => p.id === plantId);
  const suggestedDays = plant?.suggested_watering_days ?? 7;
  const windowDays = Math.min(30, Math.max(suggestedDays, 2));
  const now = new Date();
  const start = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000).toISOString();
  const end = now.toISOString();

  const { data: records, error } = await supabase
  .from('watering_records')
  .select('watered_at, notes')
  .eq('plant_id', plantId)
  .gte('watered_at', start)
  .lte('watered_at', end);

  if (error) throw error;

  const risk = computeOverwateringRisk({
  records: (records || []).map((r: any) => ({ watered_at: r.watered_at, notes: r.notes })),
  suggestedDays,
  now,
  });

  setOverwateringByPlantId((prev) => ({ ...prev, [plantId]: risk }));

  if (risk.level !== 'none') {
  const throttleKey = `sprouthub:overwatering:warned:${plantId}`;
  const lastWarned = localStorage.getItem(throttleKey);
  const nowMs = Date.now();
  const lastMs = lastWarned ? parseInt(lastWarned, 10) : 0;
  const dayMs = 24 * 60 * 60 * 1000;
  if (!lastWarned || nowMs - lastMs > dayMs) {
   const levelLabel = risk.level === 'high' ? 'Possible Overwatering' : 'Watch Watering Frequency';
   const detail = `${risk.count} time${risk.count === 1 ? '' : 's'} in last ${risk.windowDays} days`;
   const avg = risk.avgIntervalDays ? ` • Avg ${risk.avgIntervalDays}d vs ${suggestedDays}d` : '';
   utilityToast.warning(levelLabel, `${detail}${avg}`);
   try { localStorage.setItem(throttleKey, String(nowMs)); } catch {}
  }
  }
 } catch (err) {
  console.warn('checkOverwatering failed:', err);
 }
 };

 useEffect(() => {
 fetchPlants();
 }, [user]);

 return {
 plants,
 loading,
 overwateringByPlantId,
 fetchPlants,
 addPlant,
 waterPlant,
 postponeWatering,
 checkOverwatering,
 };
};

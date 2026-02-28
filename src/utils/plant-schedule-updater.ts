/**
 * Utility functions for updating plant watering schedules
 */

import { supabase } from '@/integrations/supabase/client';

export interface ScheduleUpdateResult {
  success: boolean;
  error?: string;
  previousSchedule?: number;
  newSchedule?: number;
}

/**
 * Update a plant's watering schedule in the database
 */
export async function updatePlantWateringSchedule(
  plantId: string,
  newSchedule: number
): Promise<ScheduleUpdateResult> {
  try {
    // Validate input
    if (!plantId || typeof newSchedule !== 'number' || newSchedule < 1 || newSchedule > 365) {
      return {
        success: false,
        error: 'Invalid plant ID or schedule value',
      };
    }

    // Get current schedule for comparison
    const { data: currentPlant, error: fetchError } = await supabase
      .from('user_plants')
      .select('suggested_watering_days')
      .eq('id', plantId)
      .single();

    if (fetchError) {
      console.error('Error fetching current schedule:', fetchError);
      return {
        success: false,
        error: 'Failed to fetch current schedule',
      };
    }

    const previousSchedule = currentPlant?.suggested_watering_days || 7;

    // Update the schedule
    const { error: updateError } = await supabase
      .from('user_plants')
      .update({ 
        suggested_watering_days: newSchedule,
        updated_at: new Date().toISOString(),
      })
      .eq('id', plantId);

    if (updateError) {
      console.error('Error updating schedule:', updateError);
      return {
        success: false,
        error: 'Failed to update watering schedule',
      };
    }

    return {
      success: true,
      previousSchedule,
      newSchedule,
    };
  } catch (error) {
    console.error('Unexpected error updating schedule:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Batch update multiple plant schedules
 */
export async function updateMultiplePlantSchedules(
  scheduleUpdates: Array<{ plantId: string; newSchedule: number }>
): Promise<Map<string, ScheduleUpdateResult>> {
  const results = new Map<string, ScheduleUpdateResult>();

  // Process updates in parallel with some throttling
  const chunks = [];
  for (let i = 0; i < scheduleUpdates.length; i += 5) {
    chunks.push(scheduleUpdates.slice(i, i + 5));
  }

  for (const chunk of chunks) {
    const chunkPromises = chunk.map(async ({ plantId, newSchedule }) => {
      const result = await updatePlantWateringSchedule(plantId, newSchedule);
      results.set(plantId, result);
    });

    await Promise.all(chunkPromises);
  }

  return results;
}

/**
 * Create a schedule adjustment record for tracking pattern-based changes
 */
export async function recordScheduleAdjustment(
  _plantId: string,
  previousSchedule: number,
  newSchedule: number,
  reason: string,
  confidence: 'low' | 'medium' | 'high'
): Promise<boolean> {
  try {
    // This would insert into a schedule_adjustments table if we had one
    // For now, we'll just log it or store it in notes
    const adjustmentNote = `Schedule adjusted from ${previousSchedule} to ${newSchedule} days based on pattern analysis (${confidence} confidence): ${reason}`;
    
    // In a real implementation, you might want to store this in a dedicated table
    console.log('Schedule adjustment recorded:', adjustmentNote);
    
    return true;
  } catch (error) {
    console.error('Error recording schedule adjustment:', error);
    return false;
  }
}

/**
 * Validate schedule adjustment based on plant care requirements
 */
export function validateScheduleAdjustment(
  currentSchedule: number,
  proposedSchedule: number,
  plantType?: string
): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  let isValid = true;

  // Basic bounds checking
  if (proposedSchedule < 1 || proposedSchedule > 365) {
    isValid = false;
    warnings.push('Schedule must be between 1 and 365 days');
  }

  // Check for dramatic changes
  const changePercentage = Math.abs(proposedSchedule - currentSchedule) / currentSchedule;
  if (changePercentage > 0.5) {
    warnings.push('This is a significant schedule change (>50%). Consider making gradual adjustments.');
  }

  // Plant-specific warnings (you could expand this with plant care data)
  if (plantType) {
    if (plantType.toLowerCase().includes('succulent') && proposedSchedule < 7) {
      warnings.push('Succulents typically prefer less frequent watering (7+ days)');
    }
    
    if (plantType.toLowerCase().includes('fern') && proposedSchedule > 5) {
      warnings.push('Ferns typically prefer more frequent watering (3-5 days)');
    }
  }

  // Seasonal considerations (basic)
  const month = new Date().getMonth() + 1;
  const isWinter = month === 12 || month === 1 || month === 2;
  if (isWinter && proposedSchedule < currentSchedule) {
    warnings.push('Plants typically need less water in winter months');
  }

  return { isValid, warnings };
}
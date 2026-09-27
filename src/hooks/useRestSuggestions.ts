/**
 * Which plants should be offered a rest-period pause right now: the species is in one of its
 * catalog rest periods, the plant isn't already paused, and the user hasn't chosen "keep
 * reminding me" for this rest.
 *
 * Shared by the plant page card and the dashboard banner so they always agree.
 * "Keep reminding me" is stored in notification_acknowledgements (with a localStorage fast
 * path), keyed per plant and per rest, so it comes back next season.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getCatalogPlant } from '@/data/plantData';
import { resolveHemisphereFromEnvironment, type HemisphereInput } from '@/utils/season';
import { calculateWateringSchedule } from '@/utils/watering/schedule';
import { getActiveRestPeriod, restSuggestionKey, type ActiveRestPeriod } from '@/utils/watering/restPeriod';
import type { UserPlant } from '@/hooks/useUserPlants';

export interface RestSuggestion {
  plant: UserPlant;
  period: ActiveRestPeriod;
}

const localKey = (key: string, plantId: string) => `${key}:${plantId}`;

function readLocal(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

export function useRestSuggestions(plants: UserPlant[], hemisphereInput: HemisphereInput = {}) {
  const { user } = useAuth();
  const { hemisphere } = resolveHemisphereFromEnvironment(hemisphereInput);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  // Plants in a rest period that aren't paused yet
  const candidates = useMemo(
    () =>
      plants.flatMap((plant) => {
        const period = getActiveRestPeriod(
          getCatalogPlant(plant.plant_type)?.care?.watering?.restPeriods,
          hemisphere
        );
        if (!period || calculateWateringSchedule(plant).isResting) return [];
        return [{ plant, period }];
      }),
    [plants, hemisphere]
  );

  useEffect(() => {
    if (!user || candidates.length === 0) return;
    let cancelled = false;
    supabase
      .from('notification_acknowledgements')
      .select('plant_id, notification_type')
      .eq('user_id', user.id)
      .like('notification_type', 'rest_suggestion:%')
      .then(({ data }) => {
        if (cancelled || !data) return;
        setAcknowledged(new Set(data.map((row) => localKey(row.notification_type, row.plant_id ?? ''))));
      });
    return () => {
      cancelled = true;
    };
  }, [user, candidates.length]);

  const suggestions: RestSuggestion[] = useMemo(
    () =>
      candidates.filter(({ plant, period }) => {
        const key = localKey(restSuggestionKey(period), plant.id);
        return !acknowledged.has(key) && !readLocal(key);
      }),
    [candidates, acknowledged]
  );

  /** "Keep reminding me": hide this plant's suggestion until its next rest period. */
  const keepReminders = useCallback(
    async ({ plant, period }: RestSuggestion) => {
      const type = restSuggestionKey(period);
      const key = localKey(type, plant.id);
      setAcknowledged((prev) => new Set(prev).add(key));
      try {
        localStorage.setItem(key, '1');
      } catch {
        // Storage unavailable; the database record below still applies.
      }
      if (!user) return;
      await supabase.from('notification_acknowledgements').insert({
        user_id: user.id,
        notification_type: type,
        plant_id: plant.id,
        acknowledged_date: new Date().toISOString().slice(0, 10),
      });
    },
    [user]
  );

  return { suggestions, keepReminders };
}

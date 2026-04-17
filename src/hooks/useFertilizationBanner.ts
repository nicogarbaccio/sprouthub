/**
 * Hook for managing the spring fertilization reminder banner.
 *
 * Shows once per spring/summer season, tracks dismissal in
 * notification_acknowledgements (with localStorage fallback).
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { hookLogger } from '@/utils/hookLogging';
import { calendarSeasonalService } from '@/services/calendarSeasonalService';
import type { UserPlant } from '@/hooks/useUserPlants';

const HOOK_NAME = 'useFertilizationBanner';

/**
 * Growing season = spring or summer per calendarSeasonalService, which
 * handles hemisphere flipping via latitude. Defaults to 40°N.
 */
function isGrowingSeason(date: Date = new Date(), latitude: number = 40): boolean {
  const season = calendarSeasonalService.getCurrentSeason(latitude, date);
  return season === 'spring' || season === 'summer';
}

/** Unique notification key for this spring/summer period */
function notificationKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  return `spring_fertilization_${year}`;
}

/** localStorage fallback key */
function localStorageKey(date: Date = new Date()): string {
  return `fertilization_banner_dismissed_${notificationKey(date)}`;
}

/** 60-day threshold: plants not fertilized in > 60 days count as unfertilized */
const STALE_DAYS = 60;

function countUnfertilizedPlants(plants: UserPlant[], now: Date = new Date()): number {
  return plants.filter(p => {
    if (!p.last_fertilized_date) return true;
    const daysSince = Math.floor(
      (now.getTime() - new Date(p.last_fertilized_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSince > STALE_DAYS;
  }).length;
}

export interface UseFertilizationBannerReturn {
  shouldShow: boolean;
  unfertilizedCount: number;
  dismiss: () => Promise<void>;
  snooze: (days: number) => Promise<void>;
}

export function useFertilizationBanner(plants: UserPlant[], latitude: number = 40): UseFertilizationBannerReturn {
  const { user } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isSnoozed, setIsSnoozed] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const now = new Date();
  const growing = isGrowingSeason(now, latitude);
  const unfertilizedCount = countUnfertilizedPlants(plants, now);
  const key = notificationKey(now);
  const lsKey = localStorageKey(now);

  /**
   * Check dismissal/snooze state from DB (or localStorage fallback).
   */
  const checkDismissalState = useCallback(async () => {
    // Quick localStorage check first
    const lsValue = localStorage.getItem(lsKey);
    if (lsValue) {
      try {
        const parsed = JSON.parse(lsValue) as { snoozedUntil?: string; dismissed?: boolean };
        if (parsed.dismissed) {
          setIsDismissed(true);
          setIsChecked(true);
          return;
        }
        if (parsed.snoozedUntil && new Date(parsed.snoozedUntil) > now) {
          setIsSnoozed(true);
          setIsChecked(true);
          return;
        }
      } catch {
        // ignore malformed localStorage value
      }
    }

    if (!user) {
      setIsChecked(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notification_acknowledgements')
        .select('acknowledged_date')
        .eq('user_id', user.id)
        .eq('notification_type', key)
        .is('plant_id', null)
        .order('acknowledged_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        hookLogger.warn(HOOK_NAME, 'Could not check fertilization dismissal', { error });
      } else if (data) {
        const acknowledged = new Date(data.acknowledged_date);
        if (acknowledged > now) {
          // Future date = either active snooze or season-long dismissal.
          // Both mean the banner stays hidden.
          setIsDismissed(true);
        }
        // Past date = expired snooze. Banner should reappear.
        // (True dismissals always store an end-of-year date that stays in the future.)
      }
    } catch (err) {
      hookLogger.warn(HOOK_NAME, 'Error checking fertilization dismissal', { err });
    } finally {
      setIsChecked(true);
    }
  }, [user, key, lsKey]);

  useEffect(() => {
    if (growing) {
      checkDismissalState();
    } else {
      setIsChecked(true);
    }
  }, [growing, checkDismissalState]);

  const writeAcknowledgement = useCallback(async (acknowledgedDate: Date) => {
    if (!user) return;

    try {
      // Delete any existing banner-level record for this notification key,
      // then insert the new one. We can't use upsert because the unique
      // constraint includes acknowledged_date and plant_id=NULL rows
      // never conflict in PostgreSQL.
      await supabase
        .from('notification_acknowledgements')
        .delete()
        .eq('user_id', user.id)
        .eq('notification_type', key)
        .is('plant_id', null);

      const { error } = await supabase
        .from('notification_acknowledgements')
        .insert({
          user_id: user.id,
          notification_type: key,
          plant_id: null,
          acknowledged_date: acknowledgedDate.toISOString(),
        });

      if (error) {
        hookLogger.warn(HOOK_NAME, 'Could not persist fertilization dismissal', { error });
      }
    } catch (err) {
      hookLogger.warn(HOOK_NAME, 'Could not persist fertilization dismissal', { err });
    }
  }, [user, key]);

  const dismiss = useCallback(async () => {
    setIsDismissed(true);
    // Store in localStorage immediately
    localStorage.setItem(lsKey, JSON.stringify({ dismissed: true }));
    // Use end-of-year date so the DB record stays "in the future" all season,
    // distinguishing a true dismissal from an expired snooze (which also has
    // a past acknowledged_date once it lapses).
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    await writeAcknowledgement(endOfYear);
  }, [lsKey, writeAcknowledgement, now]);

  const snooze = useCallback(async (days: number) => {
    const snoozedUntil = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    setIsSnoozed(true);
    localStorage.setItem(lsKey, JSON.stringify({ snoozedUntil: snoozedUntil.toISOString() }));
    await writeAcknowledgement(snoozedUntil);
  }, [lsKey, writeAcknowledgement, now]);

  const shouldShow =
    isChecked &&
    growing &&
    unfertilizedCount > 0 &&
    !isDismissed &&
    !isSnoozed;

  return {
    shouldShow,
    unfertilizedCount,
    dismiss,
    snooze,
  };
}

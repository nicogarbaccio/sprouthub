import { useSyncExternalStore } from 'react';
import { successHaptic } from '@/utils/ios-optimizations';

/**
 * How long a plant counts as "just watered" — the length of the Watered! animation, and how
 * long the dashboard keeps a watered plant's row in place before letting it leave the list.
 */
export const JUST_WATERED_MS = 1600;

/** Bulk watering marks many plants at once; they should share one buzz, not one each. */
const HAPTIC_COOLDOWN_MS = 500;

let justWatered: ReadonlySet<string> = new Set();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const listeners = new Set<() => void>();
let lastHapticAt = 0;

const emit = (next: ReadonlySet<string>) => {
  justWatered = next;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => justWatered;

/**
 * Plays the Watered! confirmation for a plant wherever it's on screen. Called by waterPlant
 * alongside its optimistic update, so the animation lands as the confirmation dialog closes
 * rather than after the save round-trips.
 */
export const markJustWatered = (plantId: string) => {
  const existing = timers.get(plantId);
  if (existing) clearTimeout(existing);

  timers.set(
    plantId,
    setTimeout(() => {
      timers.delete(plantId);
      const next = new Set(justWatered);
      next.delete(plantId);
      emit(next);
    }, JUST_WATERED_MS)
  );

  const next = new Set(justWatered);
  next.add(plantId);
  emit(next);

  const now = Date.now();
  if (now - lastHapticAt > HAPTIC_COOLDOWN_MS) {
    lastHapticAt = now;
    void successHaptic();
  }
};

/** Every plant currently playing its Watered! animation */
export const useJustWateredIds = () => useSyncExternalStore(subscribe, getSnapshot);

/** Whether this plant is currently playing its Watered! animation */
export const useJustWatered = (plantId: string) =>
  useSyncExternalStore(subscribe, () => justWatered.has(plantId));

import type { Query, QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

/**
 * Saves selected React Query results to localStorage so reopening the app shows the
 * last-known data straight away (no skeleton) while a background refetch brings it
 * up to date. `markRestoredQueriesStale` makes sure that refetch always happens.
 *
 * A query opts in with `meta: { persist: true }` and `gcTime: PERSISTED_QUERY_GC_TIME`;
 * the longer gcTime keeps it in the cache (and therefore in the saved snapshot) while
 * nothing on screen is using it.
 */

/** How long a saved snapshot is trusted before it's thrown away */
export const PERSISTED_QUERY_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
export const PERSISTED_QUERY_GC_TIME = PERSISTED_QUERY_MAX_AGE;

const STORAGE_KEY = 'sprouthub-query-cache';

/** localStorage can be missing or throw (private mode, blocked site data); never let that break the app */
const safeStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Quota or access error: the app just starts without a snapshot next time
    }
  },
  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Nothing to clean up if storage is unavailable
    }
  },
};

export const queryPersister = createSyncStoragePersister({
  storage: safeStorage,
  key: STORAGE_KEY,
  throttleTime: 1000,
});

export const persistOptions = {
  persister: queryPersister,
  maxAge: PERSISTED_QUERY_MAX_AGE,
  // A new deploy may change what a query returns, so snapshots from older builds are dropped
  buster: import.meta.env.VITE_BUILD_ID ?? '',
  dehydrateOptions: {
    shouldDehydrateQuery: (query: Query) =>
      query.meta?.persist === true && query.state.status === 'success',
  },
};

/** Forget the saved snapshot, e.g. on sign-out, so another person on the device can't see it */
export function clearPersistedQueries() {
  queryPersister.removeClient();
}

/**
 * Run once the saved snapshot is restored. Restored queries keep the time they were fetched,
 * so one saved under 30s ago (staleTime) would count as fresh and never refetch: add a plant,
 * reload within the 1s save throttle, and the list stays without it for half a minute.
 * Invalidating them means anything restored is only ever a placeholder until refetched.
 */
export function markRestoredQueriesStale(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ predicate: (query) => query.meta?.persist === true });
}

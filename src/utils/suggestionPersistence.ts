/**
 * Utilities for persisting dismissed smart watering suggestions
 */

const STORAGE_KEY = 'sprouthub:dismissed-suggestions';
const EXPIRY_DAYS = 30; // Suggestions dismissal expires after 30 days

export interface DismissedSuggestion {
  plantId: string;
  dismissedAt: string; // ISO timestamp
  reason: 'user_dismissed' | 'applied' | 'auto_expired';
}

export interface DismissedSuggestionsData {
  suggestions: DismissedSuggestion[];
  version: number; // For future schema migrations
}

/**
 * Load dismissed suggestions from localStorage
 */
export function loadDismissedSuggestions(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return new Set();
    }

    const data: DismissedSuggestionsData = JSON.parse(stored);

    // Handle legacy format (direct array) or missing version
    const suggestions = Array.isArray(data) ? data : (data.suggestions || []);

    // Filter out expired suggestions
    const now = new Date();
    const expiryTime = EXPIRY_DAYS * 24 * 60 * 60 * 1000; // milliseconds

    const validSuggestions = suggestions.filter((suggestion: DismissedSuggestion) => {
      const dismissedAt = new Date(suggestion.dismissedAt);
      const timeDiff = now.getTime() - dismissedAt.getTime();
      return timeDiff < expiryTime;
    });

    // Save back the filtered list if we removed expired items
    if (validSuggestions.length !== suggestions.length) {
      saveDismissedSuggestions(new Set(validSuggestions.map(s => s.plantId)), 'auto_expired');
    }

    return new Set(validSuggestions.map(suggestion => suggestion.plantId));
  } catch (error) {
    console.error('Error loading dismissed suggestions:', error);
    return new Set();
  }
}

/**
 * Save dismissed suggestions to localStorage
 */
export function saveDismissedSuggestions(
  dismissedPlantIds: Set<string>,
  reason: DismissedSuggestion['reason'] = 'user_dismissed'
): void {
  try {
    const now = new Date().toISOString();

    // Load existing suggestions to preserve timestamps and reasons
    const existing = loadDismissedSuggestionsRaw();
    const existingMap = new Map(existing.map(s => [s.plantId, s]));

    // Create new suggestions array
    const suggestions: DismissedSuggestion[] = [];

    dismissedPlantIds.forEach(plantId => {
      const existingSuggestion = existingMap.get(plantId);
      if (existingSuggestion) {
        // Keep existing suggestion (preserves original dismissal time)
        suggestions.push(existingSuggestion);
      } else {
        // Add new dismissal
        suggestions.push({
          plantId,
          dismissedAt: now,
          reason,
        });
      }
    });

    const data: DismissedSuggestionsData = {
      suggestions,
      version: 1,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving dismissed suggestions:', error);
  }
}

/**
 * Load raw dismissed suggestions data (for internal use)
 */
function loadDismissedSuggestionsRaw(): DismissedSuggestion[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const data: DismissedSuggestionsData = JSON.parse(stored);

    // Handle legacy format (direct array) or missing version
    return Array.isArray(data) ? data : (data.suggestions || []);
  } catch (error) {
    console.error('Error loading raw dismissed suggestions:', error);
    return [];
  }
}

/**
 * Check if a plant suggestion is dismissed
 */
export function isDismissed(plantId: string): boolean {
  const dismissed = loadDismissedSuggestions();
  return dismissed.has(plantId);
}

/**
 * Dismiss a single plant suggestion
 */
export function dismissSuggestion(
  plantId: string,
  reason: DismissedSuggestion['reason'] = 'user_dismissed'
): void {
  const current = loadDismissedSuggestions();
  current.add(plantId);
  saveDismissedSuggestions(current, reason);
}

/**
 * Dismiss multiple plant suggestions
 */
export function dismissSuggestions(
  plantIds: string[],
  reason: DismissedSuggestion['reason'] = 'user_dismissed'
): void {
  const current = loadDismissedSuggestions();
  plantIds.forEach(id => current.add(id));
  saveDismissedSuggestions(current, reason);
}

/**
 * Remove a plant from dismissed suggestions (for testing or manual management)
 */
export function undismissSuggestion(plantId: string): void {
  const current = loadDismissedSuggestions();
  current.delete(plantId);
  saveDismissedSuggestions(current);
}

/**
 * Clear all dismissed suggestions (for testing or reset)
 */
export function clearDismissedSuggestions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing dismissed suggestions:', error);
  }
}

/**
 * Clear expired dismissals manually (optional maintenance)
 */
export function clearExpiredDismissals(): number {
  const before = loadDismissedSuggestionsRaw().length;
  const current = loadDismissedSuggestions(); // This automatically filters expired
  const after = current.size;

  return before - after; // Return number of expired items removed
}

/**
 * Get statistics about dismissed suggestions (for debugging)
 */
export function getDismissalStats(): {
  total: number;
  byReason: Record<string, number>;
  oldestDismissal: string | null;
  newestDismissal: string | null;
} {
  const suggestions = loadDismissedSuggestionsRaw();

  const byReason: Record<string, number> = {};
  let oldestDate: Date | null = null;
  let newestDate: Date | null = null;

  suggestions.forEach(suggestion => {
    // Count by reason
    byReason[suggestion.reason] = (byReason[suggestion.reason] || 0) + 1;

    // Track date range
    const date = new Date(suggestion.dismissedAt);
    if (!oldestDate || date < oldestDate) {
      oldestDate = date;
    }
    if (!newestDate || date > newestDate) {
      newestDate = date;
    }
  });

  return {
    total: suggestions.length,
    byReason,
    oldestDismissal: oldestDate?.toISOString() || null,
    newestDismissal: newestDate?.toISOString() || null,
  };
}
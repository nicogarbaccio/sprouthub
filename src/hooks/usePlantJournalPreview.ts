import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { JournalEntry } from '@/types/journalTypes';

export const JOURNAL_PREVIEW_QUERY_KEY = 'journal-preview';

/** Titles of entries written automatically when the user waters or fertilizes. */
const AUTO_LOGGED_TITLES = new Set(['Watered', 'Fertilized']);

const MAX_PHOTOS = 3;

export type JournalPreviewEntry = Pick<JournalEntry, 'id' | 'title' | 'content' | 'entry_date' | 'images'>;

export interface JournalPreview {
  /** Every entry, the automatic watering/fertilizing log included. */
  entryCount: number;
  /** Newest entry the user wrote, as opposed to the automatic watering/fertilizing log. */
  latestNote: JournalPreviewEntry | null;
  /** Most recent photo URLs across all entries, newest first. */
  photos: string[];
}

export function summarizeJournal(entries: JournalPreviewEntry[]): JournalPreview {
  const notes = entries.filter(entry => !AUTO_LOGGED_TITLES.has(entry.title ?? ''));
  return {
    entryCount: entries.length,
    latestNote: notes[0] ?? null,
    photos: entries.flatMap(entry => entry.images ?? []).slice(0, MAX_PHOTOS),
  };
}

/**
 * A summary of a plant's journal for the tile on the plant page.
 *
 * @param activity - values that change when an entry is logged automatically (last watered,
 *   last fertilized); part of the query key so the preview refetches after those actions.
 */
export function usePlantJournalPreview(
  plantId: string | undefined,
  activity: Array<string | null | undefined> = []
) {
  return useQuery({
    queryKey: [JOURNAL_PREVIEW_QUERY_KEY, plantId, ...activity],
    queryFn: async (): Promise<JournalPreview> => {
      const { data, error } = await supabase
        .from('plant_journal_entries')
        .select('id, title, content, entry_date, images')
        .eq('plant_id', plantId!)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      return summarizeJournal(data ?? []);
    },
    enabled: !!plantId,
    // Keep showing the last summary while an activity change refetches, instead of flashing empty
    placeholderData: previous => previous,
  });
}

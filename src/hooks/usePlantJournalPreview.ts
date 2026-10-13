import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { JournalEntry } from '@/types/journalTypes';

export const JOURNAL_PREVIEW_QUERY_KEY = 'journal-preview';

/** Titles of entries written automatically when the user waters or fertilizes. */
const AUTO_LOGGED_TITLES = new Set(['Watered', 'Fertilized']);

const MAX_PHOTOS = 3;

export type JournalPreviewEntry = Pick<JournalEntry, 'id' | 'title' | 'content' | 'entry_date' | 'images'>;

export interface JournalPreview {
  /** Entries the user wrote, as opposed to the automatic watering/fertilizing log. */
  noteCount: number;
  latestNote: JournalPreviewEntry | null;
  /** Most recent photo URLs across all entries, newest first. */
  photos: string[];
  /** Whether the journal has anything in it, automatic entries included. */
  hasEntries: boolean;
}

export function summarizeJournal(entries: JournalPreviewEntry[]): JournalPreview {
  const notes = entries.filter(entry => !AUTO_LOGGED_TITLES.has(entry.title ?? ''));
  return {
    noteCount: notes.length,
    latestNote: notes[0] ?? null,
    photos: entries.flatMap(entry => entry.images ?? []).slice(0, MAX_PHOTOS),
    hasEntries: entries.length > 0,
  };
}

/** A summary of a plant's journal for the tile on the plant page. */
export function usePlantJournalPreview(plantId: string | undefined) {
  return useQuery({
    queryKey: [JOURNAL_PREVIEW_QUERY_KEY, plantId],
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
  });
}

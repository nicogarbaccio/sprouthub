import { describe, it, expect } from 'vitest';
import { summarizeJournal, type JournalPreviewEntry } from '@/hooks/usePlantJournalPreview';

const entry = (overrides: Partial<JournalPreviewEntry>): JournalPreviewEntry => ({
  id: crypto.randomUUID(),
  title: null,
  content: null,
  entry_date: '2026-10-01T12:00:00Z',
  images: null,
  ...overrides,
});

describe('summarizeJournal', () => {
  it('ignores automatic watering and fertilizing entries when picking the latest note', () => {
    const summary = summarizeJournal([
      entry({ title: 'Watered' }),
      entry({ title: 'Fertilized' }),
      entry({ title: 'New leaf unfurling', content: 'Third this month' }),
      entry({ title: 'Fertilization note' }),
    ]);

    expect(summary.noteCount).toBe(2);
    expect(summary.latestNote?.title).toBe('New leaf unfurling');
    expect(summary.hasEntries).toBe(true);
  });

  it('has no notes when the journal only holds the automatic log', () => {
    const summary = summarizeJournal([entry({ title: 'Watered' })]);

    expect(summary.noteCount).toBe(0);
    expect(summary.latestNote).toBeNull();
    expect(summary.hasEntries).toBe(true);
  });

  it('takes the three newest photos across entries', () => {
    const summary = summarizeJournal([
      entry({ title: 'A', images: ['a1', 'a2'] }),
      entry({ title: 'Watered', images: ['w1'] }),
      entry({ title: 'B', images: ['b1'] }),
    ]);

    expect(summary.photos).toEqual(['a1', 'a2', 'w1']);
  });
});

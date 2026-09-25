import { JournalEntry } from '@/types/journalTypes';
import { JournalEntryCard } from './JournalEntryCard';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen } from 'lucide-react';

interface JournalEntryListProps {
  entries: JournalEntry[];
  isLoading?: boolean;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onEditEntry?: (entry: JournalEntry) => void;
  deleteLoadingEntries: Set<string>;
}

export function JournalEntryList({
  entries,
  isLoading = false,
  onDeleteEntry,
  onEditEntry,
  deleteLoadingEntries,
}: JournalEntryListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-40 w-full rounded-3xl" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-3xl bg-card p-5 flex items-start gap-3.5">
        <div className="w-11 h-11 shrink-0 rounded-[14px] bg-field text-foreground flex items-center justify-center">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-foreground">No journal entries yet</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
            Start documenting your plant's journey by adding your first journal entry with photos and notes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <JournalEntryCard
          key={entry.id}
          entry={entry}
          onDelete={onDeleteEntry}
          onEdit={onEditEntry}
          isDeleting={deleteLoadingEntries.has(entry.id)}
        />
      ))}
    </div>
  );
}

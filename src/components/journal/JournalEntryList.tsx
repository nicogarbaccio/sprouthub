import { JournalEntry } from '@/types/journalTypes';
import { JournalEntryCard } from './JournalEntryCard';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen } from 'lucide-react';

interface JournalEntryListProps {
  entries: JournalEntry[];
  isLoading?: boolean;
  onDeleteEntry: (entryId: string) => Promise<void>;
  deleteLoadingEntries: Set<string>;
}

export function JournalEntryList({
  entries,
  isLoading = false,
  onDeleteEntry,
  deleteLoadingEntries,
}: JournalEntryListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1].map((i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="aspect-square rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-plant-primary/10 p-4 rounded-full mb-4">
          <BookOpen className="w-8 h-8 text-plant-primary" />
        </div>
        <h3 className="font-semibold text-lg mb-2">No Journal Entries Yet</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          Start documenting your plant's journey by adding your first journal entry with photos and notes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <JournalEntryCard
          key={entry.id}
          entry={entry}
          onDelete={onDeleteEntry}
          isDeleting={deleteLoadingEntries.has(entry.id)}
        />
      ))}
    </div>
  );
}

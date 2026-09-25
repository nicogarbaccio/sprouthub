import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChevronLeft, ChevronRight, MoreHorizontal, Trash2, Pencil, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { JournalEntry, getMoodConfig, type PlantMood } from '@/types/journalTypes';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrls } from '@/utils/plants/imageOptimization';
import {
  confirmCancelClasses,
  confirmDestructiveClasses,
  confirmDialogClasses,
  confirmIconClasses,
  confirmTitleClasses,
} from '@/components/settings/SettingsUI';

interface JournalEntryCardProps {
  entry: JournalEntry;
  onDelete: (entryId: string) => Promise<void>;
  onEdit?: (entry: JournalEntry) => void;
  isDeleting?: boolean;
}

export function JournalEntryCard({
  entry,
  onDelete,
  onEdit,
  isDeleting = false,
}: JournalEntryCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const moodConfig = getMoodConfig(entry.mood as PlantMood | null);
  const entryDate = entry.entry_date ? new Date(entry.entry_date) : new Date();

  const handleDelete = async () => {
    await onDelete(entry.id);
    setShowDeleteDialog(false);
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeImageViewer = () => {
    setSelectedImageIndex(null);
  };

  const viewerButton =
    'w-11 h-11 rounded-2xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center';

  return (
    <>
      <article className="rounded-3xl bg-card p-4">
        {/* Header with date and actions */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground">
            {format(entryDate, 'EEE, MMM d, yyyy')}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-9 h-9 shrink-0 rounded-xl bg-field text-foreground flex items-center justify-center"
                aria-label="Entry actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(entry)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit Entry
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Entry
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {entry.title && (
          <h3 className="font-display text-lg font-bold tracking-[-0.02em] text-foreground mt-1">{entry.title}</h3>
        )}

        {moodConfig && (
          <span
            className="inline-flex items-center gap-1.5 mt-2 text-[13px] font-bold px-3 py-1.5 rounded-full bg-field text-foreground"
            title={moodConfig.description}
          >
            <span aria-hidden="true">{moodConfig.icon}</span>
            {moodConfig.label}
          </span>
        )}

        {entry.content && (
          <p className="text-[15px] text-foreground leading-relaxed whitespace-pre-wrap mt-2.5">{entry.content}</p>
        )}

        {/* Images grid */}
        {entry.images && entry.images.length > 0 && (
          <div
            className={cn(
              'grid gap-2 mt-3',
              entry.images.length === 1 && 'grid-cols-1',
              entry.images.length === 2 && 'grid-cols-2',
              entry.images.length >= 3 && 'grid-cols-3'
            )}
          >
            {entry.images.map((imageUrl, index) => {
              const optimizedUrls = getOptimizedImageUrls(imageUrl);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleImageClick(index)}
                  className="relative aspect-square overflow-hidden rounded-[18px] bg-field hover:opacity-90 transition-opacity"
                  aria-label={`Open photo ${index + 1} of ${entry.images!.length}`}
                >
                  <img
                    src={optimizedUrls.thumbnail}
                    alt={`Journal photo ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-3">Added {format(new Date(entry.created_at!), 'PPp')}</p>
      </article>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className={confirmDialogClasses}>
          <AlertDialogHeader className="text-left">
            <div className="flex items-center gap-3 mb-1">
              <div className={cn(confirmIconClasses, 'bg-sprout-warning text-sprout-dark')}>
                <Trash2 className="w-6 h-6" />
              </div>
              <AlertDialogTitle className={confirmTitleClasses}>Delete Journal Entry?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-[15px]">
              This will permanently delete this journal entry and all its photos. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={confirmCancelClasses}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={confirmDestructiveClasses}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Viewer Modal */}
      {selectedImageIndex !== null && entry.images && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeImageViewer}
        >
          <button
            type="button"
            onClick={closeImageViewer}
            className={cn(viewerButton, 'absolute top-4 right-4')}
            aria-label="Close photo"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={entry.images[selectedImageIndex]}
              alt={`Journal photo ${selectedImageIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain rounded-[24px]"
            />

            {entry.images.length > 1 && (
              <>
                {selectedImageIndex > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(selectedImageIndex - 1);
                    }}
                    className={cn(viewerButton, 'absolute left-2 top-1/2 -translate-y-1/2')}
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                {selectedImageIndex < entry.images.length - 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(selectedImageIndex + 1);
                    }}
                    className={cn(viewerButton, 'absolute right-2 top-1/2 -translate-y-1/2')}
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {selectedImageIndex + 1} / {entry.images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

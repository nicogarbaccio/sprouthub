import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { MoreVertical, Trash2, Calendar, Image as ImageIcon } from 'lucide-react';
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

interface JournalEntryCardProps {
  entry: JournalEntry;
  onDelete: (entryId: string) => Promise<void>;
  isDeleting?: boolean;
}

export function JournalEntryCard({
  entry,
  onDelete,
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

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-3">
          {/* Header with date and actions */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{format(entryDate, 'PPP')}</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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

          {/* Title */}
          {entry.title && (
            <h3 className="font-semibold text-lg">{entry.title}</h3>
          )}

          {/* Mood indicator */}
          {moodConfig && (
            <div className="flex items-center gap-2">
              <span className="text-2xl">{moodConfig.icon}</span>
              <div>
                <p className={cn('font-medium text-sm', moodConfig.color)}>
                  {moodConfig.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {moodConfig.description}
                </p>
              </div>
            </div>
          )}

          {/* Content */}
          {entry.content && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {entry.content}
            </p>
          )}

          {/* Images Grid */}
          {entry.images && entry.images.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ImageIcon className="w-3 h-3" />
                <span>{entry.images.length} photo{entry.images.length > 1 ? 's' : ''}</span>
              </div>
              <div className={cn(
                'grid gap-2',
                entry.images.length === 1 && 'grid-cols-1',
                entry.images.length === 2 && 'grid-cols-2',
                entry.images.length >= 3 && 'grid-cols-3'
              )}>
                {entry.images.map((imageUrl, index) => {
                  const optimizedUrls = getOptimizedImageUrls(imageUrl);

                  return (
                    <button
                      key={index}
                      onClick={() => handleImageClick(index)}
                      className="relative aspect-square overflow-hidden rounded-lg border hover:opacity-90 transition-opacity"
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
            </div>
          )}

          {/* Timestamp */}
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Added {format(new Date(entry.created_at!), 'PPp')}
          </p>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Journal Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this journal entry and all its photos. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
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
            onClick={closeImageViewer}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={entry.images[selectedImageIndex]}
              alt={`Journal photo ${selectedImageIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />

            {/* Navigation buttons */}
            {entry.images.length > 1 && (
              <>
                {selectedImageIndex > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(selectedImageIndex - 1);
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                )}

                {selectedImageIndex < entry.images.length - 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(selectedImageIndex + 1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                )}

                {/* Image counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
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

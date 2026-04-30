import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { JournalEntryForm } from "./JournalEntryForm";
import { JournalEntryList } from "./JournalEntryList";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { useWateringRecords } from "@/hooks/useWateringRecords";
import { JournalEntry, type PlantMood } from "@/types/journalTypes";

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantId: string;
  plantNickname: string;
  prefetch?: boolean;
}

export const JournalModal = ({
  isOpen,
  onClose,
  plantId,
  plantNickname,
  prefetch = false,
}: JournalModalProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [hasLoadedInitially, setHasLoadedInitially] = useState(false);
  const {
    entries,
    isLoading,
    getJournalStats,
    loadJournalEntries,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    deleteLoadingEntries
  } = useJournalEntries();

  const {
    records: wateringRecords,
    loadWateringRecords,
    isLoading: isLoadingWateringRecords
  } = useWateringRecords();

  const stats = getJournalStats(plantId);

  // Load entries when modal opens or prefetch is requested
  React.useEffect(() => {
    if ((isOpen || prefetch) && plantId && !hasLoadedInitially) {
      Promise.all([
        loadJournalEntries(plantId),
        loadWateringRecords(plantId)
      ]).then(() => {
        setHasLoadedInitially(true);
      });
    }
  }, [isOpen, prefetch, plantId, loadJournalEntries, loadWateringRecords, hasLoadedInitially]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setShowForm(false);
      setEditingEntry(null);
    }
  }, [isOpen]);

  const handleFormSuccess = async () => {
    await loadJournalEntries(plantId);
    setShowForm(false);
    setEditingEntry(null);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingEntry(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-3xl h-[80vh] overflow-y-auto !p-0 flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-6 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <BookOpen className="w-6 h-6 text-plant-primary" />
              {plantNickname}'s Journal
            </DialogTitle>
            {!showForm && (
              <div className="flex gap-4 text-sm text-muted-foreground pt-2 h-7 transition-all duration-200">
                {(stats.totalEntries > 0 || (isLoading && !hasLoadedInitially)) ? (
                  isLoading && !hasLoadedInitially ? (
                    <Skeleton className="w-24 h-5" />
                  ) : (
                    <span>{stats.totalEntries} entries</span>
                  )
                ) : null}
              </div>
            )}
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 flex-grow">
          {!showForm ? (
            <div className="space-y-4">
              <Button
                onClick={() => setShowForm(true)}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700 font-medium shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </Button>

              <JournalEntryList
                entries={entries.filter(e => e.plant_id === plantId)}
                isLoading={!hasLoadedInitially}
                onDeleteEntry={async (entryId) => {
                  await deleteJournalEntry(entryId);
                }}
                onEditEntry={handleEditEntry}
                deleteLoadingEntries={deleteLoadingEntries}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <JournalEntryForm
                plantId={plantId}
                wateringRecords={wateringRecords}
                isLoadingWateringRecords={isLoadingWateringRecords}
                submitButtonText={editingEntry ? 'Save Changes' : 'Add Entry'}
                initialData={editingEntry ? {
                  title: editingEntry.title ?? '',
                  content: editingEntry.content ?? '',
                  mood: (editingEntry.mood as PlantMood) ?? null,
                  entryDate: editingEntry.entry_date ? new Date(editingEntry.entry_date) : new Date(),
                } : undefined}
                onSubmit={async (formData) => {
                  if (editingEntry) {
                    const success = await updateJournalEntry(
                      editingEntry.id,
                      formData.title,
                      formData.content,
                      formData.mood,
                      formData.images,
                      editingEntry.images ?? [],
                      formData.entryDate,
                    );
                    if (success) {
                      await handleFormSuccess();
                    }
                  } else {
                    const success = await addJournalEntry(
                      plantId,
                      formData.title,
                      formData.content,
                      formData.mood,
                      formData.images,
                      formData.entryDate,
                      formData.relatedWateringRecordId
                    );
                    if (success) {
                      await handleFormSuccess();
                    }
                  }
                }}
                isLoading={isLoading}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowForm(false); setEditingEntry(null); }}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

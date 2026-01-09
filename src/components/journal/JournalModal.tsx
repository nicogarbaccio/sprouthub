import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";
import { JournalEntryForm } from "./JournalEntryForm";
import { JournalEntryList } from "./JournalEntryList";
import { useJournalEntries } from "@/hooks/useJournalEntries";

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantId: string;
  plantNickname: string;
}

export const JournalModal = ({
  isOpen,
  onClose,
  plantId,
  plantNickname,
}: JournalModalProps) => {
  const [showForm, setShowForm] = useState(false);
  const {
    entries,
    isLoading,
    getJournalStats,
    loadJournalEntries,
    addJournalEntry,
    deleteJournalEntry,
    deleteLoadingEntries
  } = useJournalEntries();

  const stats = getJournalStats(plantId);

  // Load entries when modal opens
  React.useEffect(() => {
    if (isOpen && plantId) {
      loadJournalEntries(plantId);
    }
  }, [isOpen, plantId, loadJournalEntries]);

  const handleFormSuccess = async () => {
    await loadJournalEntries(plantId);
    setShowForm(false);
  };

  const handleClose = () => {
    setShowForm(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <BookOpen className="w-6 h-6 text-plant-primary" />
            {plantNickname}'s Journal
          </DialogTitle>
          {stats.totalEntries > 0 && !showForm && (
            <div className="flex gap-4 text-sm text-muted-foreground pt-2">
              <span>{stats.totalEntries} entries</span>
            </div>
          )}
        </DialogHeader>

        <div className="mt-4">
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
                isLoading={isLoading}
                onDeleteEntry={async (entryId) => {
                  await deleteJournalEntry(entryId);
                }}
                deleteLoadingEntries={deleteLoadingEntries}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <JournalEntryForm
                onSubmit={async (formData) => {
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
                }}
                isLoading={isLoading}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
                className="w-full border-green-700/30 text-green-700 hover:bg-green-700/10 dark:border-green-600/30 dark:text-green-400 dark:hover:bg-green-600/10"
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

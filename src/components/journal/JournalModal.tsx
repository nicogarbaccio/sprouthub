import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, Droplets, FlaskConical, StickyNote, CalendarIcon, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { JournalEntryForm } from "./JournalEntryForm";
import { JournalEntryList } from "./JournalEntryList";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { useWateringRecords } from "@/hooks/useWateringRecords";
import { JournalEntry, type PlantMood } from "@/types/journalTypes";
import { cn } from "@/lib/utils";
import { format, startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";

type JournalFilter = 'all' | 'watering' | 'fertilization' | 'other';

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
  const [filter, setFilter] = useState<JournalFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
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
        <div className="p-6 pb-0 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <BookOpen className="w-6 h-6 text-plant-primary" />
              {plantNickname}'s Journal
            </DialogTitle>
            <div className="flex gap-4 text-sm text-muted-foreground pt-2 h-7">
              {!showForm && (
                hasLoadedInitially ? (
                  stats.totalEntries > 0 ? (
                    <span>{stats.totalEntries} {stats.totalEntries === 1 ? 'entry' : 'entries'}</span>
                  ) : null
                ) : (
                  <Skeleton className="w-24 h-5" />
                )
              )}
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 pt-4 flex-grow">
          {!hasLoadedInitially ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              <Skeleton className="h-10 w-full rounded-md" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : !showForm ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <Button
                onClick={() => setShowForm(true)}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700 font-medium shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </Button>

              {entries.filter(e => e.plant_id === plantId).length > 0 && (
                <div className="flex gap-1.5 flex-wrap items-center">
                  {([
                    { key: 'all', label: 'All', icon: BookOpen },
                    { key: 'watering', label: 'Waterings', icon: Droplets },
                    { key: 'fertilization', label: 'Fertilizations', icon: FlaskConical },
                    { key: 'other', label: 'Other', icon: StickyNote },
                  ] as const).map(({ key, label, icon: Icon }) => (
                    <Button
                      key={key}
                      size="sm"
                      variant={filter === key ? 'default' : 'outline'}
                      onClick={() => setFilter(key)}
                      className={cn(
                        'text-xs h-8 px-3',
                        filter === key && 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5 mr-1.5" />
                      {label}
                    </Button>
                  ))}

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        size="sm"
                        variant={dateRange?.from ? 'default' : 'outline'}
                        className={cn(
                          'text-xs h-8 px-3 ml-auto',
                          dateRange?.from && 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        )}
                      >
                        <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>{format(dateRange.from, "MMM d")} – {format(dateRange.to, "MMM d")}</>
                          ) : (
                            format(dateRange.from, "MMM d, yyyy")
                          )
                        ) : (
                          "Date range"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={1}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {dateRange?.from && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDateRange(undefined)}
                      className="text-xs h-8 px-2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              )}

              <JournalEntryList
                entries={entries.filter(e => e.plant_id === plantId).filter((entry) => {
                  // Type filter
                  if (filter === 'watering' && entry.title !== 'Watered') return false;
                  if (filter === 'fertilization' && entry.title !== 'Fertilized' && entry.title !== 'Fertilization note') return false;
                  if (filter === 'other' && (entry.title === 'Watered' || entry.title === 'Fertilized' || entry.title === 'Fertilization note')) return false;

                  // Date range filter
                  if (dateRange?.from && entry.entry_date) {
                    const entryDate = new Date(entry.entry_date);
                    if (entryDate < startOfDay(dateRange.from)) return false;
                    if (dateRange.to && entryDate > endOfDay(dateRange.to)) return false;
                  }

                  return true;
                })}
                isLoading={false}
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

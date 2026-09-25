import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, ChevronLeft, Plus, Droplets, FlaskConical, StickyNote, CalendarIcon, X } from "lucide-react";
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
import {
  SheetGrabber,
  dialogSheetClasses,
  sheetHeaderClasses,
  sheetIconButtonClasses,
  sheetPrimaryButtonClasses,
  sheetTitleClasses,
} from "@/components/ui/bento-sheet";

const FILTERS = [
  { key: 'all', label: 'All', icon: BookOpen },
  { key: 'watering', label: 'Waterings', icon: Droplets },
  { key: 'fertilization', label: 'Fertilizations', icon: FlaskConical },
  { key: 'other', label: 'Other', icon: StickyNote },
] as const;

/** Filter chip: white when idle, ink-filled when chosen, like the Settings tabs */
const chipClasses = (active: boolean) =>
  cn(
    'shrink-0 h-10 px-3.5 rounded-full inline-flex items-center gap-1.5 text-[13px] font-bold transition-colors',
    active ? 'bg-foreground text-background' : 'bg-card text-foreground hover:bg-card/80'
  );

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
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Switching between the list and the form starts at the top, so the header is in view
  React.useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [showForm]);

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

  const plantEntries = entries.filter(e => e.plant_id === plantId);
  const closeForm = () => { setShowForm(false); setEditingEntry(null); };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        ref={contentRef}
        className={cn(dialogSheetClasses, "sm:max-w-3xl")}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetGrabber />
        <DialogHeader className={sheetHeaderClasses}>
          {showForm ? (
            <button type="button" onClick={closeForm} className={sheetIconButtonClasses} aria-label="Back to journal">
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-[52px] h-[52px] shrink-0 rounded-[18px] bg-sprout-primary text-sprout-cream flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <DialogTitle className={sheetTitleClasses}>
              {showForm ? (editingEntry ? 'Edit entry' : 'New entry') : 'Journal'}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium truncate">
              {plantNickname}
              {!showForm && hasLoadedInitially && stats.totalEntries > 0 &&
                ` · ${stats.totalEntries} ${stats.totalEntries === 1 ? 'entry' : 'entries'}`}
            </DialogDescription>
          </div>
          <button type="button" onClick={handleClose} className={cn(sheetIconButtonClasses, 'self-start')} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="mt-4">
          {!hasLoadedInitially ? (
            <div className="space-y-2 animate-in fade-in duration-150" aria-busy="true">
              <Skeleton className="h-[60px] w-full rounded-[22px]" />
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-36 w-full rounded-3xl" />
              ))}
            </div>
          ) : !showForm ? (
            <div className="space-y-2 animate-in fade-in duration-200">
              <button type="button" onClick={() => setShowForm(true)} className={sheetPrimaryButtonClasses}>
                <Plus className="w-5 h-5" strokeWidth={2.5} />
                Add Entry
              </button>

              {plantEntries.length > 0 && (
                <div className="flex gap-1.5 items-center overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 py-1">
                  {FILTERS.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={filter === key}
                      onClick={() => setFilter(key)}
                      className={chipClasses(filter === key)}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}

                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className={cn(chipClasses(!!dateRange?.from), 'sm:ml-auto')}>
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>{format(dateRange.from, "MMM d")} – {format(dateRange.to, "MMM d")}</>
                          ) : (
                            format(dateRange.from, "MMM d, yyyy")
                          )
                        ) : (
                          "Date range"
                        )}
                      </button>
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
                    <button
                      type="button"
                      onClick={() => setDateRange(undefined)}
                      className="shrink-0 w-10 h-10 rounded-full bg-card text-muted-foreground hover:text-foreground flex items-center justify-center"
                      aria-label="Clear date range"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              <JournalEntryList
                entries={plantEntries.filter((entry) => {
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
            <JournalEntryForm
              plantId={plantId}
              heading={null}
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

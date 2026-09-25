import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Clock, Droplets, X } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import type { WateringRecord } from "@/hooks/useWateringRecords";
import { replaceNotesText, stripNotesPrefixes } from "@/utils/watering/notesPrefixes";
import { FieldLabel } from "@/components/settings/SettingsUI";
import {
  SheetGrabber,
  dialogSheetClasses,
  sheetHeaderClasses,
  sheetIconButtonClasses,
  sheetPrimaryButtonClasses,
  sheetSecondaryButtonClasses,
  sheetTitleClasses,
} from "@/components/ui/bento-sheet";

interface EditWateringRecordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  record: WateringRecord | null;
  onUpdate: (recordId: string, date: Date, notes?: string) => Promise<boolean>;
}

function EditWateringRecordDialog({
  isOpen,
  onClose,
  record,
  onUpdate,
}: EditWateringRecordDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when dialog opens with a new record
  useEffect(() => {
    if (record && isOpen) {
      setSelectedDate(new Date(record.watered_at));
      // Only the user's own text is editable; the system prefix is restored on save
      setNotes(stripNotesPrefixes(record.notes));
    }
  }, [record, isOpen]);

  const handleSave = async () => {
    if (!record || !selectedDate) return;

    setIsLoading(true);
    try {
      const success = await onUpdate(
        record.id,
        selectedDate,
        replaceNotesText(record.notes, notes) ?? undefined
      );
      if (success) {
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
    // Reset form after animation completes
    setTimeout(() => {
      setSelectedDate(undefined);
      setNotes("");
    }, 200);
  };

  const isPostponement = record?.is_postponement;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className={cn(dialogSheetClasses, "sm:max-w-md")}>
        <SheetGrabber />
        <DialogHeader className={sheetHeaderClasses}>
          <div
            className={cn(
              "w-[52px] h-[52px] shrink-0 rounded-[18px] text-sprout-dark flex items-center justify-center",
              isPostponement ? "bg-sprout-cream" : "bg-sprout-water"
            )}
          >
            {isPostponement ? <Clock className="w-6 h-6" /> : <Droplets className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className={sheetTitleClasses}>
              {isPostponement ? "Edit postponement" : "Edit watering"}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium">
              {record ? format(new Date(record.watered_at), "EEEE, MMM d") : ""}
            </DialogDescription>
          </div>
          <button type="button" onClick={handleCancel} className={cn(sheetIconButtonClasses, "self-start")} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="mt-4 space-y-2">
          <div className="rounded-3xl bg-card p-4">
            <FieldLabel>{isPostponement ? "Postponed until" : "Date watered"}</FieldLabel>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "w-full h-12 rounded-2xl bg-field px-4 inline-flex items-center gap-2 text-[15px] font-semibold",
                    selectedDate ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  // A postponement is a date the user chose to wait until, so it lives in the future
                  disabled={(date) =>
                    isPostponement
                      ? date < startOfDay(new Date())
                      : date > new Date() || date < new Date("1900-01-01")
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          <Textarea
            id="edit-notes"
            aria-label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this watering..."
            rows={3}
            className="resize-none rounded-[20px] border-0 bg-card px-4 py-3.5 text-[15px] placeholder:text-neutral-medium"
          />
        </div>

        <div className="flex gap-2 mt-3">
          <button type="button" onClick={handleCancel} disabled={isLoading} className={cn(sheetSecondaryButtonClasses, "flex-1")}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!selectedDate || isLoading}
            className={cn(sheetPrimaryButtonClasses, "flex-[1.3]")}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EditWateringRecordDialog;

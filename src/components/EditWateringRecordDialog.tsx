import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { WateringRecord } from "@/hooks/useWateringRecords";

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
      setNotes(record.notes || "");
    }
  }, [record, isOpen]);

  const handleSave = async () => {
    if (!record || !selectedDate) return;

    setIsLoading(true);
    try {
      const success = await onUpdate(record.id, selectedDate, notes);
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

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Watering Record</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Date Watered</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes (optional)</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this watering..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedDate || isLoading}
            className="bg-sprout-cream hover:bg-sprout-cream/90 text-sprout-dark font-semibold px-6"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditWateringRecordDialog;


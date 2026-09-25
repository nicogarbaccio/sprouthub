import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { FieldLabel } from "@/components/settings/SettingsUI";

interface WateringRecordFormProps {
  onAddWatering: (date: Date, notes: string) => Promise<void>;
}

const WateringRecordForm = ({ onAddWatering }: WateringRecordFormProps) => {
  const [newWateringDate, setNewWateringDate] = useState<Date>();
  const [newWateringNotes, setNewWateringNotes] = useState("");

  const handleAddWatering = async () => {
    if (!newWateringDate) return;

    await onAddWatering(newWateringDate, newWateringNotes);
    setNewWateringDate(undefined);
    setNewWateringNotes("");
  };

  return (
    <div data-testid="watering-record-form" className="rounded-3xl bg-card p-4 space-y-3">
      <h4 className="text-[15px] font-bold text-foreground">Add a past watering</h4>

      <div>
        <FieldLabel>Date Watered</FieldLabel>
        <Popover>
          <PopoverTrigger asChild>
            <button
              data-testid="watering-date-picker-button"
              type="button"
              className={cn(
                "w-full h-12 rounded-2xl bg-field px-4 inline-flex items-center gap-2 text-[15px] font-semibold",
                newWateringDate ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              {newWateringDate ? format(newWateringDate, "PPP") : "Pick a date"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              data-testid="watering-date-calendar"
              mode="single"
              selected={newWateringDate}
              onSelect={setNewWateringDate}
              disabled={(date) => date > new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <Textarea
        data-testid="watering-notes-input"
        id="notes"
        aria-label="Notes (optional)"
        value={newWateringNotes}
        onChange={(e) => setNewWateringNotes(e.target.value)}
        placeholder="Notes (optional)"
        rows={2}
        className="resize-none rounded-2xl border-0 bg-field px-4 py-3 text-[15px] font-medium focus-visible:ring-2 focus-visible:ring-offset-0"
      />

      <button
        data-testid="add-watering-record-button"
        type="button"
        onClick={handleAddWatering}
        disabled={!newWateringDate}
        className="w-full h-12 rounded-[18px] bg-sprout-water text-sprout-dark font-bold text-[15px] inline-flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        Add Watering Record
      </button>
    </div>
  );
};

export default WateringRecordForm;

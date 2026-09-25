import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, isToday, isYesterday, subDays } from "date-fns";
import { cn } from "@/lib/utils";

interface LastWateredPickerProps {
  lastWateredDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

/** Today / Yesterday / a picked date, stacked in a tile. */
export const LastWateredPicker = ({
  lastWateredDate,
  onDateChange,
}: LastWateredPickerProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const today = !!lastWateredDate && isToday(lastWateredDate);
  const yesterday = !!lastWateredDate && isYesterday(lastWateredDate);
  const other = !!lastWateredDate && !today && !yesterday;

  const optionClass = (selected: boolean) =>
    cn(
      "h-10 rounded-[14px] flex items-center px-3 font-bold text-sm text-left transition-colors",
      selected ? "bg-sprout-cream text-sprout-dark" : "bg-field text-foreground"
    );

  return (
    <div className="rounded-card bg-card p-4 flex flex-col gap-1.5" role="radiogroup" aria-label="Last watered">
      <div className="text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground">
        Last watered
      </div>
      <button type="button" role="radio" aria-checked={today} className={optionClass(today)} onClick={() => onDateChange(new Date())}>
        Today
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={yesterday}
        className={optionClass(yesterday)}
        onClick={() => onDateChange(subDays(new Date(), 1))}
      >
        Yesterday
      </button>
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="radio"
            aria-checked={other}
            className={optionClass(other)}
            data-testid="last-watered-date-trigger"
          >
            {other ? format(lastWateredDate!, "MMM d") : "Pick a date"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-2xl" align="end">
          <Calendar
            mode="single"
            selected={lastWateredDate}
            onSelect={(date) => {
              onDateChange(date);
              setCalendarOpen(false);
            }}
            disabled={{ after: new Date() }}
            initialFocus
          />
          <div className="p-3 border-t">
            <button
              type="button"
              className="w-full h-10 rounded-xl bg-field text-sm font-bold"
              onClick={() => {
                onDateChange(undefined);
                setCalendarOpen(false);
              }}
            >
              I don't know
            </button>
          </div>
        </PopoverContent>
      </Popover>
      {!lastWateredDate && (
        <p className="text-xs font-semibold text-sprout-warning px-1 mt-0.5">
          No date set, so the first reminder may be off.
        </p>
      )}
    </div>
  );
};

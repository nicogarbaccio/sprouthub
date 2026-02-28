import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface LastWateredPickerProps {
  lastWateredDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

export const LastWateredPicker = ({
  lastWateredDate,
  onDateChange,
}: LastWateredPickerProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-plant-text dark:text-zinc-200">
        Last Watered
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal border-plant-secondary/30 focus:border-plant-primary"
            data-testid="last-watered-date-trigger"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {lastWateredDate
              ? format(lastWateredDate, "PPP")
              : "Select date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={lastWateredDate}
            onSelect={onDateChange}
            initialFocus
          />
          <div className="p-3 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onDateChange(undefined)}
            >
              Clear Date
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {!lastWateredDate && (
        <div className="flex items-center gap-2 p-2 bg-sprout-warning/10 border border-sprout-warning/30 rounded-md">
          <AlertTriangle className="h-4 w-4 text-sprout-warning" />
          <p className="text-sm text-sprout-warning">
            No last watering date set - watering schedule calculations may
            be inaccurate
          </p>
        </div>
      )}
    </div>
  );
};

import { useMemo, useState } from "react";
import { Moon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  confirmCancelClasses,
  confirmDialogClasses,
  confirmIconClasses,
  confirmPrimaryClasses,
  confirmTitleClasses,
  settingsInputClasses,
} from "@/components/settings/SettingsUI";
import { cn } from "@/lib/utils";
import { getNextSeasonChange, formatSeasonName, resolveHemisphereFromEnvironment } from "@/utils/season";
import { toDateOnly } from "@/utils/watering/restPeriod";

interface RestPauseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plantName: string;
  onPause: (until: string) => Promise<unknown>;
}

const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

/** Manually pause any plant's watering reminders until a chosen date. */
const RestPauseDialog = ({ open, onOpenChange, plantName, onPause }: RestPauseDialogProps) => {
  const presets = useMemo(() => {
    const next = getNextSeasonChange(new Date(), resolveHemisphereFromEnvironment().hemisphere);
    return [
      { label: "2 weeks", date: toDateOnly(addDays(14)) },
      { label: "1 month", date: toDateOnly(addDays(30)) },
      { label: `Until ${formatSeasonName(next.season).toLowerCase()}`, date: toDateOnly(next.date) },
    ];
  }, []);
  const [until, setUntil] = useState(presets[0].date);
  const tomorrow = toDateOnly(addDays(1));

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={confirmDialogClasses}>
        <AlertDialogHeader className="text-left">
          <div className="flex items-center gap-3 mb-1">
            <div className={cn(confirmIconClasses, "bg-field text-foreground")}>
              <Moon className="w-6 h-6" />
            </div>
            <AlertDialogTitle className={confirmTitleClasses}>Pause watering reminders?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-[15px]">
            {plantName} won't show as due or send reminders until the date you pick. Useful for a
            dormant plant, or a tuber you've stored for the season.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Pause length">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setUntil(preset.date)}
              aria-pressed={until === preset.date}
              className={cn(
                "h-10 px-3.5 rounded-xl text-sm font-bold",
                until === preset.date ? "bg-sprout-dark text-sprout-cream" : "bg-card text-foreground"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="text-[13px] font-semibold text-muted-foreground">Pause until</span>
          <input
            type="date"
            value={until}
            min={tomorrow}
            onChange={(e) => setUntil(e.target.value)}
            className={cn(settingsInputClasses, "mt-1 w-full px-4 bg-card")}
          />
        </label>

        <AlertDialogFooter>
          <AlertDialogCancel className={confirmCancelClasses}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={confirmPrimaryClasses}
            disabled={!until || until < tomorrow}
            onClick={() => onPause(until)}
          >
            Pause reminders
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RestPauseDialog;

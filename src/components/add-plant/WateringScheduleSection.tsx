import { Minus, Plus } from "lucide-react";

interface WateringScheduleSectionProps {
  wateringScheduleDays: number;
  onDaysChange: (days: number) => void;
}

const MIN_DAYS = 1;
const MAX_DAYS = 365;

/** "Water every N days" tile with a − / + stepper. */
export const WateringScheduleSection = ({
  wateringScheduleDays,
  onDaysChange,
}: WateringScheduleSectionProps) => {
  const set = (days: number) => onDaysChange(Math.max(MIN_DAYS, Math.min(MAX_DAYS, days)));

  return (
    <div className="rounded-card bg-sprout-water text-sprout-dark p-4" data-testid="watering-schedule-trigger">
      <div className="text-xs font-bold tracking-[0.8px] uppercase">Water every</div>
      <div className="font-display text-[40px] font-extrabold leading-none mt-2" aria-live="polite">
        {wateringScheduleDays}
        <span className="text-base"> {wateringScheduleDays === 1 ? "day" : "days"}</span>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={() => set(wateringScheduleDays - 1)}
          disabled={wateringScheduleDays <= MIN_DAYS}
          className="w-12 h-11 rounded-[14px] bg-sprout-dark text-sprout-water flex items-center justify-center disabled:opacity-40"
          aria-label="Fewer days between waterings"
          data-testid="watering-days-decrease"
        >
          <Minus className="w-5 h-5" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => set(wateringScheduleDays + 1)}
          disabled={wateringScheduleDays >= MAX_DAYS}
          className="w-12 h-11 rounded-[14px] bg-sprout-dark text-sprout-water flex items-center justify-center disabled:opacity-40"
          aria-label="More days between waterings"
          data-testid="watering-days-increase"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

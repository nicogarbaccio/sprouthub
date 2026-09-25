import { capitalize, cn } from "@/lib/utils";
import type { SmartScheduleResult } from "@/utils/watering/smartSchedule";
import { sheetPrimaryButtonClasses, sheetSecondaryButtonClasses } from "@/components/ui/bento-sheet";

interface StepResultsProps {
  result: SmartScheduleResult;
  onStartOver: () => void;
  onApplySchedule: () => void;
}

export const StepResults = ({ result, onStartOver, onApplySchedule }: StepResultsProps) => {
  const adjustment = result.totalAdjustment;

  return (
    <div className="space-y-2">
      {/* Main result */}
      <div className="rounded-card bg-sprout-water text-sprout-dark p-5">
        <div className="text-xs font-bold tracking-[0.8px] uppercase">Recommended schedule</div>
        <div className="font-display text-[40px] font-extrabold leading-none mt-2" data-testid="recommended-days">
          Every {result.recommendedDays}
          <span className="text-base"> {result.recommendedDays === 1 ? "day" : "days"}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3.5">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full border-[1.5px] border-sprout-dark">
            Base {result.baseDays} days
          </span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full border-[1.5px] border-sprout-dark">
            {adjustment === 0 ? "No adjustment needed" : `${adjustment > 0 ? "+" : ""}${adjustment} days`}
          </span>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full bg-sprout-dark text-sprout-water"
            data-testid="confidence-level"
          >
            {capitalize(result.confidence)} confidence
          </span>
        </div>
      </div>

      {result.adjustmentReasons.length > 0 && (
        <div className="rounded-3xl bg-card p-4">
          <h4 className="text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground">Why this schedule?</h4>
          <ul className="space-y-2 mt-2.5" data-testid="adjustment-reasons">
            {result.adjustmentReasons.map((reason, index) => (
              <li key={index} className="text-sm text-foreground leading-snug flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sprout-light mt-1.5 shrink-0" aria-hidden="true" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onStartOver} className={cn(sheetSecondaryButtonClasses, "flex-1")}>
          Adjust Settings
        </button>
        <button
          type="button"
          onClick={onApplySchedule}
          className={cn(sheetPrimaryButtonClasses, "flex-[1.3]")}
          data-testid="apply-button"
        >
          Use This Schedule
        </button>
      </div>
    </div>
  );
};

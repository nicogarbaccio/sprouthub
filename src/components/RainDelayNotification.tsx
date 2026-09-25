import { CloudRain, Calendar } from "lucide-react";
import { RainDelayAdvice } from "@/utils/watering/rainDelay";
import { cn } from "@/lib/utils";

interface RainDelayNotificationProps {
  /** Advice from `getRainDelayAdvice`. Render nothing when there is none. */
  advice: RainDelayAdvice | null | undefined;
  plantName?: string;
  onWaterAnyway?: () => void;
  onPostpone?: (days: number) => void;
  className?: string;
}

/** Water-blue tile on an outdoor plant's page when rain is due to do the watering */
export function RainDelayNotification({
  advice,
  plantName,
  onWaterAnyway,
  onPostpone,
  className,
}: RainDelayNotificationProps) {
  if (!advice) {
    return null;
  }

  const plantRef = plantName || "this plant";
  const delayDays = advice.suggestedDelayDays;

  return (
    <div role="status" className={cn("rounded-tile bg-sprout-water text-sprout-dark p-[18px] md:p-6", className)}>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 shrink-0 rounded-[14px] bg-sprout-dark text-sprout-water flex items-center justify-center">
          <CloudRain className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-display text-lg font-bold tracking-[-0.02em]">Rain expected</h4>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sprout-dark text-sprout-water">
              {advice.rainProbability}% chance
            </span>
          </div>
          <p className="text-[15px] font-medium mt-1">
            {`${plantRef} is due, but ${advice.reason.charAt(0).toLowerCase()}${advice.reason.slice(1)}.`}
          </p>
          {advice.nextCheckDate && (
            <p className="flex items-center gap-1.5 text-[13px] font-semibold mt-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Check again on {advice.nextCheckDate.toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {(onWaterAnyway || onPostpone) && (
        <div className="flex gap-2 mt-4">
          {onWaterAnyway && (
            <button
              type="button"
              onClick={onWaterAnyway}
              className="flex-1 h-12 rounded-[18px] border-[1.5px] border-sprout-dark font-bold text-[15px]"
            >
              Water Anyway
            </button>
          )}
          {onPostpone && (
            <button
              type="button"
              onClick={() => onPostpone(delayDays)}
              className="flex-[1.3] h-12 rounded-[18px] bg-sprout-dark text-sprout-water font-bold text-[15px]"
            >
              Postpone {delayDays} day{delayDays !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Moon } from "lucide-react";
import { formatSeasonName } from "@/utils/season";
import { toDateOnly, type ActiveRestPeriod } from "@/utils/watering/restPeriod";

const primaryButton =
  "h-12 px-4 rounded-[18px] bg-sprout-dark text-sprout-cream font-bold text-[15px] shadow-[inset_0_0_0_2px_#dfc490] hover:bg-sprout-dark/90 disabled:opacity-50 disabled:shadow-none inline-flex items-center justify-center";
const secondaryButton =
  "h-12 px-4 rounded-[18px] bg-field text-foreground font-bold text-[15px] hover:bg-field/80 disabled:opacity-50";

const monthDay = (date: Date, utc = false) =>
  date.toLocaleDateString("en-US", { month: "long", day: "numeric", ...(utc && { timeZone: "UTC" }) });

interface RestPeriodCardProps {
  plantName: string;
  /** The species' current rest period, if it is in one */
  period: ActiveRestPeriod | null;
  /** Set while reminders are paused (from calculateWateringSchedule) */
  restUntil?: Date;
  /** Whether to offer the pause (false once the user chose "keep reminding me") */
  showSuggestion: boolean;
  onPause: (until: string) => Promise<unknown>;
  onResume: () => Promise<unknown>;
  onKeepReminders: () => void;
}

/**
 * Offers to pause watering reminders when a plant enters a rest period, and shows the pause
 * while it's in effect. Renders nothing otherwise.
 */
const RestPeriodCard = ({
  plantName,
  period,
  restUntil,
  showSuggestion,
  onPause,
  onResume,
  onKeepReminders,
}: RestPeriodCardProps) => {
  const [busy, setBusy] = useState(false);
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  if (!restUntil && !(period && showSuggestion)) return null;

  const title = restUntil
    ? `Resting until ${monthDay(restUntil, true)}`
    : `${formatSeasonName(period!.season)} rest`;

  return (
    <section className="rounded-card bg-card p-[18px] md:p-6" data-testid="rest-period-card">
      <h2 className="flex items-center gap-2.5 font-display text-xl font-bold tracking-[-0.02em] text-foreground">
        <span className="w-9 h-9 rounded-xl bg-field text-foreground flex items-center justify-center shrink-0">
          <Moon className="w-[18px] h-[18px]" />
        </span>
        {title}
      </h2>
      <p className="text-[15px] text-foreground leading-snug mt-3">
        {period?.note ?? `Watering reminders for ${plantName} are paused.`}
      </p>
      {restUntil ? (
        <>
          <p className="text-sm text-muted-foreground mt-2">
            {plantName} won't show as due until then. Water it sooner if the care notes above call for it.
          </p>
          <button type="button" className={`${secondaryButton} mt-4`} disabled={busy} onClick={() => run(onResume)}>
            Resume watering reminders
          </button>
        </>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <button
            type="button"
            className={primaryButton}
            disabled={busy}
            onClick={() => run(() => onPause(toDateOnly(period!.endsOn)))}
          >
            Pause reminders until {monthDay(period!.endsOn)}
          </button>
          <button type="button" className={secondaryButton} disabled={busy} onClick={onKeepReminders}>
            Keep reminding me
          </button>
        </div>
      )}
    </section>
  );
};

export default RestPeriodCard;

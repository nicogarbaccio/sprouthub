import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Moon } from "lucide-react";
import { HomeBanner } from "@/components/dashboard/HomeBanner";
import { formatSeasonName } from "@/utils/season";
import { toDateOnly } from "@/utils/watering/restPeriod";
import type { RestSuggestion } from "@/hooks/useRestSuggestions";

interface RestPeriodBannerProps {
  suggestions: RestSuggestion[];
  onPause: (plantId: string, until: string) => Promise<boolean>;
  onKeepReminders: (suggestion: RestSuggestion) => void;
}

const monthDay = (date: Date) => date.toLocaleDateString("en-US", { month: "long", day: "numeric" });

/**
 * Dashboard reminder for plants entering a rest period (e.g. a Lithops' dry winter), offering
 * to pause their watering reminders. Uses the same suggestions as the plant page card.
 */
export function RestPeriodBanner({ suggestions, onPause, onKeepReminders }: RestPeriodBannerProps) {
  const [pausingId, setPausingId] = useState<string | null>(null);

  const pause = async ({ plant, period }: RestSuggestion) => {
    setPausingId(plant.id);
    try {
      await onPause(plant.id, toDateOnly(period.endsOn));
    } finally {
      setPausingId(null);
    }
  };

  const title =
    suggestions.length === 1
      ? `${suggestions[0].plant.nickname} is starting its ${suggestions[0].period.season} rest`
      : `${suggestions.length} plants are starting a rest period`;

  return (
    <HomeBanner
      testId="rest-period-banner"
      tileClasses="bg-field"
      icon={Moon}
      chip={<>Rest period</>}
      title={title}
      onDismiss={() => suggestions.forEach(onKeepReminders)}
      dismissLabel="Keep reminding me"
      action={{
        label: suggestions.length === 1 ? "Pause reminders" : "Pause all",
        icon: Moon,
        onClick: () => suggestions.forEach(pause),
      }}
    >
      <p className="max-w-[60ch]">
        Some plants need little or no water while they rest. Pausing stops their watering reminders
        until the season changes.
      </p>
      <ul className="mt-3 space-y-1.5">
        {suggestions.map((suggestion) => {
          const { plant, period } = suggestion;
          return (
            <li key={plant.id} className="flex items-center gap-3 rounded-[18px] bg-sprout-dark/[0.07] pl-4 pr-2 py-2">
              <div className="min-w-0 flex-1 leading-tight">
                <Link
                  to={`/my-plants/${plant.id}`}
                  className="text-[15px] font-bold hover:underline underline-offset-2 block truncate [min-height:unset]"
                >
                  {plant.nickname}
                </Link>
                <span className="text-[13px] font-medium opacity-80 block mt-0.5">
                  {formatSeasonName(period.season)} rest · until {monthDay(period.endsOn)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => pause(suggestion)}
                disabled={pausingId === plant.id}
                className="shrink-0 h-10 px-3.5 rounded-xl bg-sprout-dark text-sprout-cream text-[13px] font-bold inline-flex items-center gap-1.5 disabled:opacity-60"
              >
                {pausingId === plant.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pause"}
              </button>
            </li>
          );
        })}
      </ul>
    </HomeBanner>
  );
}

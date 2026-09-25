import { Calendar } from "lucide-react";
import { Season, UpcomingSeasonChange } from "@/services/calendarSeasonalService";
import { HomeBanner, SEASON_TILE } from "@/components/dashboard/HomeBanner";
import { SEASON_ICONS } from "@/components/SeasonalReviewBanner";
import { capitalize } from "@/lib/utils";

interface CalendarSeasonalBannerProps {
  upcomingChange: UpcomingSeasonChange;
  plantCount: number;
  onReviewClick: () => void;
  onDismiss: () => void;
  onSnooze: (days: number) => void;
}

const GUIDANCE: Record<Season, string> = {
  spring:
    "As we transition to spring, most plants need more frequent watering due to active growth and warming temperatures.",
  summer: "Summer heat and longer daylight hours mean most plants need much more frequent watering.",
  fall: "As we transition to fall, most plants need less frequent watering as temperatures cool and growth slows.",
  winter: "Winter dormancy and reduced light mean most plants need much less frequent watering.",
};

export function CalendarSeasonalBanner({
  upcomingChange,
  plantCount,
  onReviewClick,
  onDismiss,
  onSnooze,
}: CalendarSeasonalBannerProps) {
  const { nextSeason: season, daysUntilChange } = upcomingChange;
  const name = capitalize(season);
  const title =
    daysUntilChange === 0
      ? `${name} begins today`
      : daysUntilChange === 1
        ? `${name} starts tomorrow`
        : `${name} starts in ${daysUntilChange} days`;

  return (
    <HomeBanner
      tileClasses={SEASON_TILE[season]}
      icon={SEASON_ICONS[season]}
      chip={upcomingChange.changeDate.toLocaleDateString(undefined, { month: "long", day: "numeric" })}
      title={title}
      onDismiss={onDismiss}
      dismissLabel="Dismiss season reminder"
      snoozeOptions={[
        { label: "3 days", onClick: () => onSnooze(3) },
        { label: "1 week", onClick: () => onSnooze(7) },
      ]}
      action={{ label: "Review schedules", icon: Calendar, onClick: onReviewClick }}
    >
      <p>{GUIDANCE[season]}</p>
      <p className="text-[13px] font-bold mt-1.5">
        {plantCount > 0
          ? `${plantCount} plant${plantCount !== 1 ? "s" : ""} may benefit from schedule adjustments`
          : "Review your plant watering schedules for the new season"}
      </p>
    </HomeBanner>
  );
}

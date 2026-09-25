import React from "react";
import { Calendar, Sun, Snowflake, Flower, Leaf } from "lucide-react";
import { Season, SeasonalTransition } from "@/services/seasonalDetectionService";
import { HomeBanner, SEASON_TILE } from "@/components/dashboard/HomeBanner";
import { capitalize } from "@/lib/utils";

interface SeasonalReviewBannerProps {
  transition: SeasonalTransition;
  plantsNeedingReview: number;
  onReviewClick: () => void;
  onDismiss: () => void;
  onSnooze: (weeks: number) => void;
}

export const SEASON_ICONS: Record<Season, React.ComponentType<{ className?: string }>> = {
  spring: Flower,
  summer: Sun,
  fall: Leaf,
  winter: Snowflake,
};

export function SeasonalReviewBanner({
  transition,
  plantsNeedingReview,
  onReviewClick,
  onDismiss,
  onSnooze,
}: SeasonalReviewBannerProps) {
  const season = transition.to_season;

  return (
    <HomeBanner
      testId="seasonal-review-banner-alert"
      tileClasses={SEASON_TILE[season]}
      icon={SEASON_ICONS[season]}
      chip={<span data-testid="seasonal-confidence-badge">{capitalize(transition.confidence)} confidence</span>}
      title={`${capitalize(season)} has arrived`}
      titleTestId="seasonal-banner-title"
      onDismiss={onDismiss}
      dismissLabel="Dismiss seasonal review"
      dismissTestId="dismiss-seasonal-banner-button"
      snoozeOptions={[
        { label: "1 week", onClick: () => onSnooze(1), testId: "snooze-1-week-button" },
        { label: "2 weeks", onClick: () => onSnooze(2), testId: "snooze-2-weeks-button" },
      ]}
      action={{ label: "Review schedules", icon: Calendar, onClick: onReviewClick, testId: "review-schedules-button" }}
    >
      <div data-testid="seasonal-banner-description">
        <p>
          <strong className="font-bold">{plantsNeedingReview}</strong> plant{plantsNeedingReview !== 1 ? "s" : ""}{" "}
          {plantsNeedingReview === 1 ? "needs" : "need"} a seasonal watering review.
        </p>
        {transition.triggering_factors.length > 0 && (
          <p className="text-[13px] opacity-80 mt-1">
            <span className="font-bold">Detected changes:</span> {transition.triggering_factors.join(", ")}
          </p>
        )}
      </div>
    </HomeBanner>
  );
}

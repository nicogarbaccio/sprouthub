import { Brain, Eye } from "lucide-react";
import { HomeBanner } from "@/components/dashboard/HomeBanner";

export interface PlantWithSuggestions {
  id: string;
  name: string;
  suggestionsCount: number;
  highPrioritySuggestions: number;
}

interface SmartSuggestionsBannerProps {
  plantsWithSuggestions: PlantWithSuggestions[];
  totalSuggestions: number;
  onReviewClick: () => void;
  onDismiss: () => void;
  onSnooze: (weeks: number) => void;
}

export function SmartSuggestionsBanner({
  plantsWithSuggestions,
  totalSuggestions,
  onReviewClick,
  onDismiss,
  onSnooze,
}: SmartSuggestionsBannerProps) {
  const plantsCount = plantsWithSuggestions.length;
  const highPriorityCount = plantsWithSuggestions.reduce(
    (sum, plant) => sum + plant.highPrioritySuggestions,
    0
  );

  return (
    <HomeBanner
      testId="smart-suggestions-banner-alert"
      tileClasses="bg-sprout-light"
      icon={Brain}
      chip={highPriorityCount > 0 ? <span data-testid="high-priority-badge">{highPriorityCount} high priority</span> : undefined}
      title={
        plantsCount === 1
          ? `Watering insights for ${plantsWithSuggestions[0].name}`
          : `Watering insights for ${plantsCount} plants`
      }
      titleTestId="smart-banner-title"
      onDismiss={onDismiss}
      dismissLabel="Dismiss suggestions"
      dismissTestId="dismiss-smart-banner-button"
      snoozeOptions={[
        { label: "1 week", onClick: () => onSnooze(1), testId: "snooze-suggestions-1-week-button" },
        { label: "2 weeks", onClick: () => onSnooze(2), testId: "snooze-suggestions-2-weeks-button" },
      ]}
      action={{ label: "Review", icon: Eye, onClick: onReviewClick, testId: "review-suggestions-button" }}
    >
      <div data-testid="smart-banner-description">
        <p>
          <strong className="font-bold">{totalSuggestions}</strong> suggestion{totalSuggestions !== 1 ? "s" : ""} to
          help fine-tune your watering.
        </p>
        {plantsCount > 1 && (
          <p className="text-[13px] opacity-80 mt-1">
            {plantsWithSuggestions
              .slice(0, 3)
              .map((p) => p.name)
              .join(", ")}
            {plantsCount > 3 && ` and ${plantsCount - 3} more`}
          </p>
        )}
      </div>
    </HomeBanner>
  );
}

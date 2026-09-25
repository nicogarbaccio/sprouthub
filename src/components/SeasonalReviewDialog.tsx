import { SeasonalScheduleSuggestion } from "@/services/scheduleVersioningService";
import { Season } from "@/services/seasonalDetectionService";
import { ScheduleReviewSheet } from "@/components/seasonal/ScheduleReviewSheet";
import { SEASON_TILE } from "@/components/dashboard/HomeBanner";
import { SEASON_ICONS } from "@/components/SeasonalReviewBanner";
import { capitalize } from "@/lib/utils";

interface SeasonalReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  season: Season;
  suggestions: SeasonalScheduleSuggestion[];
  isLoading: boolean;
  onApplySuggestion: (plantId: string, days: number) => Promise<void>;
  onApplyAll: () => Promise<void>;
  onCustomize: (plantId: string, days: number) => Promise<void>;
  appliedSuggestions: Set<string>;
}

/** Weather-based seasonal review: the detected season change and a suggestion per plant */
export function SeasonalReviewDialog({
  isOpen,
  onClose,
  season,
  suggestions,
  isLoading,
  onApplySuggestion,
  onApplyAll,
  onCustomize,
  appliedSuggestions,
}: SeasonalReviewDialogProps) {
  return (
    <ScheduleReviewSheet
      testId="seasonal-review-dialog"
      titleTestId="seasonal-review-dialog-title"
      isOpen={isOpen}
      onClose={onClose}
      icon={SEASON_ICONS[season]}
      iconClasses={SEASON_TILE[season]}
      title={`${capitalize(season)} schedule review`}
      description="Suggestions based on weather patterns and your care history"
      isLoading={isLoading}
      maxCustomDays={30}
      onApply={(plantId, days, custom) => (custom ? onCustomize(plantId, days) : onApplySuggestion(plantId, days))}
      onApplyAll={onApplyAll}
      items={suggestions.map((s) => ({
        plantId: s.plant_id,
        nickname: s.plant_nickname,
        currentDays: s.current_watering_days,
        suggestedDays: s.suggested_days,
        reasoning: s.reasoning,
        tags: [`${capitalize(s.confidence)} confidence`, capitalize(s.based_on.replace(/_/g, " "))],
        note: s.previous_schedule
          ? `Last year: ${s.previous_schedule.days} days (${s.previous_schedule.performance} performance)`
          : undefined,
        applied: appliedSuggestions.has(s.plant_id) ? {} : false,
      }))}
    />
  );
}

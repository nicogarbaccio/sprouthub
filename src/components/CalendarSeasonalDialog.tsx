import { toast } from "sonner";
import { Season } from "@/services/calendarSeasonalService";
import { PlantSeasonalSuggestion } from "@/hooks/useCalendarSeasonalNotification";
import { ScheduleReviewSheet } from "@/components/seasonal/ScheduleReviewSheet";
import { SEASON_TILE } from "@/components/dashboard/HomeBanner";
import { SEASON_ICONS } from "@/components/SeasonalReviewBanner";
import { capitalize } from "@/lib/utils";

interface CalendarSeasonalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  season: Season;
  changeDate: Date;
  suggestions: PlantSeasonalSuggestion[];
  isLoading: boolean;
  onApplySuggestion: (plantId: string, days: number) => Promise<void>;
  onApplyAll: () => Promise<void>;
  appliedPlants: Map<string, number>;
}

/** Calendar-based seasonal review, for when weather is off */
export function CalendarSeasonalDialog({
  isOpen,
  onClose,
  season,
  changeDate,
  suggestions,
  isLoading,
  onApplySuggestion,
  onApplyAll,
  appliedPlants,
}: CalendarSeasonalDialogProps) {
  const pendingCount = suggestions.filter((s) => !appliedPlants.has(s.plantId)).length;

  const handleApplyAll = async () => {
    try {
      await onApplyAll();
      toast.success("Schedules Updated", {
        description: `Successfully updated schedules for ${pendingCount} plants.`,
      });
    } catch {
      toast.error("Error", {
        description: "Failed to update schedules. Please try again.",
      });
    }
  };

  return (
    <ScheduleReviewSheet
      isOpen={isOpen}
      onClose={onClose}
      icon={SEASON_ICONS[season]}
      iconClasses={SEASON_TILE[season]}
      title={`${capitalize(season)} schedule review`}
      description={`Watering schedules for ${season} · ${changeDate.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })}`}
      isLoading={isLoading}
      maxCustomDays={45}
      onApply={(plantId, days) => onApplySuggestion(plantId, days)}
      onApplyAll={handleApplyAll}
      items={suggestions.map((s) => ({
        plantId: s.plantId,
        nickname: s.plantNickname,
        plantType: s.plantType,
        isOutdoor: s.isOutdoor,
        currentDays: s.currentWateringDays,
        suggestedDays: s.suggestedWateringDays,
        reasoning: s.reasoning ? [s.reasoning] : [],
        applied: appliedPlants.has(s.plantId) ? { days: appliedPlants.get(s.plantId) } : false,
      }))}
    />
  );
}

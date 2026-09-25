import { Droplets } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AddPlantDialog from "@/components/AddPlantDialog";
import PlantImage from "@/components/ui/plant-image";
import WaterConfirmationDialog from "@/components/WaterConfirmationDialog";
import { SheetGrabber, sheetClasses } from "@/components/ui/bento-sheet";
import { SeasonalReviewDialog } from "@/components/SeasonalReviewDialog";
import { CalendarSeasonalDialog } from "@/components/CalendarSeasonalDialog";
import { SmartSuggestionsDialog } from "@/components/SmartSuggestionsDialog";
import { calculateWateringSchedule } from "@/utils/watering/schedule";
import { getPlantImageUrl } from "@/utils/plants/images";
import { getWateringStatus } from "@/utils/watering/status";
import { PLANT_FALLBACK_IMAGE } from "@/lib/constants";
import type { SeasonalScheduleSuggestion } from "@/services/scheduleVersioningService";
import type { SeasonalTransition } from "@/services/seasonalDetectionService";
import type { UpcomingSeasonChange } from "@/services/calendarSeasonalService";
import type { PlantSeasonalSuggestion } from "@/hooks/useCalendarSeasonalNotification";
import type { PatternInsight } from "@/types/wateringPatternTypes";
import type { PlantSuggestion } from "@/components/SmartSuggestionsDialog";
import type { UserPlant } from "@/hooks/useUserPlants";

interface DashboardDialogsProps {
  // AddPlantDialog
  addDialogOpen: boolean;
  onAddDialogClose: () => void;
  onPlantAdded: () => void;

  // BulkWater AlertDialog
  bulkWaterDialogOpen: boolean;
  onBulkWaterDialogClose: () => void;
  onBulkWater: () => void;
  plantsNeedingWater: UserPlant[];

  // WaterConfirmationDialog
  waterConfirmation: {
    show: boolean;
    plantId: string;
    plantName: string;
    lastWatered?: string;
    suggestedWateringDays?: number;
  };
  onWaterConfirmationChange: (open: boolean) => void;
  onConfirmQuickWater: (notes?: string) => void;
  onAlreadyWatered: (date: Date, notes?: string) => void;
  showOverwateringWarning: boolean;
  daysSinceLastWatered?: number;
  wateringScheduleDays: number;

  // SeasonalReviewDialog
  pendingTransition: SeasonalTransition | null;
  seasonalReviewDialogOpen: boolean;
  onSeasonalReviewDialogClose: () => void;
  seasonalSuggestions: SeasonalScheduleSuggestion[];
  isSuggestionsLoading: boolean;
  onApplySuggestion: (plantId: string, days: number) => Promise<void>;
  onApplyAllSuggestions: () => Promise<void>;
  onCustomizeSchedule: (plantId: string, days: number) => Promise<void>;
  hasUnappliedSuggestions: boolean;

  // CalendarSeasonalDialog
  calendarSeasonChange: UpcomingSeasonChange | null;
  calendarSeasonalDialogOpen: boolean;
  onCalendarSeasonalDialogClose: () => void;
  calendarPlantSuggestions: PlantSeasonalSuggestion[];
  isCalendarSuggestionsLoading: boolean;
  onApplyCalendarSuggestion: (plantId: string, days: number) => Promise<void>;
  onApplyAllCalendarSuggestions: () => Promise<void>;
  appliedCalendarPlants: Map<string, number>;

  // SmartSuggestionsDialog
  smartSuggestionsDialogOpen: boolean;
  onSmartSuggestionsDialogClose: () => void;
  smartPlantSuggestions: PlantSuggestion[];
  onApplyAllSmartSuggestions: () => Promise<void>;
  onApplySmartSuggestion: (plantId: string, insight: PatternInsight) => Promise<void>;
  onDismissAllSuggestions: () => void;
  onDismissPlantSuggestions: (plantId: string) => void;
  onViewPlantHistory: (plantId: string) => void;
  dismissedPlantIds: Set<string>;
  isSuggestionsAnalyzing: boolean;
}

export function DashboardDialogs({
  // AddPlantDialog
  addDialogOpen,
  onAddDialogClose,
  onPlantAdded,

  // BulkWater AlertDialog
  bulkWaterDialogOpen,
  onBulkWaterDialogClose,
  onBulkWater,
  plantsNeedingWater,

  // WaterConfirmationDialog
  waterConfirmation,
  onWaterConfirmationChange,
  onConfirmQuickWater,
  onAlreadyWatered,
  showOverwateringWarning,
  daysSinceLastWatered,
  wateringScheduleDays,

  // SeasonalReviewDialog
  pendingTransition,
  seasonalReviewDialogOpen,
  onSeasonalReviewDialogClose,
  seasonalSuggestions,
  isSuggestionsLoading,
  onApplySuggestion,
  onApplyAllSuggestions,
  onCustomizeSchedule,
  hasUnappliedSuggestions,

  // CalendarSeasonalDialog
  calendarSeasonChange,
  calendarSeasonalDialogOpen,
  onCalendarSeasonalDialogClose,
  calendarPlantSuggestions,
  isCalendarSuggestionsLoading,
  onApplyCalendarSuggestion,
  onApplyAllCalendarSuggestions,
  appliedCalendarPlants,

  // SmartSuggestionsDialog
  smartSuggestionsDialogOpen,
  onSmartSuggestionsDialogClose,
  smartPlantSuggestions,
  onApplyAllSmartSuggestions,
  onApplySmartSuggestion,
  onDismissAllSuggestions,
  onDismissPlantSuggestions,
  onViewPlantHistory,
  dismissedPlantIds,
  isSuggestionsAnalyzing,
}: DashboardDialogsProps) {
  // Wording follows the count: a single plant is named, several are counted
  const overdueCount = plantsNeedingWater.filter(
    (plant) => calculateWateringSchedule(plant).isOverdue
  ).length;
  const count = plantsNeedingWater.length;
  const bulkCopy =
    count === 1
      ? {
          title: `Water ${plantsNeedingWater[0].nickname}?`,
          description: overdueCount ? "It's overdue for water." : "It's due for water today.",
          action: "Water now",
        }
      : {
          title: `Water ${count} plants?`,
          description:
            overdueCount === count
              ? "All of them are overdue."
              : overdueCount > 0
                ? `Everything due today, including ${overdueCount} overdue.`
                : "Everything that's due today.",
          action: `Water all ${count}`,
        };

  return (
    <>
      <AddPlantDialog
        isOpen={addDialogOpen}
        onClose={onAddDialogClose}
        onPlantAdded={onPlantAdded}
      />

      <AlertDialog
        open={bulkWaterDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            onBulkWaterDialogClose();
          }
        }}
      >
        <AlertDialogContent data-testid="bulk-water-dialog" className={sheetClasses}>
          <SheetGrabber />
          <AlertDialogHeader className="flex-row items-center gap-3 space-y-0 mt-[18px] sm:mt-0 px-1.5 text-left">
            <div className="w-[52px] h-[52px] shrink-0 rounded-[18px] bg-sprout-water text-sprout-dark flex items-center justify-center">
              <Droplets className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <AlertDialogTitle className="font-display text-2xl font-bold tracking-[-0.03em] text-foreground">
                {bulkCopy.title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm font-medium text-muted-foreground">
                {bulkCopy.description}
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>

          <div
            data-testid="bulk-water-plants-list"
            className="max-h-[45dvh] overflow-y-auto space-y-2 mt-4"
          >
            {plantsNeedingWater.map((plant) => {
              const status = getWateringStatus(
                calculateWateringSchedule(plant),
                plant.latest_watering
              );
              return (
                <div
                  key={plant.id}
                  className="flex items-center gap-3 p-2.5 rounded-[22px] bg-card"
                >
                  <div className="w-12 h-12 shrink-0 rounded-2xl overflow-hidden bg-field">
                    <PlantImage
                      src={getPlantImageUrl(plant.image, plant.plant_type, PLANT_FALLBACK_IMAGE)}
                      alt=""
                      className="w-full h-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-foreground truncate">{plant.nickname}</p>
                    <p className="text-[13px] text-muted-foreground truncate">{plant.plant_type}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-bold px-2.5 py-[5px] rounded-full ${status.bentoClasses}`}>
                    {status.text}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 mt-4">
            <AlertDialogCancel
              data-testid="bulk-water-cancel-button"
              className="mt-0 flex-1 h-[60px] rounded-[22px] border-0 bg-card text-foreground font-bold text-[15px] hover:bg-card"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="bulk-water-confirm-button"
              onClick={onBulkWater}
              className="flex-[1.3] h-[60px] rounded-[22px] bg-sprout-dark text-sprout-cream font-bold text-base gap-2 shadow-[inset_0_0_0_2px_#dfc490] hover:bg-sprout-water hover:text-sprout-dark hover:shadow-none focus-visible:bg-sprout-water focus-visible:text-sprout-dark transition-colors"
            >
              <Droplets className="w-5 h-5" />
              {bulkCopy.action}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <WaterConfirmationDialog
        open={waterConfirmation.show}
        onOpenChange={onWaterConfirmationChange}
        onConfirm={onConfirmQuickWater}
        onAlreadyWatered={onAlreadyWatered}
        plantName={waterConfirmation.plantName}
        showOverwateringWarning={showOverwateringWarning}
        daysSinceLastWatered={daysSinceLastWatered}
        wateringScheduleDays={wateringScheduleDays}
        lastWateredDate={waterConfirmation.lastWatered}
      />

      {/* Weather-based Seasonal Review Dialog */}
      {pendingTransition && (
        <SeasonalReviewDialog
          isOpen={seasonalReviewDialogOpen}
          onClose={onSeasonalReviewDialogClose}
          season={pendingTransition.to_season}
          suggestions={seasonalSuggestions}
          isLoading={isSuggestionsLoading}
          onApplySuggestion={onApplySuggestion}
          onApplyAll={onApplyAllSuggestions}
          onCustomize={onCustomizeSchedule}
          appliedSuggestions={
            new Set(
              seasonalSuggestions
                .filter((_s) => !hasUnappliedSuggestions)
                .map((s) => s.plant_id)
            )
          }
        />
      )}

      {/* Calendar-based Seasonal Dialog */}
      {calendarSeasonChange && (
        <CalendarSeasonalDialog
          isOpen={calendarSeasonalDialogOpen}
          onClose={onCalendarSeasonalDialogClose}
          season={calendarSeasonChange.nextSeason}
          changeDate={calendarSeasonChange.changeDate}
          suggestions={calendarPlantSuggestions}
          isLoading={isCalendarSuggestionsLoading}
          onApplySuggestion={onApplyCalendarSuggestion}
          onApplyAll={onApplyAllCalendarSuggestions}
          appliedPlants={appliedCalendarPlants}
        />
      )}

      {/* Smart Suggestions Dialog */}
      <SmartSuggestionsDialog
        isOpen={smartSuggestionsDialogOpen}
        onClose={onSmartSuggestionsDialogClose}
        plantSuggestions={smartPlantSuggestions}
        onApplyAllSuggestions={onApplyAllSmartSuggestions}
        onApplySuggestion={onApplySmartSuggestion}
        onDismissAllSuggestions={onDismissAllSuggestions}
        onDismissPlantSuggestions={onDismissPlantSuggestions}
        onViewPlantHistory={onViewPlantHistory}
        dismissedPlantIds={dismissedPlantIds}
        isLoading={isSuggestionsAnalyzing}
      />
    </>
  );
}

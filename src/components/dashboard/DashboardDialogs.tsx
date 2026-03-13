import { Droplets, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AddPlantDialog from "@/components/AddPlantDialog";
import PlantImage from "@/components/ui/plant-image";
import WaterConfirmationDialog from "@/components/WaterConfirmationDialog";
import FullscreenImageModal from "@/components/ui/fullscreen-image-modal";
import { SeasonalReviewDialog } from "@/components/SeasonalReviewDialog";
import { CalendarSeasonalDialog } from "@/components/CalendarSeasonalDialog";
import { SmartSuggestionsDialog } from "@/components/SmartSuggestionsDialog";
import { calculateWateringSchedule } from "@/utils/watering/schedule";
import { getPlantImageUrl } from "@/utils/plants/images";
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
  onAlreadyWatered: (date: string, notes?: string) => void;
  showOverwateringWarning: boolean;
  daysSinceLastWatered?: number;
  wateringScheduleDays: number;

  // FullscreenImageModal
  fullscreenImage: {
    show: boolean;
    src: string;
    alt: string;
    plantName: string;
    imageSource?: string;
  };
  onFullscreenImageClose: () => void;

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

  // FullscreenImageModal
  fullscreenImage,
  onFullscreenImageClose,

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
        <AlertDialogContent data-testid="bulk-water-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <Droplets className="w-5 h-5 mr-2 text-sprout-water" />
              Water Multiple Plants
            </AlertDialogTitle>
            <AlertDialogDescription>
              You're about to water {plantsNeedingWater.length} plant
              {plantsNeedingWater.length > 1 ? "s" : ""} that need attention
              today:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div
            data-testid="bulk-water-plants-list"
            className="max-h-48 overflow-y-auto space-y-2 my-4"
          >
            {plantsNeedingWater.map((plant) => (
              <div
                key={plant.id}
                className="flex items-center space-x-3 p-2 bg-card border border-border rounded-lg"
              >
                <PlantImage
                  src={getPlantImageUrl(plant.image, plant.plant_type, "")}
                  fallbackSrc="https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=40&h=40&fit=crop"
                  alt={plant.nickname}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {plant.nickname}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {plant.plant_type}
                  </p>
                </div>
                <Badge
                  className={`text-xs ${
                    calculateWateringSchedule(plant).isOverdue
                      ? "bg-sprout-error text-white"
                      : calculateWateringSchedule(plant).isPostponed
                      ? "bg-sprout-water/20 text-sprout-water"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {(() => {
                    const calc = calculateWateringSchedule(plant);
                    if (calc.isOverdue) {
                      return `${Math.abs(
                        calc.daysUntilWatering
                      )} days overdue`;
                    } else if (calc.isPostponed) {
                      return "Postponed";
                    } else {
                      return "Due today";
                    }
                  })()}
                </Badge>
              </div>
            ))}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel data-testid="bulk-water-cancel-button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="bulk-water-confirm-button"
              onClick={onBulkWater}
              className="bg-sprout-water hover:bg-sprout-water/90 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Water All Plants
            </AlertDialogAction>
          </AlertDialogFooter>
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

      <FullscreenImageModal
        isOpen={fullscreenImage.show}
        onClose={onFullscreenImageClose}
        imageSrc={fullscreenImage.src}
        imageAlt={fullscreenImage.alt}
        plantName={fullscreenImage.plantName}
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

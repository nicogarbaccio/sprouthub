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
import WaterConfirmationDialog from "@/components/WaterConfirmationDialog";
import PostponeConfirmationDialog from "@/components/PostponeConfirmationDialog";
import EditPlantDialog from "@/components/EditPlantDialog";
import WateringHistoryDialog from "@/components/WateringHistoryDialog";
import FullscreenImageModal from "@/components/ui/fullscreen-image-modal";
import { JournalModal } from "@/components/journal/JournalModal";
import { RepottingDialog } from "@/components/plant-details/RepottingDialog";
import { PatternSuggestionsDialog } from "@/components/watering-patterns";
import type { UserPlant } from "@/hooks/useUserPlants";
import type { CatalogPlant } from "@/data/types";
import type {
  WateringPatternAnalysis,
  PatternInsight,
} from "@/types/wateringPatternTypes";

interface PlantDetailDialogsProps {
  plant: UserPlant;
  catalogPlant?: CatalogPlant;
  imageSrc: string;

  // Water dialog
  showWaterConfirmation: boolean;
  onWaterConfirmationChange: (open: boolean) => void;
  onConfirmWater: (notes?: string) => Promise<void>;
  onAlreadyWatered: (date: Date, notes?: string) => Promise<void>;
  showOverwateringWarning: boolean;
  daysSinceLastWatered: number | null;

  // Edit dialog
  showEditDialog: boolean;
  onEditClose: () => void;
  onPlantUpdate: () => void;

  // History dialog
  showHistoryDialog: boolean;
  onHistoryClose: () => void;
  onPlantDataChange: () => void;

  // Fullscreen image
  showFullscreenImage: boolean;
  onFullscreenImageClose: () => void;

  // Journal
  showJournal: boolean;
  onJournalClose: () => void;

  // Repotting
  showRepotting: boolean;
  onRepottingClose: () => void;

  // Pattern suggestions
  showSuggestionsDialog: boolean;
  onSuggestionsClose: () => void;
  analysis: WateringPatternAnalysis | null;
  actionableInsights: PatternInsight[];

  // Postpone dialog
  showPostponeConfirmation: boolean;
  onPostponeConfirmationChange: (open: boolean) => void;
  onConfirmPostpone: () => Promise<void>;
  currentNextWatering: string;
  postponedNextWatering: string;

  // Delete dialog
  showDeleteConfirmation: boolean;
  onDeleteConfirmationChange: (open: boolean) => void;
  onConfirmDelete: () => Promise<void>;
}

const PlantDetailDialogs = ({
  plant,
  catalogPlant,
  imageSrc,
  showWaterConfirmation,
  onWaterConfirmationChange,
  onConfirmWater,
  onAlreadyWatered,
  showOverwateringWarning,
  daysSinceLastWatered,
  showEditDialog,
  onEditClose,
  onPlantUpdate,
  showHistoryDialog,
  onHistoryClose,
  onPlantDataChange,
  showFullscreenImage,
  onFullscreenImageClose,
  showJournal,
  onJournalClose,
  showRepotting,
  onRepottingClose,
  showSuggestionsDialog,
  onSuggestionsClose,
  analysis,
  actionableInsights,
  showPostponeConfirmation,
  onPostponeConfirmationChange,
  onConfirmPostpone,
  currentNextWatering,
  postponedNextWatering,
  showDeleteConfirmation,
  onDeleteConfirmationChange,
  onConfirmDelete,
}: PlantDetailDialogsProps) => {
  return (
    <>
      <WaterConfirmationDialog
        open={showWaterConfirmation}
        onOpenChange={onWaterConfirmationChange}
        onConfirm={onConfirmWater}
        onAlreadyWatered={onAlreadyWatered}
        plantName={plant.nickname}
        showOverwateringWarning={showOverwateringWarning}
        daysSinceLastWatered={daysSinceLastWatered}
        wateringScheduleDays={plant.suggested_watering_days || 7}
        lastWateredDate={plant.latest_watering || undefined}
      />

      <EditPlantDialog
        isOpen={showEditDialog}
        onClose={onEditClose}
        plant={plant}
        onUpdate={onPlantUpdate}
      />

      <WateringHistoryDialog
        isOpen={showHistoryDialog}
        onClose={onHistoryClose}
        plant={plant}
        onPlantDataChange={onPlantDataChange}
      />

      <FullscreenImageModal
        isOpen={showFullscreenImage}
        onClose={onFullscreenImageClose}
        imageSrc={imageSrc}
        imageAlt={plant.nickname}
        plantName={plant.nickname}
      />

      <JournalModal
        isOpen={showJournal}
        onClose={onJournalClose}
        plantId={plant.id}
        plantNickname={plant.nickname}
      />

      <RepottingDialog
        isOpen={showRepotting}
        onClose={onRepottingClose}
        plantId={plant.id}
        plantNickname={plant.nickname}
        catalogPlant={catalogPlant}
      />

      <PatternSuggestionsDialog
        isOpen={showSuggestionsDialog}
        onClose={onSuggestionsClose}
        plantName={plant.nickname}
        plantId={plant.id}
        analysis={analysis}
        insights={actionableInsights}
      />

      <PostponeConfirmationDialog
        open={showPostponeConfirmation}
        onOpenChange={onPostponeConfirmationChange}
        onConfirm={onConfirmPostpone}
        plantName={plant.nickname}
        currentNextWatering={currentNextWatering}
        postponedNextWatering={postponedNextWatering}
      />

      <AlertDialog
        open={showDeleteConfirmation}
        onOpenChange={onDeleteConfirmationChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{plant.nickname}"? This action
              cannot be undone and will remove all watering history for this
              plant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Plant
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PlantDetailDialogs;

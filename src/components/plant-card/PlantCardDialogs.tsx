import WaterConfirmationDialog from "@/components/WaterConfirmationDialog";
import PostponeConfirmationDialog from "@/components/PostponeConfirmationDialog";
import FullscreenImageModal from "@/components/ui/fullscreen-image-modal";
import { PatternSuggestionsDialog } from "@/components/watering-patterns";
import PatternTipsModal from "@/components/watering-patterns/PatternTipsModal";
import { JournalModal } from "@/components/journal/JournalModal";
import type { PatternInsight, WateringPatternAnalysis } from "@/types/wateringPatternTypes";

interface PlantCardDialogsProps {
  id: string;
  name: string;
  image: string;
  lastWateredDate?: string;
  suggestedWateringDays: number;
  nextWateringDue: string;
  postponedNextWatering: string;
  showOverwateringWarning: boolean;
  daysSinceLastWatered: number | undefined;

  showWaterConfirmation: boolean;
  onWaterConfirmationChange: (open: boolean) => void;
  onConfirmWater: (notes?: string) => void;
  onAlreadyWatered: (date: Date, notes?: string) => void;

  showFullscreenImage: boolean;
  onFullscreenImageClose: () => void;

  showPatternSuggestions: boolean;
  onPatternSuggestionsClose: () => void;
  patternAnalysis: WateringPatternAnalysis | null;
  patternInsights: PatternInsight[];
  onAcceptSuggestion: (insight: PatternInsight) => Promise<void>;

  showPendingTips: boolean;
  onPendingTipsClose: () => void;
  visiblePendingInsights: PatternInsight[];
  onDismissInsight: () => Promise<void>;
  onDismissAll: () => Promise<void>;

  showJournal: boolean;
  onJournalClose: () => void;
  prefetchJournal: boolean;

  showPostponeConfirmation: boolean;
  onPostponeConfirmationChange: (open: boolean) => void;
  onConfirmPostpone: () => Promise<void>;
}

export function PlantCardDialogs({
  id,
  name,
  image,
  lastWateredDate,
  suggestedWateringDays,
  nextWateringDue,
  postponedNextWatering,
  showOverwateringWarning,
  daysSinceLastWatered,

  showWaterConfirmation,
  onWaterConfirmationChange,
  onConfirmWater,
  onAlreadyWatered,

  showFullscreenImage,
  onFullscreenImageClose,

  showPatternSuggestions,
  onPatternSuggestionsClose,
  patternAnalysis,
  patternInsights,
  onAcceptSuggestion,

  showPendingTips,
  onPendingTipsClose,
  visiblePendingInsights,
  onDismissInsight,
  onDismissAll,

  showJournal,
  onJournalClose,
  prefetchJournal,

  showPostponeConfirmation,
  onPostponeConfirmationChange,
  onConfirmPostpone,
}: PlantCardDialogsProps) {
  return (
    <>
      <WaterConfirmationDialog
        open={showWaterConfirmation}
        onOpenChange={onWaterConfirmationChange}
        onConfirm={onConfirmWater}
        onAlreadyWatered={onAlreadyWatered}
        plantName={name}
        showOverwateringWarning={showOverwateringWarning}
        daysSinceLastWatered={daysSinceLastWatered}
        wateringScheduleDays={suggestedWateringDays || 7}
        lastWateredDate={lastWateredDate}
      />

      <FullscreenImageModal
        isOpen={showFullscreenImage}
        onClose={onFullscreenImageClose}
        imageSrc={image}
        imageAlt={name}
        plantName={name}
      />

      <PatternSuggestionsDialog
        isOpen={showPatternSuggestions}
        onClose={onPatternSuggestionsClose}
        analysis={patternAnalysis}
        insights={patternInsights}
        plantName={name}
        plantId={id}
        onAcceptSuggestion={onAcceptSuggestion}
        onDismissAll={onPatternSuggestionsClose}
      />

      <PatternTipsModal
        isOpen={showPendingTips}
        onClose={onPendingTipsClose}
        analysis={null}
        insights={visiblePendingInsights}
        plantName={name}
        plantId={id}
        onAcceptSuggestion={onAcceptSuggestion}
        onDismissInsight={onDismissInsight}
        onDismissAll={onDismissAll}
        showPatternSummary={false}
      />

      <JournalModal
        isOpen={showJournal}
        onClose={onJournalClose}
        plantId={id}
        plantNickname={name}
        prefetch={prefetchJournal}
      />

      <PostponeConfirmationDialog
        open={showPostponeConfirmation}
        onOpenChange={onPostponeConfirmationChange}
        onConfirm={onConfirmPostpone}
        plantName={name}
        currentNextWatering={nextWateringDue}
        postponedNextWatering={postponedNextWatering}
      />
    </>
  );
}

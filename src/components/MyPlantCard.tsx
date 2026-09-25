import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  AlertTriangle,
  Clock,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";
import type { OverwateringRisk } from "@/utils/plants/overwatering";
import { shouldShowOverwateringWarning } from "@/utils/plants/overwatering";
import { cn } from "@/lib/utils";
import { TIMING } from "@/lib/constants";
import PlantImage from "@/components/ui/plant-image";
import {
  useQuickPatternAnalysis,
  useWateringPatternAnalysis,
} from "@/hooks/useWateringPatternAnalysis";
import { wateringPatternAnalyzer } from "@/utils/watering/patternAnalyzer";
import { useNavigate } from "react-router-dom";
import type { PatternInsight } from "@/types/wateringPatternTypes";
import { useDismissedInsights } from "@/hooks/useDismissedInsights";
import { useBulkSelection } from "@/contexts/BulkSelectionContext";
import { getBadgeInfo, getStatusText } from "@/components/plant-card/PlantCardBadgeUtils";
import { getWateringStatus } from "@/utils/watering/status";
import { PlantCardActions } from "@/components/plant-card/PlantCardActions";
import { PlantCardDialogs } from "@/components/plant-card/PlantCardDialogs";
import { ImageExpandButton } from "@/components/ui/image-expand-button";

interface MyPlantCardProps {
  id: string;
  name: string;
  plantType: string;
  image: string;
  lastWatered: string;
  lastWateredDate?: string;
  nextWateringDue: string;
  isOverdue: boolean;
  /** `null` when the plant has no watering history; pair with `hasUnknownWateringDate`. */
  daysUntilWatering: number | null;
  hasUnknownWateringDate: boolean;
  isPostponed?: boolean;
  suggestedWateringDays?: number;
  householdName?: string;
  householdId?: string;
  /**
   * @param notes - notes from the confirmation dialog, which may carry a health
   *   observation prefix used by pattern analysis
   * @param wateredAt - when the watering happened, when the user is backdating it
   */
  onWater: (notes?: string, wateredAt?: Date) => void;
  onEdit: () => void;
  onPostpone?: () => void;
  onViewHistory?: () => void;
  onScheduleAdjustment?: (
    plantId: string,
    newSchedule: number
  ) => Promise<void>;
  overwatering?: OverwateringRisk;
  isFertilizationDue?: boolean;
  onFertilize?: () => void;
}

const MyPlantCard = ({
  id,
  name,
  plantType,
  image,
  lastWateredDate,
  nextWateringDue,
  isOverdue,
  daysUntilWatering,
  hasUnknownWateringDate,
  isPostponed,
  suggestedWateringDays = 7,
  householdName,
  householdId,
  onWater,
  onEdit,
  onPostpone,
  onViewHistory,
  onScheduleAdjustment,
  overwatering,
  isFertilizationDue,
  onFertilize,
}: MyPlantCardProps) => {
  const navigate = useNavigate();
  const { isSelectionMode, isPlantSelected, togglePlantSelection } = useBulkSelection();
  const [showWaterConfirmation, setShowWaterConfirmation] = useState(false);
  const [showPostponeConfirmation, setShowPostponeConfirmation] = useState(false);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [showPatternSuggestions, setShowPatternSuggestions] = useState(false);
  const [showPendingTips, setShowPendingTips] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [prefetchJournal, setPrefetchJournal] = useState(false);
  const [patternAnalysis, setPatternAnalysis] = useState(null);
  const [patternInsights, setPatternInsights] = useState([]);

  const patternAnalysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSelected = isPlantSelected(id);

  const { analyzeQuick } = useQuickPatternAnalysis();
  const { insights: pendingInsights } = useWateringPatternAnalysis({
    plantId: id,
    autoRefresh: true,
  });

  const { filterDismissed, reload: reloadDismissedInsights, dismissInsight } = useDismissedInsights(id);
  const visiblePendingInsights = useMemo(
    () => filterDismissed(pendingInsights),
    [filterDismissed, pendingInsights]
  );

  useEffect(() => {
    return () => {
      if (patternAnalysisTimeoutRef.current) {
        clearTimeout(patternAnalysisTimeoutRef.current);
      }
    };
  }, []);

  const isOverwateringActive = !!(overwatering && overwatering.level !== "none");

  const { showWarning: showOverwateringWarning, daysSinceLastWatered } =
    shouldShowOverwateringWarning(lastWateredDate, suggestedWateringDays);

  const hasPendingSuggestions = visiblePendingInsights.some(
    (insight) => insight.actionable
  );

  const badgeInfo = getBadgeInfo(hasPendingSuggestions, visiblePendingInsights);
  const statusText = getStatusText(hasUnknownWateringDate, isOverdue, isPostponed, daysUntilWatering, lastWateredDate);

  const handleWaterClick = () => {
    setShowWaterConfirmation(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const displayDate = new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    );
    if (date.getUTCHours() < 4) {
      displayDate.setUTCDate(displayDate.getUTCDate() - 1);
    }
    return displayDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow.toISOString());
  };

  const handlePostponeClick = () => {
    setShowPostponeConfirmation(true);
  };

  const handleConfirmPostpone = async () => {
    if (onPostpone) {
      await onPostpone();
    }
  };

  const handleConfirmWater = async (notes?: string) => {
    onWater(notes);

    if (patternAnalysisTimeoutRef.current) {
      clearTimeout(patternAnalysisTimeoutRef.current);
    }

    patternAnalysisTimeoutRef.current = setTimeout(async () => {
      try {
        const analysis = await analyzeQuick(id);
        if (analysis) {
          setPatternAnalysis(analysis);
          const insights = wateringPatternAnalyzer.generateInsights(analysis);
          setPatternInsights(insights);

          const hasActionableInsights = insights.some((insight) => insight.actionable);
          const isConsistentPattern = analysis.pattern === "consistent";

          if (hasActionableInsights || isConsistentPattern) {
            setShowPatternSuggestions(true);
          }
        }
      } catch (error) {
        console.error("Error analyzing watering pattern:", error);
      }
      patternAnalysisTimeoutRef.current = null;
    }, TIMING.WATERING_PATTERN_DELAY);
  };

  const handleAlreadyWatered = async (date: Date, notes?: string) => {
    onWater(notes, date);
  };

  const handleNameClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/my-plants/${id}`);
  };

  const handleHouseholdClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (householdId) {
      navigate(`/households/${householdId}`);
    }
  };

  const handlePatternScheduleAdjustment = async (insight: PatternInsight) => {
    if (onScheduleAdjustment && insight.suggestion) {
      try {
        await onScheduleAdjustment(id, insight.suggestion.suggestedSchedule);
        setShowPatternSuggestions(false);
      } catch (error) {
        console.error("Failed to apply schedule adjustment:", error);
      }
    }
  };

  const handleDismissInsight = async () => {
    await reloadDismissedInsights();
  };

  const handleDismissAll = async () => {
    for (const insight of visiblePendingInsights) {
      await dismissInsight(insight);
    }
    await reloadDismissedInsights();
    setShowPendingTips(false);
  };

  const handleCardClick = () => {
    if (isSelectionMode) {
      togglePlantSelection(id);
    } else {
      navigate(`/my-plants/${id}`);
    }
  };

  const status = getWateringStatus(
    {
      hasUnknownWateringDate,
      isOverdue,
      isPostponed: Boolean(isPostponed),
      daysUntilWatering,
    },
    lastWateredDate
  );

  return (
    <>
      <div
        className={cn(
          "relative bg-card rounded-card p-2 h-full flex flex-col transition-shadow",
          isSelectionMode && "cursor-pointer",
          isSelected && "ring-[3px] ring-sprout-cream"
        )}
        data-testid="plant-card"
        onClick={isSelectionMode ? () => togglePlantSelection(id) : undefined}
      >
        {/* Photo well with the status pill */}
        <div
          className="cursor-pointer relative group shrink-0 h-[148px] md:h-[170px] rounded-well overflow-hidden bg-field"
          onClick={!isSelectionMode ? handleCardClick : undefined}
        >
          <PlantImage
            src={image}
            alt={name}
            className="w-full h-full"
            imageClassName="object-cover"
          />

          {/* Selection Checkbox */}
          {isSelectionMode && (
            <div className="absolute top-2 right-2 z-10">
              <div
                className={cn(
                  "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-colors",
                  isSelected
                    ? "bg-sprout-cream border-sprout-cream text-sprout-dark"
                    : "bg-card/90 border-card"
                )}
              >
                {isSelected && <CheckCircle2 className="h-5 w-5" />}
              </div>
            </div>
          )}

          {/* Status pill, swapped for the overwatering warning when that's active */}
          <div className="absolute top-2 left-2 right-2 flex">
            {isOverwateringActive ? (
              <span
                className={cn(
                  "px-2.5 py-[5px] rounded-full text-xs font-bold truncate",
                  overwatering?.level === "high"
                    ? "bg-sprout-warning text-sprout-dark"
                    : "bg-sprout-cream text-sprout-dark"
                )}
              >
                <AlertTriangle className="w-3 h-3 inline mr-1 -mt-0.5" />
                {overwatering?.level === "high" ? "Possible overwatering" : "Watch watering"}
              </span>
            ) : (
              <span className={cn("px-2.5 py-[5px] rounded-full text-xs font-bold truncate", status.bentoClasses)}>
                {isPostponed && <Clock className="w-3 h-3 inline mr-1 -mt-0.5" />}
                {statusText}
              </span>
            )}
          </div>

          {/* Smart Suggestions Badge */}
          {badgeInfo && !isOverwateringActive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPendingTips(true);
              }}
              className="absolute bottom-2 left-2 max-w-[calc(100%-3rem)] truncate px-2.5 py-[5px] rounded-full text-xs font-bold bg-sprout-cream text-sprout-dark hover:scale-105 active:scale-95 transition-transform"
              aria-label={badgeInfo.ariaLabel}
            >
              <Lightbulb className="w-3 h-3 inline mr-1 -mt-0.5" />
              {badgeInfo.message}
            </button>
          )}

          {!isSelectionMode && (
            <ImageExpandButton onExpand={() => setShowFullscreenImage(true)} />
          )}
        </div>

        {/* Name, type and the actions menu */}
        <div className="flex items-start gap-1.5 px-1.5 pt-2.5 pb-1">
          <div className="flex-1 min-w-0">
            <h3 className="text-[17px] font-bold text-foreground leading-snug">
              <button
                onClick={handleNameClick}
                className="text-left truncate max-w-full block hover:underline underline-offset-4"
                title={name}
              >
                {name}
              </button>
            </h3>
            <p className="text-[13px] text-muted-foreground truncate" title={plantType}>
              {plantType}
            </p>
            {householdName && (
              <button
                onClick={handleHouseholdClick}
                className="mt-1 max-w-full truncate text-[11px] font-bold px-2 py-0.5 rounded-full bg-field text-foreground"
                disabled={!householdId}
              >
                {householdName}
              </button>
            )}
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <PlantCardActions
              daysUntilWatering={daysUntilWatering}
              isPostponed={isPostponed}
              hasUnknownWateringDate={hasUnknownWateringDate}
              lastWateredDate={lastWateredDate}
              hasPendingSuggestions={hasPendingSuggestions}
              onWaterClick={handleWaterClick}
              onPostponeClick={handlePostponeClick}
              onEdit={onEdit}
              onViewHistory={onViewHistory}
              onPostpone={onPostpone}
              onJournalClick={() => setShowJournal(true)}
              onJournalHover={() => setPrefetchJournal(true)}
              isFertilizationDue={isFertilizationDue}
              onFertilizeClick={onFertilize}
            />
          </div>
        </div>
      </div>

      {/* All Dialogs */}
      <PlantCardDialogs
        id={id}
        name={name}
        image={image}
        lastWateredDate={lastWateredDate}
        suggestedWateringDays={suggestedWateringDays}
        nextWateringDue={nextWateringDue}
        postponedNextWatering={getTomorrowDate()}
        showOverwateringWarning={showOverwateringWarning}
        daysSinceLastWatered={daysSinceLastWatered}
        showWaterConfirmation={showWaterConfirmation}
        onWaterConfirmationChange={setShowWaterConfirmation}
        onConfirmWater={handleConfirmWater}
        onAlreadyWatered={handleAlreadyWatered}
        showFullscreenImage={showFullscreenImage}
        onFullscreenImageClose={() => setShowFullscreenImage(false)}
        showPatternSuggestions={showPatternSuggestions}
        onPatternSuggestionsClose={() => setShowPatternSuggestions(false)}
        patternAnalysis={patternAnalysis}
        patternInsights={patternInsights}
        onAcceptSuggestion={handlePatternScheduleAdjustment}
        showPendingTips={showPendingTips}
        onPendingTipsClose={() => setShowPendingTips(false)}
        visiblePendingInsights={visiblePendingInsights}
        onDismissInsight={handleDismissInsight}
        onDismissAll={handleDismissAll}
        showJournal={showJournal}
        onJournalClose={() => setShowJournal(false)}
        prefetchJournal={prefetchJournal}
        showPostponeConfirmation={showPostponeConfirmation}
        onPostponeConfirmationChange={setShowPostponeConfirmation}
        onConfirmPostpone={handleConfirmPostpone}
      />
    </>
  );
};

export default MyPlantCard;

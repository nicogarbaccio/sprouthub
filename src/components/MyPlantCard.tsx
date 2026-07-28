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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getBadgeInfo, getStatusColor, getStatusText } from "@/components/plant-card/PlantCardBadgeUtils";
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
  lastWatered,
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
  const statusColor = getStatusColor(hasUnknownWateringDate, isOverdue, isPostponed, daysUntilWatering, lastWateredDate);
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
          const isInsufficientData =
            analysis.confidence === "low" &&
            analysis.reasoning.some((r) => r.includes("Need at least"));

          if (hasActionableInsights || isConsistentPattern || isInsufficientData) {
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

  return (
    <>
      <div
        className={cn(
          "relative bg-card border-0 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden",
          isSelectionMode && "cursor-pointer",
          isSelected && "ring-2 ring-sprout-primary border-sprout-primary"
        )}
        data-testid="plant-card"
        onClick={isSelectionMode ? () => togglePlantSelection(id) : undefined}
      >
        {/* Selection Checkbox */}
        {isSelectionMode && (
          <div className="absolute top-3 left-3 z-10">
            <div
              className={cn(
                "h-6 w-6 rounded-md border-2 flex items-center justify-center transition-colors",
                isSelected
                  ? "bg-sprout-primary border-sprout-primary"
                  : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              )}
            >
              {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
            </div>
          </div>
        )}

        {/* Image Section with Badges */}
        <div
          className="cursor-pointer relative group"
          onClick={!isSelectionMode ? handleCardClick : undefined}
        >
          <PlantImage
            src={image}
            alt={name}
            className="w-full h-56"
            imageClassName="object-cover"
          />

          {/* Status Badge */}
          <div
            className={`absolute top-3 right-3 transition-opacity duration-200 ${
              isOverwateringActive ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
            aria-hidden={isOverwateringActive}
          >
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
              {isPostponed && <Clock className="w-3 h-3 inline mr-1" />}
              {(isOverdue || hasUnknownWateringDate) && !isPostponed && (
                <AlertTriangle className="w-3 h-3 inline mr-1" />
              )}
              {statusText}
            </span>
          </div>

          {/* Overwatering Warning Badge */}
          <div
            className={`absolute top-3 left-3 transition-opacity duration-200 ${
              isOverwateringActive ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={!isOverwateringActive}
          >
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                overwatering?.level === "high"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-orange-500 text-white border-orange-500"
              }`}
            >
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              {overwatering?.level === "high" ? "Possible overwatering" : "Watch watering"}
            </span>
          </div>

          {/* Smart Suggestions Badge */}
          {(() => {
            if (!badgeInfo || isOverwateringActive) return null;
            return (
              <div
                className={`absolute bottom-3 left-3 transition-all duration-200 ${
                  hasPendingSuggestions && !isOverwateringActive
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none"
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPendingTips(true);
                  }}
                  className={cn(
                    badgeInfo.classNames,
                    "hover:scale-105 hover:shadow-md active:scale-95 transition-all duration-150 cursor-pointer"
                  )}
                  aria-label={badgeInfo.ariaLabel}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowPendingTips(true);
                    }
                  }}
                >
                  <Lightbulb className="w-3 h-3 inline mr-1" />
                  {badgeInfo.message}
                </button>
              </div>
            );
          })()}

          {!isSelectionMode && (
            <ImageExpandButton onExpand={() => setShowFullscreenImage(true)} />
          )}
        </div>

        {/* Card Content */}
        <TooltipProvider>
          <div
            className="p-5 grid h-full"
            style={{
              gridTemplateRows: "minmax(1.75rem, auto) auto minmax(0, auto) 1fr auto",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-foreground flex-1 min-w-0 mr-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleNameClick}
                      className="text-left hover:text-sprout-water transition-colors duration-200 cursor-pointer underline-offset-4 hover:underline line-clamp-1 max-w-full block"
                    >
                      {name}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{name}</p>
                  </TooltipContent>
                </Tooltip>
              </h3>
              {householdName && (
                <button
                  onClick={handleHouseholdClick}
                  className={cn(
                    "px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full font-medium flex items-center gap-1 flex-shrink-0 transition-colors",
                    householdId && "hover:bg-blue-200 dark:hover:bg-blue-800 cursor-pointer"
                  )}
                  disabled={!householdId}
                >
                  🏠 {householdName}
                </button>
              )}
            </div>

            {/* Plant Type */}
            <div className="mb-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm text-muted-foreground line-clamp-1">{plantType}</p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{plantType}</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Warning Messages */}
            <div className={hasUnknownWateringDate ? "mb-4" : ""}>
              {hasUnknownWateringDate && (
                <div className="flex items-center gap-2 p-2 bg-sprout-cream/20 border border-sprout-cream/40 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-sprout-dark flex-shrink-0" />
                  <p className="text-xs text-sprout-dark">
                    Last watering date unknown - please water and record or edit the plant details
                  </p>
                </div>
              )}
            </div>

            {/* Watering Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last watered:</span>
                <span className="text-foreground font-medium">{lastWatered}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Next watering:</span>
                <span className="text-foreground font-medium">{nextWateringDue}</span>
              </div>
              {overwatering && overwatering.level !== "none" && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Frequency</span>
                  <span className="text-foreground">
                    {overwatering.count} in {overwatering.windowDays}d
                    {overwatering.avgIntervalDays ? ` • avg ${overwatering.avgIntervalDays}d` : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Action Dropdown */}
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
        </TooltipProvider>
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

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Droplets,
  AlertTriangle,
  Edit,
  Clock,
  History,
  Lightbulb,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import type { OverwateringRisk } from "@/utils/overwatering";
import { shouldShowOverwateringWarning } from "@/utils/overwatering";
import { cn } from "@/lib/utils";
import { TIMING } from "@/lib/constants";
import PlantImage from "@/components/ui/plant-image";
import WaterConfirmationDialog from "@/components/WaterConfirmationDialog";
import PostponeConfirmationDialog from "@/components/PostponeConfirmationDialog";
import FullscreenImageModal from "@/components/ui/fullscreen-image-modal";
import { PatternSuggestionsDialog } from "@/components/watering-patterns";
import PatternTipsModal from "@/components/watering-patterns/PatternTipsModal";
import {
  useQuickPatternAnalysis,
  useWateringPatternAnalysis,
} from "@/hooks/useWateringPatternAnalysis";
import { wateringPatternAnalyzer } from "@/utils/watering-pattern-analyzer";
import { useNavigate } from "react-router-dom";
import type { PatternInsight } from "@/types/wateringPatternTypes";
import { useDismissedInsights } from "@/hooks/useDismissedInsights";
import { useBulkSelection } from "@/contexts/BulkSelectionContext";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MyPlantCardProps {
  id: string;
  name: string;
  plantType: string;
  image: string;
  lastWatered: string;
  lastWateredDate?: string; // Raw ISO date string for calculations
  nextWateringDue: string;
  isOverdue: boolean;
  daysUntilWatering: number;
  hasUnknownWateringDate: boolean;
  isPostponed?: boolean; // If the latest watering record is a postponement
  suggestedWateringDays?: number; // For overwatering warning calculation
  householdName?: string; // Name of household this plant belongs to
  householdId?: string; // ID of household this plant belongs to
  onWater: () => void;
  onEdit: () => void;
  onPostpone?: () => void;
  onViewHistory?: () => void;
  onScheduleAdjustment?: (
    plantId: string,
    newSchedule: number
  ) => Promise<void>;
  overwatering?: OverwateringRisk;
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
}: MyPlantCardProps) => {
  const navigate = useNavigate();
  const { isSelectionMode, isPlantSelected, togglePlantSelection } = useBulkSelection();
  const [showWaterConfirmation, setShowWaterConfirmation] = useState(false);
  const [showPostponeConfirmation, setShowPostponeConfirmation] =
    useState(false);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [showPatternSuggestions, setShowPatternSuggestions] = useState(false);
  const [showPendingTips, setShowPendingTips] = useState(false);
  const [patternAnalysis, setPatternAnalysis] = useState(null);
  const [patternInsights, setPatternInsights] = useState([]);

  // Ref to track async timeout for pattern analysis
  const patternAnalysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSelected = isPlantSelected(id);

  // Quick pattern analysis hook for post-watering suggestions
  const { analyzeQuick, isAnalyzing } = useQuickPatternAnalysis();

  // Pattern analysis hook for detecting pending suggestions
  const { insights: pendingInsights } = useWateringPatternAnalysis({
    plantId: id,
    autoRefresh: true,
  });

  // Filter out dismissed insights
  const { filterDismissed } = useDismissedInsights(id);
  const visiblePendingInsights = useMemo(
    () => filterDismissed(pendingInsights),
    [filterDismissed, pendingInsights]
  );

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (patternAnalysisTimeoutRef.current) {
        clearTimeout(patternAnalysisTimeoutRef.current);
      }
    };
  }, []);

  const isOverwateringActive = !!(
    overwatering && overwatering.level !== "none"
  );

  // Check if we should show overwatering warning
  const { showWarning: showOverwateringWarning, daysSinceLastWatered } =
    shouldShowOverwateringWarning(lastWateredDate, suggestedWateringDays);

  // Check if there are pending actionable insights (after filtering dismissed ones)
  const hasPendingSuggestions = visiblePendingInsights.some(
    (insight) => insight.actionable
  );

  // Helper functions to analyze pending insights for better badge messaging
  const getActionableInsights = () =>
    visiblePendingInsights.filter((insight) => insight.actionable);

  const getSuggestionMetadata = () => {
    const actionableInsights = getActionableInsights();
    const count = actionableInsights.length;
    const highPriorityCount = actionableInsights.filter(
      (insight) => insight.severity === "high"
    ).length;
    const mediumPriorityCount = actionableInsights.filter(
      (insight) => insight.severity === "medium"
    ).length;
    const types = [
      ...new Set(actionableInsights.map((insight) => insight.type)),
    ];
    const hasScheduleAdjustment = types.includes("schedule_adjustment");
    const hasWateringIssues =
      types.includes("overwatering_risk") ||
      types.includes("underwatering_risk");
    const highestSeverity =
      highPriorityCount > 0
        ? "high"
        : mediumPriorityCount > 0
        ? "medium"
        : "low";

    return {
      count,
      highPriorityCount,
      types,
      hasScheduleAdjustment,
      hasWateringIssues,
      highestSeverity,
      actionableInsights,
    };
  };

  // Generate dynamic badge text and styling based on suggestion metadata
  const getBadgeInfo = () => {
    if (!hasPendingSuggestions) return null;

    const metadata = getSuggestionMetadata();
    const {
      count,
      highPriorityCount,
      hasScheduleAdjustment,
      hasWateringIssues,
      highestSeverity,
    } = metadata;

    // Determine message based on priority and type
    let message = "";
    let ariaLabel = "";

    if (highPriorityCount > 0) {
      // High priority suggestions get urgent messaging
      if (highPriorityCount === 1 && count === 1) {
        message = hasWateringIssues ? "Urgent watering tip" : "Important tip";
        ariaLabel = `${highPriorityCount} urgent plant care suggestion available`;
      } else if (highPriorityCount > 1) {
        message = `${highPriorityCount} urgent tips`;
        ariaLabel = `${highPriorityCount} urgent plant care suggestions available`;
      } else {
        message = `${count} tips (${highPriorityCount} urgent)`;
        ariaLabel = `${count} plant care suggestions available, ${highPriorityCount} urgent`;
      }
    } else {
      // Medium/low priority suggestions get descriptive messaging
      if (count === 1) {
        if (hasScheduleAdjustment) {
          message = "Schedule tip";
          ariaLabel = "1 watering schedule suggestion available";
        } else if (hasWateringIssues) {
          message = "Watering tip";
          ariaLabel = "1 watering pattern suggestion available";
        } else {
          message = "Care tip";
          ariaLabel = "1 plant care suggestion available";
        }
      } else {
        if (hasScheduleAdjustment && hasWateringIssues) {
          message = `${count} care tips`;
          ariaLabel = `${count} plant care suggestions available`;
        } else if (hasScheduleAdjustment) {
          message = `${count} schedule tips`;
          ariaLabel = `${count} watering schedule suggestions available`;
        } else if (hasWateringIssues) {
          message = `${count} watering tips`;
          ariaLabel = `${count} watering pattern suggestions available`;
        } else {
          message = `${count} care tips`;
          ariaLabel = `${count} plant care suggestions available`;
        }
      }
    }

    // Determine styling based on severity
    let bgColor = "";
    let textColor = "";
    let borderColor = "";
    let darkBgColor = "";
    let darkTextColor = "";
    let darkBorderColor = "";

    switch (highestSeverity) {
      case "high":
        bgColor = "bg-amber-100";
        textColor = "text-amber-800";
        borderColor = "border-amber-200";
        darkBgColor = "dark:bg-amber-950/40";
        darkTextColor = "dark:text-amber-300";
        darkBorderColor = "dark:border-amber-700";
        break;
      case "medium":
        bgColor = "bg-blue-100";
        textColor = "text-blue-800";
        borderColor = "border-blue-200";
        darkBgColor = "dark:bg-blue-950/40";
        darkTextColor = "dark:text-blue-300";
        darkBorderColor = "dark:border-blue-700";
        break;
      default: // low
        bgColor = "bg-green-100";
        textColor = "text-green-800";
        borderColor = "border-green-200";
        darkBgColor = "dark:bg-green-950/40";
        darkTextColor = "dark:text-green-300";
        darkBorderColor = "dark:border-green-700";
        break;
    }

    const classNames = `px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor} border ${borderColor} ${darkBgColor} ${darkTextColor} ${darkBorderColor}`;

    return {
      message,
      ariaLabel,
      classNames,
      severity: highestSeverity,
      count,
    };
  };

  const handleWaterClick = () => {
    setShowWaterConfirmation(true);
  };

  // Format date function to match the existing format used in the app
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    let displayDate = new Date(
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

  // Calculate tomorrow's date in the same format
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
    // First, complete the watering action
    onWater();

    // Clear any existing timeout
    if (patternAnalysisTimeoutRef.current) {
      clearTimeout(patternAnalysisTimeoutRef.current);
    }

    // Then, analyze watering patterns for suggestions (after a brief delay to ensure watering is recorded)
    patternAnalysisTimeoutRef.current = setTimeout(async () => {
      try {
        const analysis = await analyzeQuick(id);
        if (analysis) {
          setPatternAnalysis(analysis);

          // Generate insights from the analysis
          const insights = wateringPatternAnalyzer.generateInsights(analysis);
          setPatternInsights(insights);

          // Show suggestions if there are actionable insights OR if it's a positive pattern (consistent) OR insufficient data
          const hasActionableInsights = insights.some(
            (insight) => insight.actionable
          );
          const isConsistentPattern = analysis.pattern === "consistent";
          const isInsufficientData =
            analysis.confidence === "low" &&
            analysis.reasoning.some((r) => r.includes("Need at least"));

          if (
            hasActionableInsights ||
            isConsistentPattern ||
            isInsufficientData
          ) {
            setShowPatternSuggestions(true);
          }
        }
      } catch (error) {
        console.error("Error analyzing watering pattern:", error);
      }
      patternAnalysisTimeoutRef.current = null;
    }, TIMING.WATERING_PATTERN_DELAY);
  };

  const handleAlreadyWatered = async (date: string, notes?: string) => {
    // FUTURE FEATURE: Implement backdating watering to a specific date
    // This would require modifying the onWater callback to accept a date parameter
    // and updating the watering_records table insert to use the provided date
    // For now, just water the plant with current timestamp
    onWater();
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

  // Handle schedule adjustment from pattern suggestions
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
  const getStatusColor = () => {
    if (hasUnknownWateringDate)
      return "bg-neutral-500 text-white border-neutral-500";
    if (isOverdue) return "bg-red-500 text-white border-red-500";
    if (isPostponed) return "bg-sprout-water text-white border-sprout-water";

    if (daysUntilWatering === 0) {
      // Check if truly just watered vs due today
      if (lastWateredDate) {
        const today = new Date();
        const lastWateredDateObj = new Date(lastWateredDate);
        const timeDiff = today.getTime() - lastWateredDateObj.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // If watered within the last 12 hours, show success green (watered today)
        if (hoursDiff <= 12) {
          return "bg-sprout-success text-white border-sprout-success";
        }
      }

      // Due today - show orange
      return "bg-orange-500 text-white border-orange-500";
    }

    // Due in 1-2 days - show orange
    if (daysUntilWatering <= 2)
      return "bg-orange-500 text-white border-orange-500";

    // Default - more than 2 days away, show green
    return "bg-sprout-success text-white border-sprout-success";
  };

  const getStatusText = () => {
    if (hasUnknownWateringDate) return "Unknown schedule";
    if (isPostponed) {
      if (daysUntilWatering === 0) return "Postponed until later today";
      if (daysUntilWatering === 1) return "Postponed until tomorrow";
      return `Postponed for ${daysUntilWatering} days`;
    }
    if (isOverdue) return `Overdue by ${Math.abs(daysUntilWatering)} days`;

    // Check if plant was watered within the last day (show "Watered today")
    if (daysUntilWatering === 0) {
      // Additional check: if last watered was very recent (same day), show "Watered today"
      // Otherwise, it means it's exactly on schedule and due today
      if (lastWateredDate) {
        const today = new Date();
        const lastWateredDateObj = new Date(lastWateredDate);
        const timeDiff = today.getTime() - lastWateredDateObj.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // If watered within the last 12 hours, show "Watered today"
        if (hoursDiff <= 12) {
          return "Watered today";
        }
      }

      return "Due today";
    }

    if (daysUntilWatering === 1) return "Water tomorrow";
    if (daysUntilWatering < 0)
      return `Overdue by ${Math.abs(daysUntilWatering)} days`;
    return `Water in ${daysUntilWatering} days`;
  };

  const handleCardClick = () => {
    if (isSelectionMode) {
      togglePlantSelection(id);
    } else {
      setShowFullscreenImage(true);
    }
  };

  return (
    <>
      <div
        className={cn(
          "relative bg-card border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden",
          isSelectionMode && "cursor-pointer",
          isSelected && "ring-2 ring-sprout-primary border-sprout-primary"
        )}
        data-testid="plant-card"
        onClick={isSelectionMode ? () => togglePlantSelection(id) : undefined}
      >
        {/* Selection Checkbox - Top Left */}
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

        <div
          className="cursor-pointer relative"
          onClick={!isSelectionMode ? handleCardClick : undefined}
        >
          <PlantImage
            src={image}
            alt={name}
            className="w-full h-56"
            imageClassName="object-cover"
          />

          {/* Status Badge - Top Right of image */}
          <div
            className={`absolute top-3 right-3 transition-opacity duration-200 ${
              isOverwateringActive
                ? "opacity-0 pointer-events-none"
                : "opacity-100"
            }`}
            aria-hidden={isOverwateringActive}
          >
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}
            >
              {isPostponed && <Clock className="w-3 h-3 inline mr-1" />}
              {(isOverdue || hasUnknownWateringDate) && !isPostponed && (
                <AlertTriangle className="w-3 h-3 inline mr-1" />
              )}
              {getStatusText()}
            </span>
          </div>

          {/* Overwatering Warning Badge - Top Left of image */}
          <div
            className={`absolute top-3 left-3 transition-opacity duration-200 ${
              isOverwateringActive
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
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
              {overwatering?.level === "high"
                ? "Possible overwatering"
                : "Watch watering"}
            </span>
          </div>

          {/* Smart Suggestions Badge - Bottom Left of image */}
          {(() => {
            const badgeInfo = getBadgeInfo();
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
        </div>

        <TooltipProvider>
          <div
            className="p-5 grid h-full"
            style={{
              gridTemplateRows:
                "minmax(1.75rem, auto) auto minmax(0, auto) 1fr auto",
            }}
          >
            {/* Header Section - Natural height with household badge accommodation */}
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
                    householdId &&
                      "hover:bg-blue-200 dark:hover:bg-blue-800 cursor-pointer"
                  )}
                  disabled={!householdId}
                >
                  🏠 {householdName}
                </button>
              )}
            </div>

            {/* Plant Type Section - Natural height with truncation */}
            <div className="mb-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {plantType}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{plantType}</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Warning Messages Area - Collapses when empty */}
            <div className={hasUnknownWateringDate ? "mb-4" : ""}>
              {hasUnknownWateringDate && (
                <div className="flex items-center gap-2 p-2 bg-sprout-cream/20 border border-sprout-cream/40 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-sprout-dark flex-shrink-0" />
                  <p className="text-xs text-sprout-dark">
                    Last watering date unknown - please water and record or edit
                    the plant details
                  </p>
                </div>
              )}
            </div>

            {/* Watering Info Section - Flexible space absorbs height differences */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last watered:</span>
                <span className="text-foreground font-medium">
                  {lastWatered}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Next watering:</span>
                <span className="text-foreground font-medium">
                  {nextWateringDue}
                </span>
              </div>
              {overwatering && overwatering.level !== "none" && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Frequency</span>
                  <span className="text-foreground">
                    {overwatering.count} in {overwatering.windowDays}d
                    {overwatering.avgIntervalDays
                      ? ` • avg ${overwatering.avgIntervalDays}d`
                      : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Action Dropdown Menu */}
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="w-full bg-sprout-water hover:bg-sprout-water/90 text-sprout-white rounded-xl font-medium"
                    aria-label="Plant actions menu"
                  >
                    Actions
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={handleWaterClick}
                    className="cursor-pointer"
                  >
                    <Droplets className="w-4 h-4 mr-2 text-sprout-water" />
                    Water Now
                  </DropdownMenuItem>

                  {daysUntilWatering <= 0 &&
                    !isPostponed &&
                    !hasUnknownWateringDate &&
                    lastWateredDate &&
                    onPostpone && (
                      <DropdownMenuItem
                        onClick={handlePostponeClick}
                        className="cursor-pointer"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Push to Tomorrow
                      </DropdownMenuItem>
                    )}

                  {(daysUntilWatering <= 0 &&
                    !isPostponed &&
                    !hasUnknownWateringDate &&
                    lastWateredDate &&
                    onPostpone) ||
                  onViewHistory ? (
                    <DropdownMenuSeparator />
                  ) : null}

                  {onViewHistory && (
                    <DropdownMenuItem
                      onClick={onViewHistory}
                      className="cursor-pointer"
                    >
                      <History className="w-4 h-4 mr-2" />
                      {hasPendingSuggestions
                        ? "History & Insights"
                        : "View Watering History"}
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Plant
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </TooltipProvider>
      </div>

      <WaterConfirmationDialog
        open={showWaterConfirmation}
        onOpenChange={setShowWaterConfirmation}
        onConfirm={handleConfirmWater}
        onPostpone={onPostpone}
        onAlreadyWatered={handleAlreadyWatered}
        plantName={name}
        showOverwateringWarning={showOverwateringWarning}
        daysSinceLastWatered={daysSinceLastWatered}
        wateringScheduleDays={suggestedWateringDays || 7}
        lastWateredDate={lastWateredDate}
      />

      <FullscreenImageModal
        isOpen={showFullscreenImage}
        onClose={() => setShowFullscreenImage(false)}
        imageSrc={image}
        imageAlt={name}
        plantName={name}
      />
      <PatternSuggestionsDialog
        isOpen={showPatternSuggestions}
        onClose={() => setShowPatternSuggestions(false)}
        analysis={patternAnalysis}
        insights={patternInsights}
        plantName={name}
        plantId={id}
        onAcceptSuggestion={handlePatternScheduleAdjustment}
        onDismissAll={() => setShowPatternSuggestions(false)}
      />

      <PatternTipsModal
        isOpen={showPendingTips}
        onClose={() => setShowPendingTips(false)}
        analysis={null}
        insights={visiblePendingInsights}
        plantName={name}
        plantId={id}
        onAcceptSuggestion={handlePatternScheduleAdjustment}
        onDismissAll={() => setShowPendingTips(false)}
        showPatternSummary={false}
      />

      <PostponeConfirmationDialog
        open={showPostponeConfirmation}
        onOpenChange={setShowPostponeConfirmation}
        onConfirm={handleConfirmPostpone}
        plantName={name}
        currentNextWatering={nextWateringDue}
        postponedNextWatering={getTomorrowDate()}
      />
    </>
  );
};

export default MyPlantCard;

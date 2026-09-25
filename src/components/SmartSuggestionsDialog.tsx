import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle,
  CheckCircle2,
  Eye,
  Lightbulb,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SheetGrabber,
  dialogSheetClasses,
  sheetHeaderClasses,
  sheetIconButtonClasses,
  sheetPrimaryButtonClasses,
  sheetSecondaryButtonClasses,
  sheetTitleClasses,
} from "@/components/ui/bento-sheet";
import { cn } from "@/lib/utils";
import { PatternInsight } from "@/types/wateringPatternTypes";

export interface PlantSuggestion {
  plantId: string;
  plantName: string;
  plantType: string;
  insights: PatternInsight[];
}

interface SmartSuggestionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plantSuggestions: PlantSuggestion[];
  onApplyAllSuggestions: () => Promise<void>;
  onApplySuggestion: (plantId: string, insight: PatternInsight) => Promise<void>;
  onDismissAllSuggestions: () => void;
  onDismissPlantSuggestions: (plantId: string) => void;
  onViewPlantHistory: (plantId: string) => void;
  dismissedPlantIds?: Set<string>; // For showing loading states
  isLoading?: boolean; // Loading state from parent
}

export function SmartSuggestionsDialog({
  isOpen,
  onClose,
  plantSuggestions,
  onApplyAllSuggestions,
  onApplySuggestion,
  onDismissAllSuggestions,
  onDismissPlantSuggestions,
  onViewPlantHistory,
  dismissedPlantIds: _dismissedPlantIds,
  isLoading = false,
}: SmartSuggestionsDialogProps) {
  const [isApplyingAll, setIsApplyingAll] = useState(false);
  const [applyingPlantId, setApplyingPlantId] = useState<string | null>(null);

  // Use plantSuggestions directly from props - filtering is now done in the parent Dashboard component
  const activePlantSuggestions = plantSuggestions;

  const totalSuggestions = activePlantSuggestions.reduce(
    (sum, plant) => sum + plant.insights.length,
    0
  );

  const highPrioritySuggestions = activePlantSuggestions.reduce(
    (sum, plant) =>
      sum + plant.insights.filter((insight) => insight.severity === "high").length,
    0
  );

  // Count insights that carry a concrete schedule change to apply. When there
  // are none, "Apply All" has nothing to apply and instead acknowledges the
  // advisory insights, so the button is labelled accordingly.
  const applicableSuggestions = activePlantSuggestions.reduce(
    (sum, plant) =>
      sum +
      plant.insights.filter((insight) => insight.suggestion && insight.actionable)
        .length,
    0
  );
  const hasApplicableSuggestions = applicableSuggestions > 0;

  const handleApplyAll = async () => {
    setIsApplyingAll(true);
    try {
      await onApplyAllSuggestions();
      onClose();
    } catch (error) {
      console.error("Error applying all suggestions:", error);
    } finally {
      setIsApplyingAll(false);
    }
  };

  const handleApplySuggestion = async (plantId: string, insight: PatternInsight) => {
    setApplyingPlantId(plantId);
    try {
      await onApplySuggestion(plantId, insight);
    } catch (error) {
      console.error("Error applying suggestion:", error);
    } finally {
      setApplyingPlantId(null);
    }
  };

  const handleDismissPlant = (plantId: string) => {
    // Dismissal logic is now handled entirely by the parent component
    onDismissPlantSuggestions(plantId);
  };

  const empty = !isLoading && activePlantSuggestions.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(dialogSheetClasses, "sm:max-w-2xl")}>
        <SheetGrabber />
        <DialogHeader className={sheetHeaderClasses}>
          <div
            className={cn(
              "w-[52px] h-[52px] shrink-0 rounded-[18px] flex items-center justify-center text-sprout-dark",
              empty ? "bg-sprout-success" : "bg-sprout-water"
            )}
          >
            {empty ? <CheckCircle className="w-6 h-6" /> : <Brain className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className={sheetTitleClasses}>
              {isLoading ? "Loading suggestions..." : empty ? "All caught up!" : "Watering suggestions"}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium">
              {isLoading
                ? "Analyzing your watering patterns"
                : empty
                  ? "No pending suggestions right now"
                  : `${activePlantSuggestions.length} plant${activePlantSuggestions.length !== 1 ? "s" : ""} · ${totalSuggestions} suggestion${totalSuggestions !== 1 ? "s" : ""}${highPrioritySuggestions > 0 ? ` · ${highPrioritySuggestions} high priority` : ""}`}
            </DialogDescription>
          </div>
          <button type="button" onClick={onClose} className={cn(sheetIconButtonClasses, "self-start")} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="mt-4 space-y-2">
          {isLoading ? (
            <div className="space-y-2" aria-busy="true">
              <Skeleton className="h-40 w-full rounded-3xl" />
              <Skeleton className="h-40 w-full rounded-3xl" />
            </div>
          ) : empty ? (
            <>
              <p className="rounded-3xl bg-card p-5 text-[15px] text-muted-foreground">
                Your plants are all set with their current watering patterns. Keep up the great care!
              </p>
              <button type="button" onClick={onClose} className={sheetPrimaryButtonClasses}>
                Close
              </button>
            </>
          ) : (
            <>
              {activePlantSuggestions.map((plantSuggestion) => (
                <section key={plantSuggestion.plantId} className="rounded-3xl bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display text-lg font-bold tracking-[-0.02em] text-foreground truncate">
                        {plantSuggestion.plantName}
                      </h4>
                      <p className="text-[13px] text-muted-foreground truncate">{plantSuggestion.plantType}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onViewPlantHistory(plantSuggestion.plantId)}
                      className="shrink-0 h-9 px-3 rounded-full bg-field text-foreground text-[13px] font-bold inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      History
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDismissPlant(plantSuggestion.plantId)}
                      className="shrink-0 w-9 h-9 rounded-xl bg-field text-muted-foreground hover:text-foreground flex items-center justify-center"
                      aria-label={`Dismiss suggestions for ${plantSuggestion.plantName}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 mt-3">
                    {plantSuggestion.insights.map((insight, insightIndex) => {
                      const isApplying = applyingPlantId === plantSuggestion.plantId;
                      const high = insight.severity === "high";
                      return (
                        <div key={`${insight.type}-${insightIndex}`} className="rounded-[20px] bg-field p-3.5">
                          <div className="flex items-start gap-2.5">
                            <div
                              className={cn(
                                "w-8 h-8 shrink-0 rounded-[10px] text-sprout-dark flex items-center justify-center",
                                high ? "bg-sprout-warning" : insight.severity === "medium" ? "bg-sprout-cream" : "bg-sprout-water"
                              )}
                            >
                              {high ? <AlertTriangle className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-[15px] font-bold text-foreground leading-snug">{insight.title}</h5>
                              <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{insight.description}</p>
                            </div>
                          </div>

                          {insight.suggestion && (
                            <>
                              <div className="flex items-center justify-between gap-3 mt-3 rounded-[16px] bg-card px-4 py-2.5">
                                <span className="text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground">
                                  Schedule
                                </span>
                                <span className="flex items-center gap-2 font-display font-bold text-foreground">
                                  <span className="text-muted-foreground">{insight.suggestion.currentSchedule}d</span>
                                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-lg">{insight.suggestion.suggestedSchedule}d</span>
                                </span>
                              </div>
                              {insight.suggestion.reasoning[0] && (
                                <p className="text-[13px] text-muted-foreground mt-2 px-1">{insight.suggestion.reasoning[0]}</p>
                              )}
                              <div className="flex gap-2 mt-3">
                                <button
                                  type="button"
                                  onClick={() => handleDismissPlant(plantSuggestion.plantId)}
                                  className="flex-1 h-11 rounded-[16px] bg-card text-foreground font-bold text-sm"
                                >
                                  Dismiss
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApplySuggestion(plantSuggestion.plantId, insight)}
                                  disabled={isApplying}
                                  className="flex-[1.4] h-11 rounded-[16px] bg-sprout-dark text-sprout-cream font-bold text-sm shadow-[inset_0_0_0_2px_#dfc490] disabled:opacity-60"
                                >
                                  {isApplying ? "Applying..." : "Apply Change"}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onDismissAllSuggestions} className={cn(sheetSecondaryButtonClasses, "flex-1")}>
                  Dismiss All
                </button>
                <button
                  type="button"
                  onClick={handleApplyAll}
                  disabled={isApplyingAll || totalSuggestions === 0}
                  className={cn(sheetPrimaryButtonClasses, "flex-[1.4]")}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {isApplyingAll
                    ? hasApplicableSuggestions
                      ? "Applying..."
                      : "Acknowledging..."
                    : hasApplicableSuggestions
                      ? "Apply All"
                      : "Acknowledge All"}
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

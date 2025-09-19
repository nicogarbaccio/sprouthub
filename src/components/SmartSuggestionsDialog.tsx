import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  CheckCircle,
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  Eye,
  CheckCircle2,
  X,
  Lightbulb,
} from "lucide-react";
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
  dismissedPlantIds,
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

  const getInsightIcon = (insight: PatternInsight) => {
    if (insight.suggestion?.adjustmentType === "increase") {
      return TrendingUp;
    } else if (insight.suggestion?.adjustmentType === "decrease") {
      return TrendingDown;
    }
    return Target;
  };

  const getInsightColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100";
      case "medium":
        return "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100";
      default:
        return "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100";
    }
  };

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              Loading Suggestions...
            </DialogTitle>
            <DialogDescription>
              Analyzing your watering patterns
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">
              Please wait while we analyze your plants...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (activePlantSuggestions.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              All Caught Up!
            </DialogTitle>
            <DialogDescription>
              No pending smart suggestions at the moment.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Your plants are all set with their current watering patterns.
              Keep up the great care!
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-full">
              <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle>Smart Watering Suggestions</DialogTitle>
              <DialogDescription>
                AI-powered recommendations to optimize your plant care
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Summary */}
        <div className="p-4 bg-gradient-to-r from-blue-50/50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-950/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-blue-900 dark:text-blue-100">
              Suggestions Summary
            </h3>
            <div className="flex gap-2">
              {highPrioritySuggestions > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/20 dark:text-orange-300 dark:border-orange-800"
                >
                  {highPrioritySuggestions} high priority
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {totalSuggestions} total suggestions
              </Badge>
            </div>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {activePlantSuggestions.length} plant{activePlantSuggestions.length !== 1 ? "s" : ""}{" "}
            with optimization opportunities
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleApplyAll}
            disabled={isApplyingAll || totalSuggestions === 0}
            className="flex-1"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {isApplyingAll ? "Applying..." : "Apply All Suggestions"}
          </Button>
          <Button variant="outline" onClick={onDismissAllSuggestions}>
            Dismiss All
          </Button>
        </div>

        <Separator />

        {/* Plant Suggestions */}
        <div className="space-y-6">
          {activePlantSuggestions.map((plantSuggestion, plantIndex) => (
            <div key={plantSuggestion.plantId} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-lg">{plantSuggestion.plantName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {plantSuggestion.plantType}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewPlantHistory(plantSuggestion.plantId)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View History
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismissPlant(plantSuggestion.plantId)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {plantSuggestion.insights.map((insight, insightIndex) => {
                const InsightIcon = getInsightIcon(insight);
                const isApplying = applyingPlantId === plantSuggestion.plantId;

                return (
                  <div
                    key={`${insight.type}-${insightIndex}`}
                    className={cn(
                      "p-4 rounded-lg border",
                      getInsightColor(insight.severity)
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <InsightIcon className="w-4 h-4" />
                        <h5 className="font-medium text-sm">{insight.title}</h5>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            insight.severity === "high"
                              ? "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-700"
                              : insight.severity === "medium"
                              ? "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-700"
                              : "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-700"
                          )}
                        >
                          {insight.severity}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm mb-3 opacity-90">{insight.description}</p>

                    {insight.suggestion && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 bg-background/80 rounded border">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 opacity-60" />
                            <span className="text-sm">Schedule Change</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <span className="opacity-60">
                              {insight.suggestion.currentSchedule}d
                            </span>
                            {insight.suggestion.adjustmentType === "increase" ? (
                              <TrendingUp className="w-3 h-3 text-green-600" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-blue-600" />
                            )}
                            <span className="font-medium">
                              {insight.suggestion.suggestedSchedule}d
                            </span>
                          </div>
                        </div>

                        {insight.suggestion.reasoning[0] && (
                          <p className="text-xs bg-background/60 p-2 rounded border-l-2 border-current/20 opacity-75">
                            {insight.suggestion.reasoning[0]}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleApplySuggestion(plantSuggestion.plantId, insight)
                            }
                            disabled={isApplying}
                            className="flex-1"
                          >
                            {isApplying ? "Applying..." : "Apply Change"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDismissPlant(plantSuggestion.plantId)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {plantIndex < activePlantSuggestions.length - 1 && <Separator />}
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
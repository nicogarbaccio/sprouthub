import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  Clock,
  Edit3,
  Calendar,
  Info,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { Season } from "@/services/calendarSeasonalService";
import { PlantSeasonalSuggestion } from "@/hooks/useCalendarSeasonalNotification";
import { toast } from "sonner";

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
  const [customValues, setCustomValues] = useState<Record<string, number>>({});
  const [editingPlant, setEditingPlant] = useState<string | null>(null);

  const seasonDisplayName = season.charAt(0).toUpperCase() + season.slice(1);
  const unappliedSuggestions = suggestions.filter(
    (s) => !appliedPlants.has(s.plantId)
  );
  const appliedCount = suggestions.filter(
    (s) => appliedPlants.has(s.plantId)
  ).length;

  const getChangeIcon = (adjustmentDays: number) => {
    if (adjustmentDays < 0)
      return <TrendingDown className="h-4 w-4 text-destructive" />;
    if (adjustmentDays > 0)
      return <TrendingUp className="h-4 w-4 text-primary" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getChangeColor = (adjustmentDays: number) => {
    if (adjustmentDays < 0)
      return "text-destructive bg-destructive/10 border-destructive/20";
    if (adjustmentDays > 0)
      return "text-primary bg-primary/10 border-primary/20";
    return "text-muted-foreground bg-muted border-border";
  };

  const handleCustomValueChange = (plantId: string, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 45) {
      setCustomValues((prev) => ({ ...prev, [plantId]: numValue }));
    }
  };

  const handleApplyCustom = async (plantId: string) => {
    const customValue = customValues[plantId];
    if (customValue) {
      await onApplySuggestion(plantId, customValue);
      setEditingPlant(null);
    }
  };

  const handleApplyAll = async () => {
    try {
      await onApplyAll();
      toast.success("Schedules Updated", {
        description: `Successfully updated schedules for ${unappliedSuggestions.length} plants.`,
      });
    } catch (error) {
      toast.error("Error", {
        description: "Failed to update schedules. Please try again.",
      });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl bg-background border-border [&>button]:text-white [&>button]:hover:text-white/80 [&>button]:z-20">
        {/* Gradient Header */}
        <div className="bg-gradient-to-br from-sprout-primary to-sprout-medium px-6 py-4 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <DialogHeader className="space-y-0 text-left flex-1 min-w-0">
              <DialogTitle className="text-white text-base font-semibold">
                {seasonDisplayName} Schedule Review
              </DialogTitle>
              <DialogDescription className="text-white/75 text-xs leading-snug">
                Update your watering schedules for {seasonDisplayName.toLowerCase()} &middot; {formatDate(changeDate)}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-8 py-6 space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-card border border-border p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-primary mb-0.5">
                  {suggestions.length}
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  Suggestions
                </div>
              </div>
              <div className="rounded-xl bg-card border border-border p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-0.5">
                  {appliedCount}
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  Updated
                </div>
              </div>
              <div className="rounded-xl bg-card border border-border p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-destructive mb-0.5">
                  {unappliedSuggestions.length}
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  Pending
                </div>
              </div>
            </div>

            {/* No suggestions message */}
            {suggestions.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium mb-1 text-lg text-card-foreground">
                  No adjustments needed
                </p>
                <p className="text-sm text-muted-foreground">
                  Your current watering schedules are appropriate for the
                  upcoming season.
                </p>
              </div>
            )}

            {/* Plant Suggestions */}
            <div className="space-y-4">
              {suggestions.map((suggestion) => {
                const isApplied = appliedPlants.has(suggestion.plantId);
                const appliedDays = appliedPlants.get(suggestion.plantId);
                const isEditing = editingPlant === suggestion.plantId;
                const customValue =
                  customValues[suggestion.plantId] ||
                  suggestion.suggestedWateringDays;

                return (
                  <Card
                    key={suggestion.plantId}
                    className={`transition-all duration-200 rounded-xl border border-border shadow-sm overflow-hidden ${
                      isApplied
                        ? "opacity-60 bg-muted"
                        : "bg-card hover:shadow-md hover:border-sprout-medium/40"
                    }`}
                  >
                    <CardHeader className="pb-4 border-b border-border bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-card-foreground">
                            {suggestion.plantNickname}
                            {isApplied && (
                              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="text-xs font-normal rounded-lg"
                            >
                              {suggestion.plantType}
                            </Badge>
                            {suggestion.isOutdoor && (
                              <Badge
                                variant="outline"
                                className="text-xs rounded-lg"
                              >
                                <MapPin className="h-3 w-3 mr-1" />
                                Outdoor
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                        {/* Schedule Change */}
                        <div className="lg:col-span-7 space-y-4">
                          {isApplied && appliedDays ? (
                            <div className="flex items-center justify-between gap-4">
                              {/* Previous */}
                              <div className="flex-1 p-4 rounded-xl bg-muted border border-border text-center">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                  Previous
                                </div>
                                <div className="text-lg font-medium text-muted-foreground line-through">
                                  Every {suggestion.currentWateringDays} days
                                </div>
                              </div>

                              {/* Arrow */}
                              <div className="flex flex-col items-center justify-center text-green-600 dark:text-green-400">
                                <ArrowRight className="h-5 w-5" />
                              </div>

                              {/* Applied */}
                              <div className="flex-1 p-4 rounded-xl border text-center bg-green-600/10 border-green-600/20 text-green-700 dark:text-green-400">
                                <div className="text-xs font-semibold opacity-80 uppercase tracking-wide mb-1">
                                  Updated
                                </div>
                                <div className="text-lg font-bold">
                                  Every {appliedDays} days
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between gap-4">
                                {/* Current */}
                                <div className="flex-1 p-4 rounded-xl bg-muted border border-border text-center">
                                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                    Current
                                  </div>
                                  <div className="text-lg font-medium text-foreground">
                                    Every {suggestion.currentWateringDays} days
                                  </div>
                                </div>

                                {/* Arrow */}
                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                  <ArrowRight className="h-5 w-5" />
                                </div>

                                {/* Suggested */}
                                <div
                                  className={`flex-1 p-4 rounded-xl border text-center ${getChangeColor(
                                    suggestion.adjustmentDays
                                  )}`}
                                >
                                  <div className="text-xs font-semibold opacity-80 uppercase tracking-wide mb-1">
                                    Suggested
                                  </div>
                                  {isEditing ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <Input
                                        type="number"
                                        min="1"
                                        max="45"
                                        value={customValue}
                                        onChange={(e) =>
                                          handleCustomValueChange(
                                            suggestion.plantId,
                                            e.target.value
                                          )
                                        }
                                        className="w-20 h-8 text-center rounded-xl bg-background border-border/50 focus:border-sprout-medium text-foreground"
                                      />
                                      <span className="text-sm font-medium">
                                        days
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="text-lg font-bold">
                                      Every {suggestion.suggestedWateringDays} days
                                    </div>
                                  )}
                                </div>
                              </div>

                              {suggestion.adjustmentDays !== 0 && !isEditing && (
                                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                  {getChangeIcon(suggestion.adjustmentDays)}
                                  <span>
                                    Adjusting by{" "}
                                    {Math.abs(suggestion.adjustmentDays)} days
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Reasoning */}
                        <div className="lg:col-span-5 relative">
                          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 h-full">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Info className="h-4 w-4 text-primary" />
                              </div>
                              <div className="space-y-1">
                                <span className="text-sm font-semibold text-foreground block">
                                  Why this change?
                                </span>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {suggestion.reasoning}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end mt-6 pt-4 border-t border-border gap-3">
                        {!isApplied ? (
                          <>
                            {isEditing ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingPlant(null)}
                                  className="rounded-xl"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleApplyCustom(suggestion.plantId)
                                  }
                                  disabled={isLoading}
                                  className="rounded-xl bg-sprout-medium hover:bg-sprout-primary text-white shadow-md"
                                >
                                  Apply Custom Schedule
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setEditingPlant(suggestion.plantId)
                                  }
                                  className="rounded-xl"
                                >
                                  <Edit3 className="h-4 w-4 mr-2" />
                                  Customize
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    onApplySuggestion(
                                      suggestion.plantId,
                                      suggestion.suggestedWateringDays
                                    )
                                  }
                                  disabled={isLoading}
                                  className="rounded-xl bg-sprout-medium hover:bg-sprout-primary text-white shadow-md"
                                >
                                  Apply Suggestion
                                </Button>
                              </>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-600/10 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                            <CheckCircle className="h-4 w-4" />
                            <span>Schedule Updated</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-8 py-5 border-t border-border bg-card shrink-0 z-10">
          <DialogFooter>
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
              <div className="text-sm text-muted-foreground font-medium">
                {unappliedSuggestions.length > 0 ? (
                  <span>
                    {unappliedSuggestions.length} plants pending review
                  </span>
                ) : (
                  <span className="text-green-600 dark:text-green-400 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    All reviews complete
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 sm:flex-none rounded-xl"
                >
                  Done
                </Button>

                {unappliedSuggestions.length > 0 && (
                  <Button
                    onClick={handleApplyAll}
                    disabled={isLoading}
                    className="flex-1 sm:flex-none rounded-xl bg-sprout-medium hover:bg-sprout-primary text-white shadow-md"
                  >
                    {isLoading ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      `Apply All Changes`
                    )}
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

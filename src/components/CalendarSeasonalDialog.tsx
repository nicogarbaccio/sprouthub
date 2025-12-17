import React, { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Droplets,
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
  appliedPlants: Set<string>;
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

  const getChangeIcon = (adjustmentDays: number) => {
    if (adjustmentDays < 0)
      return (
        <TrendingDown className="h-4 w-4 text-orange-500 dark:text-orange-400" />
      );
    if (adjustmentDays > 0)
      return (
        <TrendingUp className="h-4 w-4 text-blue-500 dark:text-blue-400" />
      );
    return <Minus className="h-4 w-4 text-gray-400 dark:text-gray-500" />;
  };

  const getChangeColor = (adjustmentDays: number) => {
    if (adjustmentDays < 0)
      return "text-orange-700 bg-orange-50 border-orange-100 dark:bg-orange-950/30 dark:border-orange-900/50 dark:text-orange-300";
    if (adjustmentDays > 0)
      return "text-blue-700 bg-blue-50 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-300";
    return "text-gray-700 bg-gray-50 border-gray-100 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-300";
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
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        <div className="p-6 pb-4 bg-white dark:bg-slate-900 shrink-0 z-10 border-b dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-xl dark:text-slate-100">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>{seasonDisplayName} Schedule Review</span>
            </DialogTitle>
            <DialogDescription className="text-base mt-2 dark:text-slate-400">
              Review and update your plant watering schedules for{" "}
              {seasonDisplayName.toLowerCase()}. These suggestions are based on
              typical seasonal patterns and your plant characteristics.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-6">
            {/* Season Info Card */}
            <Card className="bg-blue-50/50 border-blue-100 shadow-sm dark:bg-blue-950/20 dark:border-blue-900/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-semibold text-blue-900 dark:text-blue-100">
                        {seasonDisplayName} begins on {formatDate(changeDate)}
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 pl-6 dark:text-blue-300">
                      Calendar-based seasonal detection • No weather data
                      required
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1 dark:text-blue-400">
                    {suggestions.length}
                  </div>
                  <div className="text-sm font-medium text-gray-500 dark:text-slate-400">
                    Plants with Suggestions
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1 dark:text-green-400">
                    {appliedPlants.size}
                  </div>
                  <div className="text-sm font-medium text-gray-500 dark:text-slate-400">
                    Updated
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-1 dark:text-orange-400">
                    {unappliedSuggestions.length}
                  </div>
                  <div className="text-sm font-medium text-gray-500 dark:text-slate-400">
                    Pending
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* No suggestions message */}
            {suggestions.length === 0 && (
              <Card className="shadow-sm border-dashed dark:bg-slate-900 dark:border-slate-800">
                <CardContent className="p-8 text-center text-gray-600 dark:text-gray-400">
                  <Info className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                  <p className="font-medium mb-1 text-lg dark:text-slate-200">
                    No adjustments needed
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    Your current watering schedules are appropriate for the
                    upcoming season.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Plant Suggestions */}
            <div className="space-y-4">
              {suggestions.map((suggestion) => {
                const isApplied = appliedPlants.has(suggestion.plantId);
                const isEditing = editingPlant === suggestion.plantId;
                const customValue =
                  customValues[suggestion.plantId] ||
                  suggestion.suggestedWateringDays;

                return (
                  <Card
                    key={suggestion.plantId}
                    className={`transition-all duration-200 border shadow-sm overflow-hidden dark:border-slate-800 ${
                      isApplied
                        ? "opacity-60 bg-gray-50 dark:bg-slate-900/50"
                        : "bg-white dark:bg-slate-900 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900"
                    }`}
                  >
                    <CardHeader className="pb-4 border-b bg-gray-50/50 dark:bg-slate-950/50 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg font-semibold flex items-center gap-2 dark:text-slate-100">
                            {suggestion.plantNickname}
                            {isApplied && (
                              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="text-xs font-normal dark:bg-slate-800 dark:text-slate-300"
                            >
                              {suggestion.plantType}
                            </Badge>
                            {suggestion.isOutdoor && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900"
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
                          <div className="flex items-center justify-between gap-4">
                            {/* Current */}
                            <div className="flex-1 p-4 rounded-xl bg-gray-50 border border-gray-100 text-center dark:bg-slate-800/50 dark:border-slate-800">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 dark:text-slate-400">
                                Current
                              </div>
                              <div className="text-lg font-medium text-gray-900 dark:text-slate-100">
                                Every {suggestion.currentWateringDays} days
                              </div>
                            </div>

                            {/* Arrow */}
                            <div className="flex flex-col items-center justify-center text-gray-400 dark:text-slate-600">
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
                                    className="w-20 h-8 text-center bg-white border-blue-300 dark:bg-slate-800 dark:border-blue-700 dark:text-slate-100"
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
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                              {getChangeIcon(suggestion.adjustmentDays)}
                              <span>
                                Adjusting by{" "}
                                {Math.abs(suggestion.adjustmentDays)} days
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Reasoning */}
                        <div className="lg:col-span-5 relative">
                          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 h-full dark:bg-blue-950/20 dark:border-blue-900/50">
                            <div className="flex items-start gap-3">
                              <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5 dark:text-blue-400" />
                              <div className="space-y-1">
                                <span className="text-sm font-semibold text-blue-900 block dark:text-blue-200">
                                  Why this change?
                                </span>
                                <p className="text-sm text-blue-800 leading-relaxed dark:text-blue-300">
                                  {suggestion.reasoning}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-100 gap-3 dark:border-slate-800">
                        {!isApplied ? (
                          <>
                            {isEditing ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingPlant(null)}
                                  className="dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleApplyCustom(suggestion.plantId)
                                  }
                                  disabled={isLoading}
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
                                  className="text-gray-600 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800"
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
                                  className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-500"
                                >
                                  Apply Suggestion
                                </Button>
                              </>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium dark:bg-green-950/30 dark:text-green-400">
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

        <div className="p-4 border-t bg-white dark:bg-slate-900 shrink-0 z-10 dark:border-slate-800">
          <DialogFooter>
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
              <div className="text-sm text-gray-500 font-medium dark:text-slate-400">
                {unappliedSuggestions.length > 0 ? (
                  <span>
                    {unappliedSuggestions.length} plants pending review
                  </span>
                ) : (
                  <span className="text-green-600 flex items-center gap-2 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    All reviews complete
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 sm:flex-none dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Close
                </Button>

                {unappliedSuggestions.length > 0 && (
                  <Button
                    onClick={handleApplyAll}
                    disabled={isLoading}
                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-500"
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

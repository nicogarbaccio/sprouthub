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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Droplets,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  Clock,
  Edit3,
  Sparkles,
  Info,
} from "lucide-react";
import { SeasonalScheduleSuggestion } from "@/services/scheduleVersioningService";
import { Season } from "@/services/seasonalDetectionService";

interface SeasonalReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  season: Season;
  suggestions: SeasonalScheduleSuggestion[];
  isLoading: boolean;
  onApplySuggestion: (plantId: string, days: number) => Promise<void>;
  onApplyAll: () => Promise<void>;
  onCustomize: (plantId: string, days: number) => Promise<void>;
  appliedSuggestions: Set<string>;
}

export function SeasonalReviewDialog({
  isOpen,
  onClose,
  season,
  suggestions,
  isLoading,
  onApplySuggestion,
  onApplyAll,
  onCustomize,
  appliedSuggestions,
}: SeasonalReviewDialogProps) {
  const [customValues, setCustomValues] = useState<Record<string, number>>({});
  const [editingPlant, setEditingPlant] = useState<string | null>(null);

  const seasonDisplayName = season.charAt(0).toUpperCase() + season.slice(1);
  const unappliedSuggestions = suggestions.filter(
    (s) => !appliedSuggestions.has(s.plant_id)
  );

  const getChangeIcon = (current: number, suggested: number) => {
    if (suggested > current)
      return <TrendingUp className="h-4 w-4 text-blue-500" />;
    if (suggested < current)
      return <TrendingDown className="h-4 w-4 text-orange-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getChangeColor = (current: number, suggested: number) => {
    if (suggested > current) return "text-blue-600 bg-blue-50";
    if (suggested < current) return "text-orange-600 bg-orange-50";
    return "text-gray-600 bg-gray-50";
  };

  const getConfidenceColor = (
    confidence: SeasonalScheduleSuggestion["confidence"]
  ) => {
    switch (confidence) {
      case "high":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleCustomValueChange = (plantId: string, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 30) {
      setCustomValues((prev) => ({ ...prev, [plantId]: numValue }));
    }
  };

  const handleApplyCustom = async (plantId: string) => {
    const customValue = customValues[plantId];
    if (customValue) {
      await onCustomize(plantId, customValue);
      setEditingPlant(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <span>{seasonDisplayName} Schedule Review</span>
          </DialogTitle>
          <DialogDescription>
            Review and update your plant watering schedules for the new season.
            Our suggestions are based on weather patterns and your plant care
            history.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {suggestions.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Plants</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {appliedSuggestions.size}
                    </div>
                    <div className="text-sm text-gray-600">Updated</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {unappliedSuggestions.length}
                    </div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </CardContent>
                </Card>
              </div>

              {/* Plant Suggestions */}
              {suggestions.map((suggestion) => {
                const isApplied = appliedSuggestions.has(suggestion.plant_id);
                const isEditing = editingPlant === suggestion.plant_id;
                const customValue =
                  customValues[suggestion.plant_id] ||
                  suggestion.suggested_days;

                return (
                  <Card
                    key={suggestion.plant_id}
                    className={isApplied ? "opacity-75" : ""}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <span>{suggestion.plant_nickname}</span>
                          {isApplied && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={getConfidenceColor(
                              suggestion.confidence
                            )}
                          >
                            {suggestion.confidence}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {suggestion.based_on.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Schedule Change */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                            <div className="text-sm">
                              <div className="font-medium">
                                Current Schedule
                              </div>
                              <div className="text-gray-600">
                                Every {suggestion.current_watering_days} days
                              </div>
                            </div>
                            <Droplets className="h-5 w-5 text-gray-400" />
                          </div>

                          <div className="flex items-center justify-center">
                            {getChangeIcon(
                              suggestion.current_watering_days,
                              suggestion.suggested_days
                            )}
                          </div>

                          <div
                            className={`flex items-center justify-between p-3 rounded-lg ${getChangeColor(
                              suggestion.current_watering_days,
                              suggestion.suggested_days
                            )}`}
                          >
                            <div className="text-sm">
                              <div className="font-medium">
                                Suggested Schedule
                              </div>
                              {isEditing ? (
                                <div className="flex items-center space-x-2 mt-1">
                                  <Label
                                    htmlFor={`custom-${suggestion.plant_id}`}
                                    className="sr-only"
                                  >
                                    Custom days
                                  </Label>
                                  <Input
                                    id={`custom-${suggestion.plant_id}`}
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={customValue}
                                    onChange={(e) =>
                                      handleCustomValueChange(
                                        suggestion.plant_id,
                                        e.target.value
                                      )
                                    }
                                    className="w-16 h-6 text-xs"
                                  />
                                  <span className="text-xs">days</span>
                                </div>
                              ) : (
                                <div className="text-current">
                                  Every {suggestion.suggested_days} days
                                </div>
                              )}
                            </div>
                            <Droplets className="h-5 w-5" />
                          </div>
                        </div>

                        {/* Reasoning */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-1 text-sm font-medium">
                            <Info className="h-4 w-4" />
                            <span>Why this change?</span>
                          </div>
                          <ul className="text-xs space-y-1 text-gray-600">
                            {suggestion.reasoning.map((reason, index) => (
                              <li
                                key={index}
                                className="flex items-start space-x-1"
                              >
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>

                          {suggestion.previous_schedule && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                              <div className="font-medium text-blue-800">
                                Last Year
                              </div>
                              <div className="text-blue-600">
                                {suggestion.previous_schedule.days} days (
                                {suggestion.previous_schedule.performance}{" "}
                                performance)
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t">
                        <div className="flex items-center space-x-2">
                          {!isApplied && (
                            <>
                              {isEditing ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleApplyCustom(suggestion.plant_id)
                                    }
                                    disabled={isLoading}
                                  >
                                    Apply Custom
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingPlant(null)}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      onApplySuggestion(
                                        suggestion.plant_id,
                                        suggestion.suggested_days
                                      )
                                    }
                                    disabled={isLoading}
                                  >
                                    Apply Suggestion
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setEditingPlant(suggestion.plant_id)
                                    }
                                  >
                                    <Edit3 className="h-4 w-4 mr-1" />
                                    Customize
                                  </Button>
                                </>
                              )}
                            </>
                          )}
                        </div>

                        {isApplied && (
                          <div className="flex items-center space-x-1 text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4" />
                            <span>Applied</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-600">
              {unappliedSuggestions.length > 0 && (
                <span>{unappliedSuggestions.length} changes pending</span>
              )}
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>

              {unappliedSuggestions.length > 0 && (
                <Button onClick={onApplyAll} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    `Apply All (${unappliedSuggestions.length})`
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

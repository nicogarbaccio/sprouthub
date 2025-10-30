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
  Calendar,
  Info,
  MapPin,
} from "lucide-react";
import { Season } from "@/services/calendarSeasonalService";
import { PlantSeasonalSuggestion } from "@/hooks/useCalendarSeasonalNotification";

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
      return <TrendingDown className="h-4 w-4 text-orange-500" />;
    if (adjustmentDays > 0)
      return <TrendingUp className="h-4 w-4 text-blue-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getChangeColor = (adjustmentDays: number) => {
    if (adjustmentDays < 0) return "text-orange-600 bg-orange-50";
    if (adjustmentDays > 0) return "text-blue-600 bg-blue-50";
    return "text-gray-600 bg-gray-50";
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <span>{seasonDisplayName} Schedule Review</span>
          </DialogTitle>
          <DialogDescription>
            Review and update your plant watering schedules for {seasonDisplayName.toLowerCase()}.
            These suggestions are based on typical seasonal patterns and your
            plant characteristics.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4">
              {/* Season Info Card */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">
                          {seasonDisplayName} begins on {formatDate(changeDate)}
                        </span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Calendar-based seasonal detection • No weather data
                        required
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {suggestions.length}
                    </div>
                    <div className="text-sm text-gray-600">
                      Plants with Suggestions
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {appliedPlants.size}
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

              {/* No suggestions message */}
              {suggestions.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center text-gray-600">
                    <Info className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="font-medium mb-1">No adjustments needed</p>
                    <p className="text-sm">
                      Your current watering schedules are appropriate for the
                      upcoming season.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Plant Suggestions */}
              {suggestions.map((suggestion) => {
                const isApplied = appliedPlants.has(suggestion.plantId);
                const isEditing = editingPlant === suggestion.plantId;
                const customValue =
                  customValues[suggestion.plantId] ||
                  suggestion.suggestedWateringDays;

                return (
                  <Card
                    key={suggestion.plantId}
                    className={isApplied ? "opacity-75" : ""}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <span>{suggestion.plantNickname}</span>
                          {isApplied && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {suggestion.plantType}
                          </Badge>
                          {suggestion.isOutdoor && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-sky-50"
                            >
                              <MapPin className="h-3 w-3 mr-1" />
                              Outdoor
                            </Badge>
                          )}
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
                                Every {suggestion.currentWateringDays} days
                              </div>
                            </div>
                            <Droplets className="h-5 w-5 text-gray-400" />
                          </div>

                          <div className="flex items-center justify-center">
                            {getChangeIcon(suggestion.adjustmentDays)}
                          </div>

                          <div
                            className={`flex items-center justify-between p-3 rounded-lg ${getChangeColor(
                              suggestion.adjustmentDays
                            )}`}
                          >
                            <div className="text-sm">
                              <div className="font-medium">
                                Suggested Schedule
                              </div>
                              {isEditing ? (
                                <div className="flex items-center space-x-2 mt-1">
                                  <Label
                                    htmlFor={`custom-${suggestion.plantId}`}
                                    className="sr-only"
                                  >
                                    Custom days
                                  </Label>
                                  <Input
                                    id={`custom-${suggestion.plantId}`}
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
                                    className="w-16 h-6 text-xs"
                                  />
                                  <span className="text-xs">days</span>
                                </div>
                              ) : (
                                <div className="text-current">
                                  Every {suggestion.suggestedWateringDays} days
                                  {suggestion.adjustmentDays !== 0 && (
                                    <span className="ml-1 text-xs">
                                      ({suggestion.adjustmentDays > 0 ? "+" : ""}
                                      {suggestion.adjustmentDays} days)
                                    </span>
                                  )}
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
                          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {suggestion.reasoning}
                          </div>
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
                                      handleApplyCustom(suggestion.plantId)
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
                                        suggestion.plantId,
                                        suggestion.suggestedWateringDays
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
                                      setEditingPlant(suggestion.plantId)
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

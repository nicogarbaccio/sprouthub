import { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Droplets,
  FileText,
  AlertTriangle,
  Trash2,
  Clock,
} from "lucide-react";
import { computeOverwateringRisk } from "@/utils/overwatering";
import { wateringToast } from "@/utils/toast-helpers";
import { format, isFuture } from "date-fns";
import { useWateringPatternAnalysis } from "@/hooks/useWateringPatternAnalysis";
import { PatternAnalysisSection } from "@/components/watering-patterns";
import {
  useWateringRecords,
  type WateringRecord,
} from "@/hooks/useWateringRecords";
import type { PatternInsight } from "@/types/wateringPatternTypes";
import type { UserPlant } from "@/data/types";

interface WateringHistoryDialogProps {
  plant: UserPlant | null;
  isOpen: boolean;
  onClose: () => void;
  onScheduleAdjustment?: (
    plantId: string,
    newSchedule: number
  ) => Promise<void>;
  onPlantDataChange?: () => void;
}

// Wrap the component with memo to prevent unnecessary re-renders
const WateringHistoryDialog = memo(
  ({
    plant,
    isOpen,
    onClose,
    onScheduleAdjustment,
    onPlantDataChange,
  }: WateringHistoryDialogProps) => {
    // Use the shared watering records hook for better state management
    const {
      records: wateringRecords,
      isLoading,
      loadWateringRecords,
      deleteWateringRecord,
    } = useWateringRecords(onPlantDataChange);

    // Pattern analysis integration - disable autoRefresh to prevent infinite loops
    const {
      analysis,
      insights,
      stats: patternStats,
      isLoading: isAnalyzing,
      refreshAnalysis,
    } = useWateringPatternAnalysis({
      plantId: plant?.id,
      autoRefresh: false, // Disable automatic refreshing to prevent flickering
    });

    // Track dismissed insights per plant (persists across dialog open/close)
    const [dismissedInsights, setDismissedInsights] = useState<
      Map<string, Set<string>>
    >(new Map());

    // Track which record is pending deletion for confirmation dialog
    const [recordToDelete, setRecordToDelete] = useState<WateringRecord | null>(
      null
    );

    // Get dismissed insight types for the current plant
    const currentPlantDismissals = useMemo(() => {
      if (!plant?.id) return new Set<string>();
      return dismissedInsights.get(plant.id) || new Set<string>();
    }, [plant?.id, dismissedInsights]);

    // Filter out dismissed insights
    const visibleInsights = useMemo(() => {
      return insights.filter(
        (insight) => !currentPlantDismissals.has(insight.type)
      );
    }, [insights, currentPlantDismissals]);

    // Load watering records when dialog opens or plant changes
    useEffect(() => {
      if (plant && isOpen) {
        loadWateringRecords(plant.id);
      }
    }, [isOpen, loadWateringRecords, plant]);

    // Manually refresh analysis when dialog opens or plant changes
    // This avoids the continuous refreshing loop caused by autoRefresh
    useEffect(() => {
      if (plant && isOpen) {
        refreshAnalysis();
      }
    }, [isOpen, plant, refreshAnalysis]);

    // Handle dismissing insights
    const handleDismissInsight = useCallback(
      (insight: PatternInsight) => {
        if (!plant?.id) return;

        setDismissedInsights((prev) => {
          const newMap = new Map(prev);
          const plantDismissals = new Set(newMap.get(plant.id) || []);
          plantDismissals.add(insight.type);
          newMap.set(plant.id, plantDismissals);
          return newMap;
        });
      },
      [plant?.id]
    );

    // Handle explicit refresh - clears dismissed insights for this plant
    const handleRefreshAnalysis = useCallback(() => {
      if (plant?.id) {
        // Clear dismissed insights for this plant
        setDismissedInsights((prev) => {
          const newMap = new Map(prev);
          newMap.delete(plant.id);
          return newMap;
        });
      }
      // Trigger the actual analysis refresh
      refreshAnalysis();
    }, [plant?.id, refreshAnalysis]);

    // Handle schedule adjustment from pattern suggestions
    const handleScheduleAdjustment = useCallback(
      async (insight: PatternInsight) => {
        if (!plant || !onScheduleAdjustment || !insight.suggestion) return;

        try {
          await onScheduleAdjustment(
            plant.id,
            insight.suggestion.suggestedSchedule
          );
          wateringToast.scheduled(plant.nickname);
          // Refresh analysis after schedule change (also clears dismissals)
          setTimeout(() => handleRefreshAnalysis(), 1000);
        } catch (error) {
          console.error("Error updating schedule:", error);
          wateringToast.error("schedule update");
        }
      },
      [plant, onScheduleAdjustment, handleRefreshAnalysis]
    );

    // Handle delete confirmation
    const handleConfirmDelete = useCallback(async () => {
      if (!recordToDelete) return;

      try {
        // Call deleteWateringRecord and wait for it to complete
        // The hook will call onPlantDataChange automatically for all deletions
        await deleteWateringRecord(recordToDelete.id);
      } catch (error) {
        console.error("Error deleting record:", error);
        // Only refresh on error
        if (plant) {
          setTimeout(() => loadWateringRecords(plant.id), 500);
        }
      } finally {
        setRecordToDelete(null);
      }
    }, [recordToDelete, deleteWateringRecord, plant, loadWateringRecords]);

    const formatDate = (dateString: string) => {
      try {
        return format(new Date(dateString), "PPP 'at' p");
      } catch {
        return "Invalid date";
      }
    };

    // Use useCallback to memoize the function itself
    const getWateringStats = useCallback(
      (records: WateringRecord[], suggestedWateringDays: number = 7) => {
        if (records.length === 0) return null;

        // Count only actual waterings (not postponements)
        const filteredRecords = records.filter(
          (record) => !record.is_postponement
        );
        const totalWaterings = filteredRecords.length;
        const suggestedDays = suggestedWateringDays;

        // Calculate average watering frequency
        if (totalWaterings > 1) {
          const dates = filteredRecords
            .map((record) => new Date(record.watered_at))
            .sort((a, b) => a.getTime() - b.getTime());
          const intervals = [];

          for (let i = 1; i < dates.length; i++) {
            const daysBetween = Math.ceil(
              (dates[i].getTime() - dates[i - 1].getTime()) /
                (1000 * 60 * 60 * 24)
            );
            intervals.push(daysBetween);
          }

          const avgInterval = Math.round(
            intervals.reduce((sum, interval) => sum + interval, 0) /
              intervals.length
          );

          return {
            totalWaterings,
            avgInterval,
            suggestedInterval: suggestedDays,
            isOnTrack: Math.abs(avgInterval - suggestedDays) <= 2,
          };
        }

        return {
          totalWaterings,
          avgInterval: null,
          suggestedInterval: suggestedDays,
          isOnTrack: null,
        };
      },
      []
    );

    // Memoize calculations to prevent unnecessary recalculations
    const { actualWaterings, stats, risk } = useMemo(() => {
      // Filter out postponements for risk calculation
      const filteredWaterings = wateringRecords.filter(
        (record) => !record.is_postponement
      );

      const calculatedStats = getWateringStats(
        wateringRecords,
        plant?.suggested_watering_days || 7
      );

      const calculatedRisk = computeOverwateringRisk({
        records: filteredWaterings.map((r) => ({
          watered_at: r.watered_at,
          notes: r.notes,
        })),
        suggestedDays: plant?.suggested_watering_days || 7,
      });

      return {
        actualWaterings: filteredWaterings,
        stats: calculatedStats,
        risk: calculatedRisk,
      };
    }, [wateringRecords, plant?.suggested_watering_days, getWateringStats]);

    if (!plant) return null;

    // Use key to force complete unmount/remount when plant changes
    return (
      <>
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent
            key={plant?.id}
            className="max-w-2xl max-h-[80vh] overflow-y-auto p-6 sm:p-8 z-50"
            onOpenAutoFocus={(e) => e.preventDefault()} // Prevent autofocus which might cause rerenders
          >
            <DialogHeader className="border-b border-sprout-cream/30 dark:border-sprout-cream/20 pb-4 mb-6">
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Droplets className="w-5 h-5 text-sprout-water" />
                Watering History for {plant.nickname}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-8">
              {/* Plant Overview */}
              <div className="bg-sprout-pale dark:bg-sprout-dark/20 rounded-lg p-6">
                <div className="flex items-center gap-6">
                  {plant.image && (
                    <img
                      src={plant.image}
                      alt={plant.nickname}
                      className="w-20 h-20 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-xl sm:text-lg">
                      {plant.nickname}
                    </h3>
                    <p className="text-muted-foreground text-base sm:text-sm">
                      {plant.plant_type}
                    </p>
                    <p className="text-sm sm:text-xs text-sprout-medium mt-1">
                      Suggested watering: Every{" "}
                      {plant.suggested_watering_days || 7} days
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              {stats && stats.totalWaterings > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-card rounded-lg p-6 border">
                    <div className="text-center">
                      <div className="text-3xl sm:text-2xl font-bold text-sprout-cream dark:text-sprout-cream">
                        {stats.totalWaterings}
                      </div>
                      <div className="text-sm sm:text-xs text-muted-foreground mt-1">
                        Total Waterings
                      </div>
                    </div>
                  </div>

                  {stats.avgInterval && (
                    <div className="bg-card rounded-lg p-6 border">
                      <div className="text-center">
                        <div className="text-3xl sm:text-2xl font-bold text-sprout-cream dark:text-sprout-cream">
                          {stats.avgInterval}
                        </div>
                        <div className="text-sm sm:text-xs text-muted-foreground mt-1">
                          Avg Days Between
                        </div>
                      </div>
                    </div>
                  )}

                  {risk.level !== "none" && (
                    <div
                      className={`rounded-lg p-6 border ${
                        risk.level === "high"
                          ? "bg-red-600/10 border-red-600/30"
                          : "bg-orange-500/10 border-orange-500/30"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2 text-base sm:text-sm">
                        <AlertTriangle
                          className={`w-5 h-5 sm:w-4 sm:h-4 ${
                            risk.level === "high"
                              ? "text-red-600"
                              : "text-orange-500"
                          }`}
                        />
                        <span className="font-medium">
                          {risk.level === "high"
                            ? "Possible overwatering"
                            : "Watch watering frequency"}
                        </span>
                      </div>
                      <p className="text-center text-sm sm:text-xs text-muted-foreground mt-2">
                        {risk.count} in last {risk.windowDays} days
                        {risk.avgIntervalDays
                          ? ` • avg ${risk.avgIntervalDays}d vs ${
                              plant?.suggested_watering_days || 7
                            }d`
                          : ""}
                      </p>
                    </div>
                  )}

                  {/* Only show schedule tracking when we have enough data (2+ waterings) */}
                  {stats.avgInterval && (
                    <div className="bg-card rounded-lg p-6 border">
                      <div className="text-center">
                        <div
                          className={`text-3xl sm:text-2xl font-bold ${
                            stats.isOnTrack
                              ? "text-sprout-cream dark:text-sprout-cream"
                              : stats.isOnTrack === false
                              ? "text-sprout-warning dark:text-sprout-warning"
                              : "text-sprout-cream dark:text-sprout-cream"
                          }`}
                        >
                          {stats.isOnTrack === true
                            ? "✓"
                            : stats.isOnTrack === false
                            ? "!"
                            : "?"}
                        </div>
                        <div className="text-sm sm:text-xs text-muted-foreground mt-1">
                          {stats.isOnTrack === true
                            ? "On Schedule"
                            : stats.isOnTrack === false
                            ? "Off Schedule"
                            : "Need More Data"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Watering Records */}
              <div>
                <h3 className="text-xl sm:text-lg font-semibold mb-6 flex items-center gap-2">
                  <Calendar className="w-6 h-6 sm:w-5 sm:h-5" />
                  Watering History & Postponements
                </h3>

                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-8 sm:w-8 border-b-2 border-sprout-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-4 text-base sm:text-sm">
                      Loading watering history...
                    </p>
                  </div>
                ) : wateringRecords.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-lg border border-dashed">
                    <Droplets className="w-16 h-16 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg sm:text-base">
                      No watering records found
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Start tracking by watering your plant!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {wateringRecords.map((record, index) => {
                      const isPostponement = record.is_postponement;
                      const isFutureDate = isFuture(
                        new Date(record.watered_at)
                      );
                      return (
                        <div key={record.id}>
                          <div
                            className={`flex items-start gap-6 p-6 rounded-lg border hover:shadow-sm transition-shadow
                          ${
                            isPostponement
                              ? isFutureDate
                                ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30"
                                : "bg-gray-50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-700/30"
                              : "bg-card"
                          }`}
                          >
                            <div className="flex-shrink-0">
                              <div
                                className={`w-12 h-12 sm:w-10 sm:h-10 rounded-full flex items-center justify-center
                            ${
                              isPostponement
                                ? "bg-amber-100 dark:bg-amber-900/30"
                                : "bg-sprout-water/20"
                            }`}
                              >
                                {isPostponement ? (
                                  <Clock className="w-6 h-6 sm:w-5 sm:h-5 text-amber-500 dark:text-amber-400" />
                                ) : (
                                  <Droplets className="w-6 h-6 sm:w-5 sm:h-5 text-sprout-water" />
                                )}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                                <p className="font-medium text-foreground text-lg sm:text-base">
                                  {isPostponement
                                    ? isFutureDate
                                      ? "Postponed Watering"
                                      : "Past Postponement"
                                    : "Watered"}
                                </p>
                                <div className="flex items-center">
                                  <span className="text-base sm:text-sm text-muted-foreground mt-1 sm:mt-0">
                                    {formatDate(record.watered_at)}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setRecordToDelete(record)}
                                    className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>

                              {record.notes && (
                                <div className="flex items-start gap-3 mt-3">
                                  <FileText className="w-5 h-5 sm:w-4 sm:h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <p className="text-base sm:text-sm text-muted-foreground">
                                    {isPostponement
                                      ? record.notes.replace(
                                          "POSTPONEMENT: ",
                                          ""
                                        )
                                      : record.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          {index < wateringRecords.length - 1 && (
                            <div className="border-b border-sprout-cream/10 dark:border-sprout-cream/5 mx-6" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pattern Analysis Section */}
              {analysis && (
                <>
                  <Separator className="my-6" />
                  <PatternAnalysisSection
                    analysis={analysis}
                    insights={visibleInsights}
                    stats={patternStats}
                    isLoading={isAnalyzing}
                    onAcceptSuggestion={handleScheduleAdjustment}
                    onDismissInsight={handleDismissInsight}
                    onRefreshAnalysis={handleRefreshAnalysis}
                  />
                </>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end pt-6 border-t border-sprout-cream/30 dark:border-sprout-cream/20">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="px-6 py-2 text-base sm:text-sm"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!recordToDelete}
          onOpenChange={(open) => !open && setRecordToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Watering Record</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this{" "}
                {recordToDelete?.is_postponement
                  ? "postponement"
                  : "watering record"}
                ? This action cannot be undone.
                {recordToDelete?.notes && !recordToDelete.is_postponement && (
                  <>
                    <br />
                    <br />
                    <span className="font-medium">Notes: </span>
                    {recordToDelete.notes}
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setRecordToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
);

export default WateringHistoryDialog;

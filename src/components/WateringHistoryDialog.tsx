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
  Pencil,
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
import EditWateringRecordDialog from "@/components/EditWateringRecordDialog";
import { plants as catalogPlants } from "@/data/plantData";
import { PLANT_FALLBACK_IMAGE } from "@/lib/constants";

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
      updateWateringRecord,
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

    // Track which record is being edited
    const [recordToEdit, setRecordToEdit] = useState<WateringRecord | null>(
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

    // Handle update record
    const handleUpdateRecord = useCallback(
      async (recordId: string, date: Date, notes?: string) => {
        return await updateWateringRecord(recordId, date, notes);
      },
      [updateWateringRecord]
    );

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

    const catalogPlant = catalogPlants.find(
      (p) =>
        p.name.toLowerCase() === plant.plant_type.toLowerCase() ||
        p.botanicalName.toLowerCase() === plant.plant_type.toLowerCase()
    );

    const plantImage =
      plant.image || catalogPlant?.image || PLANT_FALLBACK_IMAGE;

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
              <div className="bg-gradient-to-r from-sprout-pale to-sprout-pale/50 dark:from-sprout-dark/30 dark:to-sprout-dark/10 rounded-xl p-6 border border-sprout-cream/20 shadow-sm">
                <div className="flex items-center gap-6">
                  {plantImage && (
                    <img
                      src={plantImage}
                      alt={plant.nickname}
                      className="w-20 h-20 sm:w-16 sm:h-16 rounded-xl object-cover flex-shrink-0 shadow-md ring-2 ring-sprout-cream/20"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-xl sm:text-lg">
                      {plant.nickname}
                    </h3>
                    <p className="text-muted-foreground text-base sm:text-sm">
                      {plant.plant_type}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Droplets className="w-3.5 h-3.5 text-sprout-water" />
                      <p className="text-sm sm:text-xs text-sprout-medium">
                        Every {plant.suggested_watering_days || 7} days
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              {stats && stats.totalWaterings > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-sprout-water/10 to-sprout-water/5 rounded-xl p-6 border border-sprout-water/20 shadow-sm">
                    <div className="text-center">
                      <Droplets className="w-5 h-5 text-sprout-water mx-auto mb-2" />
                      <div className="text-3xl sm:text-2xl font-bold text-sprout-water">
                        {stats.totalWaterings}
                      </div>
                      <div className="text-sm sm:text-xs text-muted-foreground mt-1">
                        Total Waterings
                      </div>
                    </div>
                  </div>

                  {stats.avgInterval && (
                    <div className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 dark:from-violet-400/10 dark:to-violet-400/5 rounded-xl p-6 border border-violet-300/30 dark:border-violet-500/20 shadow-sm">
                      <div className="text-center">
                        <Calendar className="w-5 h-5 text-violet-500 dark:text-violet-400 mx-auto mb-2" />
                        <div className="text-3xl sm:text-2xl font-bold text-violet-600 dark:text-violet-400">
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
                    <div className={`rounded-xl p-6 border shadow-sm ${
                      stats.isOnTrack === true
                        ? "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-300/30 dark:border-emerald-500/20"
                        : stats.isOnTrack === false
                        ? "bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-300/30 dark:border-amber-500/20"
                        : "bg-gradient-to-br from-gray-500/10 to-gray-500/5 border-gray-300/30 dark:border-gray-500/20"
                    }`}>
                      <div className="text-center flex flex-col items-center justify-center h-full">
                        <div
                          className={`w-10 h-10 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mb-2 ${
                            stats.isOnTrack === true
                              ? "bg-emerald-500/20"
                              : stats.isOnTrack === false
                              ? "bg-amber-500/20"
                              : "bg-gray-500/20"
                          }`}
                        >
                          <span className={`text-xl sm:text-lg font-bold ${
                            stats.isOnTrack === true
                              ? "text-emerald-600 dark:text-emerald-400"
                              : stats.isOnTrack === false
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                          }`}>
                            {stats.isOnTrack === true
                              ? "✓"
                              : stats.isOnTrack === false
                              ? "!"
                              : "?"}
                          </span>
                        </div>
                        <div className="text-base sm:text-sm font-semibold mt-1">
                          {stats.isOnTrack === true
                            ? "On Schedule"
                            : stats.isOnTrack === false
                            ? "Off Schedule"
                            : "Need More Data"}
                        </div>
                        <div className="text-sm sm:text-xs text-muted-foreground mt-1">
                          {stats.avgInterval}d avg / {stats.suggestedInterval}d suggested
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Watering Records */}
              <div>
                <h3 className="text-xl sm:text-lg font-semibold mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sprout-water/20 to-sprout-water/40 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-sprout-water" />
                  </div>
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
                  <div className="text-center py-12 bg-gradient-to-b from-sprout-water/5 to-transparent rounded-xl border border-dashed border-sprout-water/20">
                    <div className="w-16 h-16 sm:w-12 sm:h-12 rounded-full bg-sprout-water/10 flex items-center justify-center mx-auto mb-4">
                      <Droplets className="w-8 h-8 sm:w-6 sm:h-6 text-sprout-water/50" />
                    </div>
                    <p className="text-muted-foreground text-lg sm:text-base font-medium">
                      No watering records yet
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
                            className={`flex items-start gap-6 p-6 rounded-xl border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200
                          ${
                            isPostponement
                              ? isFutureDate
                                ? "bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/10 border-amber-300 dark:border-amber-700/40"
                                : "bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/30 dark:to-gray-700/10 border-gray-300 dark:border-gray-600/30"
                              : "bg-gradient-to-r from-sky-50/50 to-card dark:from-sky-950/20 dark:to-card border-sprout-water/30"
                          }`}
                          >
                            <div className="flex-shrink-0">
                              <div
                                className={`w-12 h-12 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-sm
                            ${
                              isPostponement
                                ? "bg-gradient-to-br from-amber-200 to-amber-300 dark:from-amber-800/50 dark:to-amber-900/30"
                                : "bg-gradient-to-br from-sprout-water/30 to-sprout-water/50"
                            }`}
                              >
                                {isPostponement ? (
                                  <Clock className="w-6 h-6 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
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
                                <div className="flex items-center gap-1">
                                  <span className="text-base sm:text-sm text-muted-foreground mt-1 sm:mt-0">
                                    {formatDate(record.watered_at)}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setRecordToEdit(record)}
                                    className="text-muted-foreground hover:text-sprout-water hover:bg-sprout-water/10 ml-2 flex-shrink-0 rounded-lg transition-colors"
                                    title="Edit record"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setRecordToDelete(record)}
                                    className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 flex-shrink-0 rounded-lg transition-colors"
                                    title="Delete record"
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

        {/* Edit Watering Record Dialog */}
        <EditWateringRecordDialog
          isOpen={!!recordToEdit}
          onClose={() => setRecordToEdit(null)}
          record={recordToEdit}
          onUpdate={handleUpdateRecord}
        />

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

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Droplets,
  AlertTriangle,
  Trash2,
  Clock,
  Pencil,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PlantImage from "@/components/ui/plant-image";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SheetGrabber,
  dialogSheetClasses,
  sheetHeaderClasses,
  sheetIconButtonClasses,
  sheetTitleClasses,
} from "@/components/ui/bento-sheet";
import {
  confirmCancelClasses,
  confirmDestructiveClasses,
  confirmDialogClasses,
  confirmIconClasses,
  confirmTitleClasses,
} from "@/components/settings/SettingsUI";
import { computeOverwateringRisk } from "@/utils/plants/overwatering";
import { stripNotesPrefixes } from "@/utils/watering/notesPrefixes";
import { wateringToast } from "@/utils/notifications/toast";
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
        return format(new Date(dateString), "MMM d, yyyy · p");
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
    const { stats, risk } = useMemo(() => {
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

    const schedule = plant.suggested_watering_days || 7;

    // Use key to force complete unmount/remount when plant changes
    return (
      <>
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent
            key={plant?.id}
            className={cn(dialogSheetClasses, "sm:max-w-2xl")}
            onOpenAutoFocus={(e) => e.preventDefault()} // Prevent autofocus which might cause rerenders
          >
            <SheetGrabber />
            <DialogHeader className={sheetHeaderClasses}>
              <div className="w-[52px] h-[52px] shrink-0 rounded-[18px] overflow-hidden bg-field">
                <PlantImage src={plantImage} alt="" className="w-full h-full" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className={sheetTitleClasses}>Watering history</DialogTitle>
                <DialogDescription className="text-sm font-medium truncate">
                  {plant.nickname} · every {schedule} {schedule === 1 ? "day" : "days"}
                </DialogDescription>
              </div>
              <button type="button" onClick={onClose} className={cn(sheetIconButtonClasses, "self-start")} aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </DialogHeader>

            <div className="mt-4 space-y-2">
              {/* Statistics */}
              {stats && stats.totalWaterings > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <StatTile className="bg-sprout-water text-sprout-dark" label="Waterings" value={stats.totalWaterings} />
                  {stats.avgInterval !== null && (
                    <StatTile className="bg-sprout-cream text-sprout-dark" label="Avg gap" value={`${stats.avgInterval}d`} />
                  )}
                  {stats.avgInterval !== null && (
                    <StatTile
                      className={cn(
                        "col-span-2 sm:col-span-1",
                        stats.isOnTrack ? "bg-sprout-success text-sprout-dark" : "bg-card text-foreground"
                      )}
                      label={stats.isOnTrack ? "On schedule" : "Off schedule"}
                      value={`${stats.avgInterval}d vs ${stats.suggestedInterval}d`}
                    />
                  )}
                </div>
              )}

              {risk.level !== "none" && (
                <div
                  className={cn(
                    "flex items-start gap-2.5 rounded-3xl p-4 text-sprout-dark",
                    risk.level === "high" ? "bg-sprout-warning" : "bg-sprout-cream"
                  )}
                >
                  <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-bold">
                      {risk.level === "high" ? "Possible overwatering" : "Watch watering frequency"}
                    </p>
                    <p className="font-medium">
                      {risk.count} in the last {risk.windowDays} days
                      {risk.avgIntervalDays ? ` · avg ${risk.avgIntervalDays}d vs ${schedule}d` : ""}
                    </p>
                  </div>
                </div>
              )}

              {/* Watering records */}
              <h3 className="text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground px-1.5 pt-2">
                Waterings &amp; postponements
              </h3>

              {isLoading ? (
                <div className="space-y-2" aria-busy="true" aria-label="Loading watering history">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-[72px] w-full rounded-[22px]" />
                  ))}
                </div>
              ) : wateringRecords.length === 0 ? (
                <div className="rounded-3xl bg-card p-5 flex items-center gap-3.5">
                  <div className="w-11 h-11 shrink-0 rounded-[14px] bg-sprout-water text-sprout-dark flex items-center justify-center">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-foreground">No watering records yet</p>
                    <p className="text-sm text-muted-foreground">Start tracking by watering your plant!</p>
                  </div>
                </div>
              ) : (
                <ul className="space-y-2">
                  {wateringRecords.map((record) => {
                    const isPostponement = record.is_postponement;
                    const isFutureDate = isFuture(new Date(record.watered_at));
                    const notes = stripNotesPrefixes(record.notes);
                    return (
                      <li key={record.id} className="flex items-start gap-3 p-2.5 rounded-[22px] bg-card">
                        <div
                          className={cn(
                            "w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center",
                            !isPostponement
                              ? "bg-sprout-water text-sprout-dark"
                              : isFutureDate
                                ? "bg-sprout-cream text-sprout-dark"
                                : "bg-field text-muted-foreground"
                          )}
                        >
                          {isPostponement ? <Clock className="w-5 h-5" /> : <Droplets className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-[15px] font-bold text-foreground">
                            {isPostponement
                              ? isFutureDate
                                ? "Postponed watering"
                                : "Past postponement"
                              : "Watered"}
                          </p>
                          <p className="text-[13px] text-muted-foreground">{formatDate(record.watered_at)}</p>
                          {notes && <p className="text-sm text-foreground mt-1.5 leading-snug">{notes}</p>}
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setRecordToEdit(record)}
                            className="w-10 h-10 rounded-xl bg-field text-foreground flex items-center justify-center hover:bg-sprout-water hover:text-sprout-dark transition-colors"
                            aria-label="Edit record"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRecordToDelete(record)}
                            className="w-10 h-10 rounded-xl bg-field text-foreground flex items-center justify-center hover:bg-sprout-warning hover:text-sprout-dark transition-colors"
                            aria-label="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Pattern Analysis Section */}
              {analysis && (
                <PatternAnalysisSection
                  className="pt-4"
                  analysis={analysis}
                  insights={visibleInsights}
                  stats={patternStats}
                  isLoading={isAnalyzing}
                  onAcceptSuggestion={handleScheduleAdjustment}
                  onDismissInsight={handleDismissInsight}
                  onRefreshAnalysis={handleRefreshAnalysis}
                />
              )}
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
          <AlertDialogContent className={confirmDialogClasses}>
            <AlertDialogHeader className="text-left">
              <div className="flex items-center gap-3 mb-1">
                <div className={cn(confirmIconClasses, "bg-sprout-warning text-sprout-dark")}>
                  <Trash2 className="w-6 h-6" />
                </div>
                <AlertDialogTitle className={confirmTitleClasses}>
                  Delete {recordToDelete?.is_postponement ? "postponement" : "watering"}?
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-[15px]">
                {recordToDelete && `${formatDate(recordToDelete.watered_at)}. `}
                This can't be undone.
                {recordToDelete?.notes && !recordToDelete.is_postponement && stripNotesPrefixes(recordToDelete.notes) && (
                  <span className="block mt-2">
                    <span className="font-bold text-foreground">Notes: </span>
                    {stripNotesPrefixes(recordToDelete.notes)}
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setRecordToDelete(null)} className={confirmCancelClasses}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className={confirmDestructiveClasses}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
);

function StatTile({ className, label, value }: { className: string; label: string; value: React.ReactNode }) {
  return (
    <div className={cn("rounded-[22px] p-3.5", className)}>
      <div className="text-xs font-bold uppercase tracking-[0.8px]">{label}</div>
      <div className="font-display text-lg font-bold mt-1">{value}</div>
    </div>
  );
}

export default WateringHistoryDialog;

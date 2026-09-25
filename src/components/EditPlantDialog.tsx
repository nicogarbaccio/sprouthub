import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import PlantImage from "@/components/ui/plant-image";
import { getPlantImageUrl } from "@/utils/plants/images";
import { PLANT_FALLBACK_IMAGE } from "@/lib/constants";
import {
  SheetGrabber,
  dialogSheetClasses,
  sheetHeaderClasses,
  sheetIconButtonClasses,
  sheetPrimaryButtonClasses,
  sheetSecondaryButtonClasses,
  sheetTitleClasses,
} from "@/components/ui/bento-sheet";
import {
  confirmCancelClasses,
  confirmDestructiveClasses,
  confirmDialogClasses,
  confirmIconClasses,
  confirmTitleClasses,
  pillTabsListClasses,
} from "@/components/settings/SettingsUI";
import { supabase } from "@/integrations/supabase/client";
import { plantToast, wateringToast, utilityToast } from "@/utils/notifications/toast";
import { NO_ROOM_VALUE } from "@/utils/rooms";
import { isPostponementRecord } from "@/utils/watering/notesPrefixes";
import PlantDetailsForm from "./edit-plant/PlantDetailsForm";
import WateringRecordForm from "./edit-plant/WateringRecordForm";
import WateringRecordsList from "./edit-plant/WateringRecordsList";
import { ScheduleHistoryCard } from "./ScheduleHistoryCard";
import EditWateringRecordDialog from "./EditWateringRecordDialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useHouseholds } from "@/hooks/useHouseholds";
import { useAuth } from "@/contexts/AuthContext";
import type { UserPlant } from "@/data/types";

import type { WateringRecord as HookWateringRecord } from "@/hooks/useWateringRecords";

interface WateringRecord extends HookWateringRecord {}

interface EditPlantDialogProps {
  plant: UserPlant | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const EditPlantDialog = ({
  plant,
  isOpen,
  onClose,
  onUpdate,
}: EditPlantDialogProps) => {
  // Using enhanced toast helpers for better UX
  const { user } = useAuth();
  const [nickname, setNickname] = useState("");
  const [plantType, setPlantType] = useState("");
  const [image, setImage] = useState("");
  const [room, setRoom] = useState("");
  const [suggestedWateringDays, setSuggestedWateringDays] = useState<number>(7);
  const [isOutdoorPlant, setIsOutdoorPlant] = useState(false);
  const [householdId, setHouseholdId] = useState("");
  const [alternativeNames, setAlternativeNames] = useState<string[]>([]);
  const [wateringRecords, setWateringRecords] = useState<WateringRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteLoadingRecords, setDeleteLoadingRecords] = useState<Set<string>>(
    new Set()
  );
  const [recordToEdit, setRecordToEdit] = useState<WateringRecord | null>(null);

  // Fetch households for assignment
  const { households } = useHouseholds();

  // Store original values to track changes
  const [originalValues, setOriginalValues] = useState({
    nickname: "",
    plantType: "",
    image: "",
    room: "",
    suggestedWateringDays: 7,
    isOutdoorPlant: false,
    householdId: "",
    alternativeNames: [] as string[],
  });

  useEffect(() => {
    if (plant) {
      const initialNickname = plant.nickname;
      const initialPlantType = plant.plant_type;
      const initialImage = plant.image || "";
      const initialRoom = plant.room || NO_ROOM_VALUE;
      const initialWateringDays = plant.suggested_watering_days || 7;
      const initialIsOutdoorPlant = plant.is_outdoor_plant || false;
      const initialHouseholdId = plant.household_id || "";
      const initialAlternativeNames = plant.alternative_names || [];

      // Set current values
      setNickname(initialNickname);
      setPlantType(initialPlantType);
      setImage(initialImage);
      setRoom(initialRoom);
      setSuggestedWateringDays(initialWateringDays);
      setIsOutdoorPlant(initialIsOutdoorPlant);
      setHouseholdId(initialHouseholdId);
      setAlternativeNames(initialAlternativeNames);

      // Store original values for comparison
      setOriginalValues({
        nickname: initialNickname,
        plantType: initialPlantType,
        image: initialImage,
        room: initialRoom,
        suggestedWateringDays: initialWateringDays,
        isOutdoorPlant: initialIsOutdoorPlant,
        householdId: initialHouseholdId,
        alternativeNames: initialAlternativeNames,
      });

      loadWateringRecords(plant.id);
    }
  }, [plant]);

  // Function to check if any changes have been made
  const hasChanges = () => {
    if (!plant) return false;

    return (
      nickname !== originalValues.nickname ||
      plantType !== originalValues.plantType ||
      image !== originalValues.image ||
      room !== originalValues.room ||
      suggestedWateringDays !== originalValues.suggestedWateringDays ||
      isOutdoorPlant !== originalValues.isOutdoorPlant ||
      householdId !== originalValues.householdId ||
      JSON.stringify(alternativeNames) !==
        JSON.stringify(originalValues.alternativeNames)
    );
  };

  const loadWateringRecords = async (plantId: string) => {
    try {
      const { data, error } = await supabase
        .from("watering_records")
        .select("*")
        .eq("plant_id", plantId)
        .order("watered_at", { ascending: false });

      if (error) throw error;

      // Add is_postponement flag for UI differentiation. Uses the shared classifier so
      // record_type is authoritative — an inline notes-substring check here would silently
      // stop recognising postponements once the legacy marker is retired from writes.
      const processedRecords = (data || []).map((record) => ({
        ...record,
        is_postponement: isPostponementRecord(record),
      }));

      setWateringRecords(processedRecords);
    } catch (error) {
      console.error("Error loading watering records:", error);
      wateringToast.error("loading");
    }
  };

  const handleSave = async () => {
    if (!plant) return;

    setIsLoading(true);

    const roomToSave = !room || room === NO_ROOM_VALUE ? null : room;

    try {
      const updateData = {
        nickname,
        plant_type: plantType,
        image: image || null,
        room: roomToSave,
        suggested_watering_days: suggestedWateringDays,
        is_outdoor_plant: isOutdoorPlant,
        household_id: householdId || null,
        alternative_names: alternativeNames,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("user_plants")
        .update(updateData)
        .eq("id", plant.id)
        .select();

      if (error) throw error;

      plantToast.updated(nickname || plantType);
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating plant:", error);
      plantToast.error("update");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWatering = async (date: Date, notes: string) => {
    if (!plant) return;

    try {
      const { error } = await supabase.from("watering_records").insert({
        plant_id: plant.id,
        watered_at: date.toISOString(),
        notes: notes || null,
        performed_by: user?.id || null, // Track who performed the watering
      });

      if (error) throw error;

      // Await the data refresh before showing success
      await loadWateringRecords(plant.id);

      // Only show success toast after UI has been updated
      wateringToast.recorded(nickname || plantType);
    } catch (error) {
      console.error("Error adding watering record:", error);
      wateringToast.error("add");

      // If addition failed, still try to refresh to ensure UI consistency
      if (plant) {
        try {
          await loadWateringRecords(plant.id);
        } catch (refreshError) {
          console.error(
            "Error refreshing after failed addition:",
            refreshError
          );
        }
      }
    }
  };

  const handleEditWatering = async (
    recordId: string,
    date: Date,
    notes?: string
  ) => {
    if (!plant) return false;

    try {
      const { error } = await supabase
        .from("watering_records")
        .update({
          watered_at: date.toISOString(),
          notes: notes || null,
        })
        .eq("id", recordId);

      if (error) throw error;

      // Refresh records to show the updated one
      await loadWateringRecords(plant.id);

      // Show success toast
      wateringToast.updated();

      // Notify parent to refresh plant data
      onUpdate();

      return true;
    } catch (error) {
      console.error("Error updating watering record:", error);
      wateringToast.error("update");
      return false;
    }
  };

  const handleDeleteWatering = async (recordId: string) => {
    if (!plant || deleteLoadingRecords.has(recordId)) return;

    // Add to loading set to prevent multiple simultaneous deletions
    setDeleteLoadingRecords((prev) => new Set(prev).add(recordId));

    try {
      // Get record before deletion for checking if it's a postponement
      const recordToDelete = wateringRecords.find(
        (record): record is WateringRecord => record.id === recordId
      );
      if (!recordToDelete) throw new Error("Record not found");

      const isPostponement =
        (recordToDelete as WateringRecord).is_postponement ||
        recordToDelete.notes?.includes("POSTPONEMENT:");

      // Optimistic UI update - remove the record from the local state immediately
      setWateringRecords((currentRecords) =>
        currentRecords.filter((record) => record.id !== recordId)
      );

      // For postponements, delete ALL future postponement records for this plant
      // This ensures that when a user deletes a postponement, the plant is no longer considered postponed
      if (isPostponement) {
        const { error: deleteAllError } = await supabase
          .from("watering_records")
          .delete()
          .eq("plant_id", plant.id)
          .like("notes", "%POSTPONEMENT:%")
          .gt("watered_at", new Date().toISOString());

        if (deleteAllError) throw deleteAllError;
      } else {
        // For regular watering records, delete only the specific record
        const { error } = await supabase
          .from("watering_records")
          .delete()
          .eq("id", recordId);

        if (error) throw error;
      }

      // Show success toast after database operation is successful
      if (isPostponement) {
        // Use the utility toast for postponements since wateringToast doesn't have a success method
        utilityToast.deleted("Postponement");
      } else {
        wateringToast.deleted();
      }

      // Don't refresh from server - trust our optimistic update
      // This avoids race conditions where the server response hasn't fully processed the deletion yet
    } catch (error) {
      console.error("Error deleting watering record:", error);
      wateringToast.error("delete");

      // On error, restore data from server to ensure consistency
      if (plant) {
        try {
          await loadWateringRecords(plant.id);
        } catch (refreshError) {
          console.error(
            "Error refreshing after failed deletion:",
            refreshError
          );
        }
      }
    } finally {
      // Remove from loading set
      setDeleteLoadingRecords((prev) => {
        const newSet = new Set(prev);
        newSet.delete(recordId);
        return newSet;
      });
    }
  };

  const handleDeletePlant = async () => {
    if (!plant) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("user_plants")
        .delete()
        .eq("id", plant.id);
      if (error) throw error;
      plantToast.deleted(nickname || plantType);
      setIsDeleteDialogOpen(false);
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error deleting plant:", error);
      plantToast.error("delete");
    } finally {
      setIsDeleting(false);
    }
  };

  const tabs = [
    { value: "details", label: "Details", testId: "details-tab" },
    { value: "watering", label: "Waterings", testId: "watering-history-tab" },
    { value: "schedule", label: "Schedule", testId: "schedule-history-tab" },
    { value: "settings", label: "Settings", testId: "settings-tab" },
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent data-testid="edit-plant-dialog" className={cn(dialogSheetClasses, "sm:max-w-2xl")}>
          <SheetGrabber />
          <DialogHeader className={sheetHeaderClasses}>
            <div className="w-[52px] h-[52px] shrink-0 rounded-[18px] overflow-hidden bg-field">
              {plant && (
                <PlantImage
                  src={getPlantImageUrl(image || plant.image, plant.plant_type, PLANT_FALLBACK_IMAGE)}
                  alt=""
                  className="w-full h-full"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle data-testid="edit-plant-dialog-title" className={sheetTitleClasses}>
                Edit plant
              </DialogTitle>
              <DialogDescription className="text-sm font-medium truncate">
                {plant?.nickname}
              </DialogDescription>
            </div>
            <button type="button" onClick={onClose} className={cn(sheetIconButtonClasses, "self-start")} aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </DialogHeader>

          <Tabs defaultValue="details" className="mt-4">
            <TabsList data-testid="edit-plant-tabs" className={cn(pillTabsListClasses, "-mx-4 px-4 sm:mx-0 sm:px-0")}>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} data-testid={tab.testId} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <PlantDetailsForm
                nickname={nickname}
                setNickname={setNickname}
                plantType={plantType}
                setPlantType={setPlantType}
                image={image}
                setImage={setImage}
                room={room}
                setRoom={setRoom}
                suggestedWateringDays={suggestedWateringDays}
                setSuggestedWateringDays={setSuggestedWateringDays}
                isOutdoorPlant={isOutdoorPlant}
                setIsOutdoorPlant={setIsOutdoorPlant}
                householdId={householdId}
                setHouseholdId={setHouseholdId}
                households={households}
                alternativeNames={alternativeNames}
                setAlternativeNames={setAlternativeNames}
              />

              <div className="flex gap-2 mt-4">
                <button
                  data-testid="cancel-edit-button"
                  type="button"
                  onClick={onClose}
                  className={cn(sheetSecondaryButtonClasses, "flex-1")}
                >
                  Cancel
                </button>
                <button
                  data-testid="save-plant-button"
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading || !hasChanges()}
                  className={cn(sheetPrimaryButtonClasses, "flex-[1.3]")}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </TabsContent>

            <TabsContent data-testid="watering-history-content" value="watering" className="mt-4 space-y-2">
              <WateringRecordForm onAddWatering={handleAddWatering} />
              <h3 className="text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground px-1.5 pt-2">
                Watering history
              </h3>
              <WateringRecordsList
                records={wateringRecords}
                onDeleteRecord={handleDeleteWatering}
                onEditRecord={(record) => setRecordToEdit(record)}
                deleteLoadingRecords={deleteLoadingRecords}
              />
            </TabsContent>

            <TabsContent value="schedule" className="mt-4">
              {plant && (
                <ScheduleHistoryCard
                  plantId={plant.id}
                  plantName={plant.nickname}
                  currentSchedule={plant.suggested_watering_days}
                />
              )}
            </TabsContent>

            <TabsContent data-testid="settings-content" value="settings" className="mt-4">
              {/* Danger Zone for Delete Plant */}
              <div data-testid="danger-zone" className="rounded-3xl bg-card p-5">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 shrink-0 rounded-[14px] bg-sprout-warning text-sprout-dark flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-display text-lg font-bold tracking-[-0.02em] text-foreground">Danger Zone</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
                      Deleting this plant removes it and all its watering records from your collection. This can't be
                      undone.
                    </p>
                  </div>
                </div>
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <button
                      data-testid="delete-plant-trigger-button"
                      type="button"
                      className="mt-4 w-full h-12 rounded-[18px] bg-sprout-warning text-sprout-dark font-bold text-[15px] inline-flex items-center justify-center gap-2 hover:bg-sprout-warning/90 disabled:opacity-50"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      disabled={isLoading || isDeleting}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Plant
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent data-testid="delete-plant-confirmation-dialog" className={confirmDialogClasses}>
                    <AlertDialogHeader className="text-left">
                      <div className="flex items-center gap-3 mb-1">
                        <div className={cn(confirmIconClasses, "bg-sprout-warning text-sprout-dark")}>
                          <Trash2 className="w-6 h-6" />
                        </div>
                        <AlertDialogTitle data-testid="delete-plant-confirmation-title" className={confirmTitleClasses}>
                          Delete Plant
                        </AlertDialogTitle>
                      </div>
                      <AlertDialogDescription className="text-[15px]">
                        Are you sure you want to delete {plant?.nickname ? `"${plant.nickname}"` : "this plant"}? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        data-testid="delete-plant-cancel-button"
                        disabled={isDeleting}
                        className={confirmCancelClasses}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        data-testid="delete-plant-confirm-button"
                        className={confirmDestructiveClasses}
                        onClick={handleDeletePlant}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Watering Record Dialog */}
      <EditWateringRecordDialog
        isOpen={!!recordToEdit}
        onClose={() => setRecordToEdit(null)}
        record={recordToEdit}
        onUpdate={handleEditWatering}
      />
    </>
  );
};

export default EditPlantDialog;

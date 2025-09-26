import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { plantToast, wateringToast, utilityToast } from "@/utils/toast-helpers";
import { NO_ROOM_VALUE } from "@/utils/rooms";
import PlantDetailsForm from "./edit-plant/PlantDetailsForm";
import WateringRecordForm from "./edit-plant/WateringRecordForm";
import WateringRecordsList from "./edit-plant/WateringRecordsList";
import { ScheduleHistoryCard } from "./ScheduleHistoryCard";
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

interface WateringRecord {
  id: string;
  watered_at: string;
  notes?: string;
}

interface Plant {
  id: string;
  nickname: string;
  plant_type: string;
  image?: string;
  room?: string;
  suggested_watering_days?: number;
  is_outdoor_plant?: boolean;
  household_id?: string;
}

interface EditPlantDialogProps {
  plant: Plant | null;
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
  const [wateringRecords, setWateringRecords] = useState<WateringRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteLoadingRecords, setDeleteLoadingRecords] = useState<Set<string>>(
    new Set()
  );

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

      // Set current values
      setNickname(initialNickname);
      setPlantType(initialPlantType);
      setImage(initialImage);
      setRoom(initialRoom);
      setSuggestedWateringDays(initialWateringDays);
      setIsOutdoorPlant(initialIsOutdoorPlant);
      setHouseholdId(initialHouseholdId);

      // Store original values for comparison
      setOriginalValues({
        nickname: initialNickname,
        plantType: initialPlantType,
        image: initialImage,
        room: initialRoom,
        suggestedWateringDays: initialWateringDays,
        isOutdoorPlant: initialIsOutdoorPlant,
        householdId: initialHouseholdId,
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
      householdId !== originalValues.householdId
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
      
      // Add is_postponement flag for UI differentiation
      const processedRecords = (data || []).map(record => ({
        ...record,
        is_postponement: record.notes?.includes('POSTPONEMENT:') || false
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
        updated_at: new Date().toISOString(),
      };

      const { data: updatedData, error } = await supabase
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

  const handleDeleteWatering = async (recordId: string) => {
    if (!plant || deleteLoadingRecords.has(recordId)) return;

    // Add to loading set to prevent multiple simultaneous deletions
    setDeleteLoadingRecords((prev) => new Set(prev).add(recordId));

    try {
      // Get record before deletion for checking if it's a postponement
      const recordToDelete = wateringRecords.find(r => r.id === recordId);
      if (!recordToDelete) throw new Error('Record not found');
      
      const isPostponement = recordToDelete.is_postponement || recordToDelete.notes?.includes('POSTPONEMENT:');
      
      // Optimistic UI update - remove the record from the local state immediately
      setWateringRecords((currentRecords) =>
        currentRecords.filter((record) => record.id !== recordId)
      );

      // Delete from database - use await to ensure completion
      const { error, count } = await supabase
        .from("watering_records")
        .delete()
        .eq("id", recordId)
        .select('count');  // Get count of deleted records

      if (error) throw error;
      
      // Verify record was actually deleted
      if (!count || count === 0) {
        throw new Error('Record not deleted from database');
      }

      // Show success toast after database operation is successful
      if (isPostponement) {
        wateringToast.success('Postponement deleted successfully');
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="border-b border-sprout-cream/30 dark:border-sprout-cream/20 pb-4 mb-6">
          <DialogTitle>Edit Plant Details</DialogTitle>
          <DialogDescription>
            Update your plant's information, care schedule, and watering
            history.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Plant Details</TabsTrigger>
            <TabsTrigger value="watering">Watering History</TabsTrigger>
            <TabsTrigger value="schedule">Schedule History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
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
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading || !hasChanges()}
                className={`${
                  hasChanges()
                    ? "bg-sprout-primary hover:bg-sprout-primary/90 text-white dark:bg-sprout-medium dark:hover:bg-sprout-medium/90"
                    : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="watering" className="space-y-4">
            <h3 className="text-lg font-semibold">Watering History</h3>
            <WateringRecordForm onAddWatering={handleAddWatering} />
            <WateringRecordsList
              records={wateringRecords}
              onDeleteRecord={handleDeleteWatering}
              deleteLoadingRecords={deleteLoadingRecords}
            />
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            {plant && (
              <ScheduleHistoryCard
                plantId={plant.id}
                plantName={plant.nickname}
                currentSchedule={plant.suggested_watering_days}
              />
            )}
          </TabsContent>
          <TabsContent value="settings" className="space-y-4">
            {/* Danger Zone for Delete Plant */}
            <div className="border border-red-200 bg-red-50 rounded-lg p-6 flex flex-col items-center">
              <h4 className="text-red-700 font-semibold mb-2">Danger Zone</h4>
              <p className="text-sm text-red-600 mb-4 text-center">
                Deleting this plant will remove it and all its watering records
                from your collection. This action cannot be undone.
              </p>
              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    className="bg-sprout-error hover:bg-sprout-error/90 text-sprout-white"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isLoading || isDeleting}
                  >
                    Delete Plant
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Plant</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this plant? This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-sprout-error hover:bg-sprout-error/90 text-white"
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
  );
};

export default EditPlantDialog;

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserPlants } from "@/hooks/useUserPlants";
import { useHouseholds } from "@/hooks/useHouseholds";
import ImageUpload from "@/components/ui/image-upload";
import { NO_ROOM_VALUE } from "@/utils/rooms";
import { SmartWateringWizard } from "@/components/SmartWateringWizard";
import {
  PlantTypeSelector,
  findPlantInCatalog,
  HouseholdSelector,
  RoomSelector,
  LastWateredPicker,
  WateringScheduleSection,
  PlantNotesAndOptions,
  FormActions,
} from "@/components/add-plant";
import type { PlantData, AddPlantFormData } from "@/components/add-plant";

interface AddPlantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plantData?: PlantData | null;
  onPlantAdded?: () => void | Promise<void>;
  defaultHouseholdId?: string;
}

const PRESET_WATERING_OPTIONS = [3, 7, 10, 14, 21, 30];

const AddPlantDialog = ({
  isOpen,
  onClose,
  plantData,
  onPlantAdded,
  defaultHouseholdId,
}: AddPlantDialogProps) => {
  const { addPlant } = useUserPlants();
  const { households } = useHouseholds();
  const [formData, setFormData] = useState<AddPlantFormData>({
    nickname: "",
    plant_type: "",
    image: "",
    room: NO_ROOM_VALUE,
    watering_schedule_days: 7,
    notes: "",
    is_outdoor_plant: false,
    household_id: "",
    alternative_names: [],
  });
  const [lastWateredDate, setLastWateredDate] = useState<Date | undefined>(
    new Date()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customDays, setCustomDays] = useState<string>("");
  const [isCustomSelected, setIsCustomSelected] = useState(false);
  const [isCustomPlantType, setIsCustomPlantType] = useState(false);
  const [customPlantType, setCustomPlantType] = useState("");
  const [isCustomRoom, setIsCustomRoom] = useState(false);
  const [customRoom, setCustomRoom] = useState("");
  const [isSmartWizardOpen, setIsSmartWizardOpen] = useState(false);

  // Reset form when dialog opens/closes or plant data changes
  useEffect(() => {
    if (isOpen) {
      if (plantData) {
        setFormData({
          nickname: plantData.name,
          plant_type: plantData.name,
          image: plantData.image,
          room: NO_ROOM_VALUE,
          watering_schedule_days: plantData.suggestedWateringDays || 7,
          notes: `Botanical name: ${plantData.botanicalName}\nWatering: ${plantData.wateringFrequency}\nLight: ${plantData.lightRequirement}\nCare level: ${plantData.careLevel}`,
          is_outdoor_plant: false,
          household_id: defaultHouseholdId || "",
          alternative_names: plantData.otherNames || [],
        });
        setIsCustomPlantType(false);
        setCustomPlantType("");
        const suggestedDays = plantData.suggestedWateringDays || 7;
        if (!PRESET_WATERING_OPTIONS.includes(suggestedDays)) {
          setIsCustomSelected(true);
          setCustomDays(suggestedDays.toString());
        } else {
          setIsCustomSelected(false);
          setCustomDays("");
        }
      } else {
        setFormData({
          nickname: "",
          plant_type: "",
          image: "",
          room: NO_ROOM_VALUE,
          watering_schedule_days: 7,
          notes: "",
          is_outdoor_plant: false,
          household_id: defaultHouseholdId || "",
          alternative_names: [],
        });
        setIsCustomPlantType(false);
        setCustomPlantType("");
        setIsCustomSelected(false);
        setCustomDays("");
        setIsCustomRoom(false);
        setCustomRoom("");
      }
      setLastWateredDate(new Date());
    }
  }, [isOpen, plantData, defaultHouseholdId]);

  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nickname.trim() || !formData.plant_type.trim()) return;

    setIsSubmitting(true);
    const roomValue =
      formData.room === NO_ROOM_VALUE
        ? undefined
        : formData.room.trim() || undefined;

    const success = await addPlant({
      nickname: formData.nickname.trim(),
      plant_type: formData.plant_type.trim(),
      image: formData.image.trim() || undefined,
      room: roomValue,
      suggested_watering_days: formData.watering_schedule_days,
      last_watered_date: lastWateredDate?.toISOString(),
      is_outdoor_plant: formData.is_outdoor_plant,
      household_id: formData.household_id || undefined,
      alternative_names: formData.alternative_names,
    });

    if (success) {
      await onPlantAdded?.();
      onClose();
    }
    setIsSubmitting(false);
  };

  const handleWateringScheduleChange = (value: string) => {
    if (value === "custom") {
      setIsCustomSelected(true);
      setCustomDays(formData.watering_schedule_days.toString());
    } else {
      setIsCustomSelected(false);
      setCustomDays("");
      handleInputChange("watering_schedule_days", parseInt(value));
    }
  };

  const handleCustomDaysChange = (value: string) => {
    setCustomDays(value);
    const days = parseInt(value) || 1;
    handleInputChange("watering_schedule_days", Math.max(1, Math.min(365, days)));
  };

  const applyWateringDays = (days: number) => {
    handleInputChange("watering_schedule_days", days);
    if (PRESET_WATERING_OPTIONS.includes(days)) {
      setIsCustomSelected(false);
      setCustomDays("");
    } else {
      setIsCustomSelected(true);
      setCustomDays(days.toString());
    }
  };

  const handlePlantSelection = (selectedPlantName: string) => {
    const selectedPlant = findPlantInCatalog(selectedPlantName);
    setFormData((prev) => ({
      ...prev,
      plant_type: selectedPlantName,
      image: selectedPlant?.image || prev.image,
      alternative_names: selectedPlant?.otherNames || [],
    }));

    if (selectedPlant?.suggestedWateringDays) {
      setFormData((prev) => ({
        ...prev,
        watering_schedule_days: selectedPlant.suggestedWateringDays!,
      }));
      applyWateringDays(selectedPlant.suggestedWateringDays);
    }

    setIsCustomPlantType(false);
    setCustomPlantType("");
  };

  const handleCustomPlantSelection = (customPlantName: string) => {
    const catalogPlant = findPlantInCatalog(customPlantName);
    if (catalogPlant) {
      handlePlantSelection(catalogPlant.name);
    } else {
      setFormData((prev) => ({ ...prev, plant_type: customPlantName }));
      setIsCustomPlantType(true);
      setCustomPlantType(customPlantName);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md max-h-[90vh] overflow-y-auto"
        data-testid="add-plant-dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-plant-text dark:text-zinc-200">
            {plantData
              ? `Add ${plantData.name} to Collection`
              : "Add New Plant"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {plantData
              ? `Add this ${plantData.name} to your personal plant collection with custom care settings.`
              : "Add a new plant to your collection with personalized care settings."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="nickname"
              className="text-plant-text dark:text-zinc-200"
            >
              Plant Nickname *
            </Label>
            <Input
              id="nickname"
              value={formData.nickname}
              onChange={(e) => handleInputChange("nickname", e.target.value)}
              placeholder="Give your plant a nickname"
              className="border-plant-secondary/30 focus:border-plant-primary"
              required
              data-testid="plant-nickname-input"
            />
          </div>

          <PlantTypeSelector
            formData={formData}
            isDialogOpen={isOpen}
            onPlantSelection={handlePlantSelection}
            onCustomPlantSelection={handleCustomPlantSelection}
            isCustomPlantType={isCustomPlantType}
            customPlantType={customPlantType}
            onCustomPlantTypeChange={setCustomPlantType}
            onFormDataChange={(field, value) => handleInputChange(field, value)}
          />

          <HouseholdSelector
            households={households}
            householdId={formData.household_id}
            onHouseholdChange={(value) =>
              handleInputChange("household_id", value)
            }
          />

          <RoomSelector
            room={formData.room}
            isCustomRoom={isCustomRoom}
            customRoom={customRoom}
            onRoomChange={(value) => handleInputChange("room", value)}
            onCustomRoomToggle={setIsCustomRoom}
            onCustomRoomChange={setCustomRoom}
          />

          <LastWateredPicker
            lastWateredDate={lastWateredDate}
            onDateChange={setLastWateredDate}
          />

          <WateringScheduleSection
            wateringScheduleDays={formData.watering_schedule_days}
            isCustomSelected={isCustomSelected}
            customDays={customDays}
            onScheduleChange={handleWateringScheduleChange}
            onCustomDaysChange={handleCustomDaysChange}
            onOpenSmartWizard={() => setIsSmartWizardOpen(true)}
          />

          <ImageUpload
            value={formData.image}
            onChange={(url) => handleInputChange("image", url)}
            label="Plant Image"
            placeholder="Enter image URL or upload a photo"
          />

          <PlantNotesAndOptions
            notes={formData.notes}
            isOutdoorPlant={formData.is_outdoor_plant}
            onNotesChange={(value) => handleInputChange("notes", value)}
            onOutdoorChange={(value) =>
              handleInputChange("is_outdoor_plant", value)
            }
          />

          <FormActions
            isSubmitting={isSubmitting}
            isValid={
              !!formData.nickname.trim() && !!formData.plant_type.trim()
            }
            onCancel={onClose}
          />
        </form>

        <SmartWateringWizard
          isOpen={isSmartWizardOpen}
          onClose={() => setIsSmartWizardOpen(false)}
          onApplySchedule={(days) => {
            applyWateringDays(days);
            setIsSmartWizardOpen(false);
          }}
          baseDays={plantData?.suggestedWateringDays || 7}
          plantName={formData.nickname || plantData?.name || "your plant"}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddPlantDialog;

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Brain, ChevronDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
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
} from "@/components/add-plant";
import type { PlantData, AddPlantFormData } from "@/components/add-plant";

interface AddPlantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plantData?: PlantData | null;
  onPlantAdded?: () => void | Promise<void>;
  defaultHouseholdId?: string;
}

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
  const [showMoreOptions, setShowMoreOptions] = useState(false);
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
        setIsCustomRoom(false);
        setCustomRoom("");
      }
      setLastWateredDate(new Date());
      setShowMoreOptions(false);
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

  const applyWateringDays = (days: number) => {
    handleInputChange("watering_schedule_days", days);
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

  const catalogMatch = formData.plant_type ? findPlantInCatalog(formData.plant_type) : undefined;
  const isValid = !!formData.nickname.trim() && !!formData.plant_type.trim();
  const ctaName = formData.nickname.trim() || formData.plant_type.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={
          // Full-screen sheet on phones, a tall rounded panel from sm up. The last child is the
          // dialog's built-in close button, replaced here by the header's own.
          "gap-0 border-0 bg-background p-0 sm:max-w-lg sm:rounded-[32px] overflow-hidden flex flex-col " +
          "max-sm:inset-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:max-w-none max-sm:h-dvh " +
          "sm:max-h-[90vh] [&>button:last-child]:hidden"
        }
        data-testid="add-plant-dialog"
      >
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6" style={{ paddingTop: "max(env(safe-area-inset-top), 16px)" }}>
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-12 h-12 rounded-2xl bg-card text-foreground flex items-center justify-center"
                aria-label="Cancel"
                data-testid="add-plant-cancel-button"
              >
                <X className="w-[22px] h-[22px]" />
              </button>
              <DialogTitle className="text-sm font-bold text-muted-foreground">
                {plantData ? `Add ${plantData.name} to Collection` : "Add New Plant"}
              </DialogTitle>
              <div className="w-12" aria-hidden="true" />
            </div>
            <DialogDescription className="sr-only">
              Pick a plant type, name it, and set its watering schedule.
            </DialogDescription>

            <p className="font-display text-[28px] font-bold tracking-[-0.04em] mt-4 px-1.5 text-foreground">
              What are you growing?
            </p>

            <div className="mt-3.5">
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
            </div>

            <div className="rounded-card bg-card p-4 mt-[18px]">
              <Label
                htmlFor="nickname"
                className="text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground"
              >
                Nickname
              </Label>
              <input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => handleInputChange("nickname", e.target.value)}
                placeholder="Give it a name"
                className="w-full bg-transparent outline-none font-display text-[22px] font-bold mt-1.5 text-foreground placeholder:text-muted-foreground/60 caret-sprout-water"
                required
                autoComplete="off"
                data-testid="plant-nickname-input"
              />
            </div>

            <div className="mt-[18px]">
              <RoomSelector
                room={formData.room}
                isCustomRoom={isCustomRoom}
                customRoom={customRoom}
                onRoomChange={(value) => handleInputChange("room", value)}
                onCustomRoomToggle={setIsCustomRoom}
                onCustomRoomChange={setCustomRoom}
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-[18px]">
              <WateringScheduleSection
                wateringScheduleDays={formData.watering_schedule_days}
                onDaysChange={applyWateringDays}
              />
              <LastWateredPicker
                lastWateredDate={lastWateredDate}
                onDateChange={setLastWateredDate}
              />
            </div>

            <div className="flex items-start justify-between gap-3 mt-2.5 px-1.5">
              <p className="text-[13px] text-muted-foreground leading-snug">
                {catalogMatch
                  ? `Suggested for ${catalogMatch.name}: every ${catalogMatch.suggestedWateringDays} days, ${catalogMatch.lightRequirement.toLowerCase()}.`
                  : "Not sure how often? Let us work it out."}
              </p>
              <button
                type="button"
                onClick={() => setIsSmartWizardOpen(true)}
                className="shrink-0 text-[13px] font-bold text-link inline-flex items-center gap-1"
                data-testid="smart-watering-button"
              >
                <Brain className="w-4 h-4" />
                Find schedule
              </button>
            </div>

            {/* Less common fields stay out of the way until asked for */}
            <div className="mt-[18px] rounded-card bg-card">
              <button
                type="button"
                onClick={() => setShowMoreOptions((v) => !v)}
                className="w-full h-14 px-4 flex items-center justify-between font-bold text-[15px] text-foreground"
                aria-expanded={showMoreOptions}
              >
                More options
                <ChevronDown className={cn("w-5 h-5 transition-transform", showMoreOptions && "rotate-180")} />
              </button>
              {showMoreOptions && (
                <div className="px-4 pb-4 space-y-4">
                  <HouseholdSelector
                    households={households}
                    householdId={formData.household_id}
                    onHouseholdChange={(value) =>
                      handleInputChange("household_id", value)
                    }
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
                </div>
              )}
            </div>
          </div>

          <div
            className="shrink-0 px-4 sm:px-6 pt-3 bg-background"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}
          >
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="w-full h-16 rounded-3xl bg-sprout-dark text-sprout-cream flex items-center justify-center gap-2.5 font-display font-bold text-base shadow-[0_12px_30px_rgba(29,60,40,0.35),inset_0_0_0_2px_#dfc490] disabled:opacity-50 disabled:shadow-none"
              data-testid="add-plant-submit-button"
            >
              <Plus className="w-[22px] h-[22px]" strokeWidth={2.5} />
              {isSubmitting ? "Adding..." : ctaName ? `Add ${ctaName}` : "Add plant"}
            </button>
          </div>
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

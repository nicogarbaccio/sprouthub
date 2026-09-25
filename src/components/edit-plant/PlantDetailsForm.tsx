import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Brain } from "lucide-react";
import ImageUpload from "@/components/ui/image-upload";
import { ROOM_OPTIONS, NO_ROOM_VALUE } from "@/utils/rooms";
import { SmartWateringWizard } from "@/components/SmartWateringWizard";
import { HouseholdSelector, RoomSelector, WateringScheduleSection } from "@/components/add-plant";
import { FieldLabel, SettingRow, settingsInputClasses } from "@/components/settings/SettingsUI";

interface PlantDetailsFormProps {
  nickname: string;
  setNickname: (value: string) => void;
  plantType: string;
  setPlantType: (value: string) => void;
  image: string;
  setImage: (value: string) => void;
  room: string;
  setRoom: (value: string) => void;
  suggestedWateringDays: number;
  setSuggestedWateringDays: (value: number) => void;
  isOutdoorPlant?: boolean;
  setIsOutdoorPlant?: (value: boolean) => void;
  householdId?: string;
  setHouseholdId?: (value: string) => void;
  households?: Array<{ id: string; name: string; member_count: number }>;
  alternativeNames?: string[];
  setAlternativeNames?: (value: string[]) => void;
}

/** The edit form, built from the same pieces as Add Plant so the two read alike */
const PlantDetailsForm = ({
  nickname,
  setNickname,
  plantType,
  setPlantType,
  image,
  setImage,
  room,
  setRoom,
  suggestedWateringDays,
  setSuggestedWateringDays,
  isOutdoorPlant = false,
  setIsOutdoorPlant,
  householdId = "",
  setHouseholdId,
  households = [],
  alternativeNames = [],
  setAlternativeNames,
}: PlantDetailsFormProps) => {
  const [isCustomRoom, setIsCustomRoom] = useState(false);
  const [customRoom, setCustomRoom] = useState("");
  const [isSmartWizardOpen, setIsSmartWizardOpen] = useState(false);

  // A saved room that isn't one of the presets opens in custom mode. Only switches it on:
  // picking a preset chip turns custom mode off itself, and an empty custom name mustn't.
  useEffect(() => {
    if (room && room !== NO_ROOM_VALUE && !ROOM_OPTIONS.some((option) => option.value === room)) {
      setIsCustomRoom(true);
      setCustomRoom(room);
    }
  }, [room]);

  return (
    <div data-testid="plant-details-form" className="space-y-[18px]">
      <div className="rounded-3xl bg-card p-4 space-y-3">
        <div>
          <FieldLabel htmlFor="nickname">Nickname</FieldLabel>
          <Input
            data-testid="plant-nickname-input"
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Enter plant nickname"
            className={settingsInputClasses}
          />
        </div>

        <div>
          <FieldLabel htmlFor="plantType">Plant Type</FieldLabel>
          <Input
            data-testid="plant-type-input"
            id="plantType"
            value={plantType}
            onChange={(e) => setPlantType(e.target.value)}
            placeholder="Enter plant type"
            className={settingsInputClasses}
          />
        </div>

        {setAlternativeNames && (
          <div>
            <FieldLabel htmlFor="alternativeNames">Alternative Names</FieldLabel>
            <Input
              data-testid="alternative-names-input"
              id="alternativeNames"
              value={alternativeNames.join(", ")}
              onChange={(e) => {
                const names = e.target.value
                  .split(",")
                  .map((name) => name.trim())
                  .filter(Boolean);
                setAlternativeNames(names);
              }}
              placeholder="e.g. Snake Plant, Mother-in-Law's Tongue"
              className={settingsInputClasses}
            />
            <p className="text-[13px] text-muted-foreground px-1 mt-1.5">
              Other names this plant is known by, separated by commas
            </p>
          </div>
        )}
      </div>

      <RoomSelector
        room={room}
        isCustomRoom={isCustomRoom}
        customRoom={customRoom}
        onRoomChange={setRoom}
        onCustomRoomToggle={setIsCustomRoom}
        onCustomRoomChange={setCustomRoom}
      />

      <div>
        <WateringScheduleSection
          wateringScheduleDays={suggestedWateringDays}
          onDaysChange={setSuggestedWateringDays}
        />
        <div className="flex items-start justify-between gap-3 mt-2.5 px-1.5">
          <p className="text-[13px] text-muted-foreground leading-snug">Not sure how often? Let us work it out.</p>
          <button
            data-testid="smart-watering-wizard-button"
            type="button"
            onClick={() => setIsSmartWizardOpen(true)}
            className="shrink-0 text-[13px] font-bold text-link inline-flex items-center gap-1"
          >
            <Brain className="w-4 h-4" />
            Find schedule
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-card p-4 space-y-4">
        {setHouseholdId && (
          <HouseholdSelector households={households} householdId={householdId} onHouseholdChange={setHouseholdId} />
        )}

        <ImageUpload
          value={image}
          onChange={setImage}
          label="Plant Image"
          placeholder="Enter image URL or upload a photo"
        />

        {setIsOutdoorPlant && (
          <SettingRow
            htmlFor="is-outdoor-plant-edit"
            label="Outdoor plant"
            description="Gets rain delay suggestions when weather is on"
            control={
              <Switch
                data-testid="outdoor-plant-checkbox"
                id="is-outdoor-plant-edit"
                checked={isOutdoorPlant}
                onCheckedChange={setIsOutdoorPlant}
              />
            }
          />
        )}
      </div>

      <SmartWateringWizard
        isOpen={isSmartWizardOpen}
        onClose={() => setIsSmartWizardOpen(false)}
        onApplySchedule={(days) => {
          setSuggestedWateringDays(days);
          setIsSmartWizardOpen(false);
        }}
        baseDays={suggestedWateringDays}
        plantName={nickname || plantType || "your plant"}
      />
    </div>
  );
};

export default PlantDetailsForm;

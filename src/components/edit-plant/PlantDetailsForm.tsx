import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Brain, TreePine } from "lucide-react";
import ImageUpload from "@/components/ui/image-upload";
import { ROOM_OPTIONS, NO_ROOM_VALUE } from "@/utils/rooms";
import { SmartWateringWizard } from "@/components/SmartWateringWizard";

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
}

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
}: PlantDetailsFormProps) => {
  const [isCustomRoom, setIsCustomRoom] = useState(false);
  const [customRoom, setCustomRoom] = useState("");
  const [isSmartWizardOpen, setIsSmartWizardOpen] = useState(false);
  const [isInCustomMode, setIsInCustomMode] = useState(false);

  // Check if current room is a custom room (not in predefined options)
  useEffect(() => {
    if (
      room &&
      room !== NO_ROOM_VALUE &&
      !ROOM_OPTIONS.find((option) => option.value === room)
    ) {
      setIsCustomRoom(true);
      setCustomRoom(room);
    } else {
      setIsCustomRoom(false);
      setCustomRoom("");
    }
  }, [room]);

  // Initialize custom mode based on whether the initial watering value is a preset
  useEffect(() => {
    const isPresetValue = wateringOptions.some(
      (option) => option.value === suggestedWateringDays
    );
    setIsInCustomMode(!isPresetValue);
  }, []);

  const wateringOptions = [
    { value: 3, label: "Every 3 days" },
    { value: 7, label: "Weekly (7 days)" },
    { value: 10, label: "Every 10 days" },
    { value: 14, label: "Bi-weekly (14 days)" },
    { value: 21, label: "Every 3 weeks" },
    { value: 30, label: "Monthly (30 days)" },
  ];

  const isCustomValue = !wateringOptions.some(
    (option) => option.value === suggestedWateringDays
  );

  const handleWateringScheduleChange = (value: string) => {
    if (value === "custom") {
      setIsInCustomMode(true);
      // Don't change the value when switching to custom mode
    } else {
      setIsInCustomMode(false);
      setSuggestedWateringDays(parseInt(value));
    }
  };

  const getCurrentSelectValue = () => {
    if (isInCustomMode) return "custom";
    return suggestedWateringDays.toString();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Plant Information</h3>

      <div className="space-y-2">
        <Label htmlFor="nickname">Nickname</Label>
        <Input
          id="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Enter plant nickname"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="plantType">Plant Type</Label>
        <Input
          id="plantType"
          value={plantType}
          onChange={(e) => setPlantType(e.target.value)}
          placeholder="Enter plant type"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="room">Room (Optional)</Label>
        <Select
          value={isCustomRoom ? "custom" : room || NO_ROOM_VALUE}
          onValueChange={(value) => {
            if (value === "custom") {
              setIsCustomRoom(true);
            } else {
              setIsCustomRoom(false);
              setCustomRoom("");
              setRoom(value === NO_ROOM_VALUE ? "" : value);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a room or leave empty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_ROOM_VALUE}>No room assigned</SelectItem>
            {ROOM_OPTIONS.map((roomOption) => (
              <SelectItem key={roomOption.value} value={roomOption.value}>
                <span className="flex items-center gap-2">
                  <span>{roomOption.icon}</span>
                  <span>{roomOption.label}</span>
                </span>
              </SelectItem>
            ))}
            <SelectItem value="custom">🏠 Custom Room</SelectItem>
          </SelectContent>
        </Select>

        {isCustomRoom && (
          <div className="space-y-1">
            <Label htmlFor="custom_room" className="text-sm">
              Custom Room Name
            </Label>
            <Input
              id="custom_room"
              value={customRoom}
              onChange={(e) => {
                setCustomRoom(e.target.value);
                setRoom(e.target.value);
              }}
              placeholder="Enter custom room name"
            />
          </div>
        )}
      </div>

      <ImageUpload
        value={image}
        onChange={setImage}
        label="Plant Image"
        placeholder="Enter image URL or upload a photo"
      />

      <div className="space-y-2">
        <Label htmlFor="wateringSchedule">Watering Schedule</Label>
        <Select
          value={getCurrentSelectValue()}
          onValueChange={handleWateringScheduleChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select watering frequency" />
          </SelectTrigger>
          <SelectContent>
            {wateringOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="button"
          className="w-full mt-2 text-sm bg-sprout-success hover:bg-sprout-success/90 text-white border-none"
          onClick={() => setIsSmartWizardOpen(true)}
        >
          <Brain className="w-4 h-4 mr-2" />
          Find optimal schedule for this plant
        </Button>

        {isInCustomMode && (
          <div className="space-y-1">
            <Label htmlFor="customDays" className="text-sm">
              Custom days
            </Label>
            <Input
              id="customDays"
              type="number"
              min="1"
              max="365"
              value={suggestedWateringDays}
              onChange={(e) =>
                setSuggestedWateringDays(parseInt(e.target.value) || 1)
              }
              placeholder="Enter days between watering"
            />
            <p className="text-xs text-muted-foreground">
              Enter a number between 1 and 365 days
            </p>
          </div>
        )}
      </div>

      {/* Outdoor Plant Checkbox */}
      {setIsOutdoorPlant && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-outdoor-plant-edit"
              checked={isOutdoorPlant}
              onCheckedChange={(checked) => setIsOutdoorPlant(checked === true)}
            />
            <Label
              htmlFor="is-outdoor-plant-edit"
              className="flex items-center gap-2"
            >
              <TreePine className="w-4 h-4" />
              This is an outdoor plant
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Outdoor plants will get smart rain delay recommendations when
            weather data is available
          </p>
        </div>
      )}

      <SmartWateringWizard
        isOpen={isSmartWizardOpen}
        onClose={() => setIsSmartWizardOpen(false)}
        onApplySchedule={(days) => {
          setSuggestedWateringDays(days);

          // Check if the recommended days match any preset option
          const presetOptions = [3, 7, 10, 14, 21, 30];
          if (presetOptions.includes(days)) {
            setIsInCustomMode(false); // Use dropdown mode
          } else {
            setIsInCustomMode(true); // Use custom mode
          }

          setIsSmartWizardOpen(false);
        }}
        baseDays={suggestedWateringDays}
        plantName={nickname || plantType || "your plant"}
      />
    </div>
  );
};

export default PlantDetailsForm;

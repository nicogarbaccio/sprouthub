import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandGroup,
  CommandEmpty,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CalendarIcon,
  AlertTriangle,
  Check,
  ChevronDown,
  Brain,
  TreePine,
} from "lucide-react";
import { format } from "date-fns";
import { useUserPlants } from "@/hooks/useUserPlants";
import { useHouseholds } from "@/hooks/useHouseholds";
import ImageUpload from "@/components/ui/image-upload";
import { plants as allPlants } from "@/data/plantData";
import { cn } from "@/lib/utils";
import { ROOM_OPTIONS, NO_ROOM_VALUE } from "@/utils/rooms";
import { SmartWateringWizard } from "@/components/SmartWateringWizard";

interface PlantData {
  name: string;
  botanicalName: string;
  image: string;
  wateringFrequency: string;
  suggestedWateringDays?: number;
  lightRequirement: string;
  careLevel: string;
}

interface AddPlantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plantData?: PlantData | null;
  onPlantAdded?: () => void; // Optional callback to refresh parent's plant list
}

const AddPlantDialog = ({
  isOpen,
  onClose,
  plantData,
  onPlantAdded,
}: AddPlantDialogProps) => {
  const { addPlant } = useUserPlants();
  const { households } = useHouseholds();
  const [formData, setFormData] = useState({
    nickname: "",
    plant_type: "",
    image: "",
    room: NO_ROOM_VALUE,
    watering_schedule_days: 7,
    notes: "",
    is_outdoor_plant: false,
    household_id: "",
  });
  const [lastWateredDate, setLastWateredDate] = useState<Date | undefined>(
    new Date()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customDays, setCustomDays] = useState<string>("");
  const [isCustomSelected, setIsCustomSelected] = useState(false);
  const [isCustomPlantType, setIsCustomPlantType] = useState(false);
  const [customPlantType, setCustomPlantType] = useState("");
  const [plantTypeSearch, setPlantTypeSearch] = useState("");
  const [isPlantTypePopoverOpen, setIsPlantTypePopoverOpen] = useState(false);
  const [isCustomRoom, setIsCustomRoom] = useState(false);
  const [customRoom, setCustomRoom] = useState("");
  const [isSmartWizardOpen, setIsSmartWizardOpen] = useState(false);

  // Reset form when dialog opens/closes or plant data changes
  useEffect(() => {
    if (isOpen) {
      if (plantData) {
        // Pre-populate with catalog plant data
        setFormData({
          nickname: plantData.name,
          plant_type: plantData.name,
          image: plantData.image,
          room: NO_ROOM_VALUE,
          watering_schedule_days: plantData.suggestedWateringDays || 7,
          notes: `Botanical name: ${plantData.botanicalName}\nWatering: ${plantData.wateringFrequency}\nLight: ${plantData.lightRequirement}\nCare level: ${plantData.careLevel}`,
          is_outdoor_plant: false,
          household_id: "",
        });
        setIsCustomPlantType(false);
        setCustomPlantType("");
        // Check if the suggested days match any preset option
        const suggestedDays = plantData.suggestedWateringDays || 7;
        const presetOptions = [3, 7, 10, 14, 21, 30];
        if (!presetOptions.includes(suggestedDays)) {
          setIsCustomSelected(true);
          setCustomDays(suggestedDays.toString());
        } else {
          setIsCustomSelected(false);
          setCustomDays("");
        }
      } else {
        // Reset for manual addition
        setFormData({
          nickname: "",
          plant_type: "",
          image: "",
          room: NO_ROOM_VALUE,
          watering_schedule_days: 7,
          notes: "",
          is_outdoor_plant: false,
          household_id: "",
        });
        setIsCustomPlantType(false);
        setCustomPlantType("");
        setIsCustomSelected(false);
        setCustomDays("");
        setIsCustomRoom(false);
        setCustomRoom("");
      }

      // Reset last watered date to today
      setLastWateredDate(new Date());
    }
  }, [isOpen, plantData]);

  // Auto-close dropdown when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsPlantTypePopoverOpen(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nickname.trim() || !formData.plant_type.trim()) {
      return;
    }

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
    });

    if (success) {
      onPlantAdded?.(); // Refresh parent's plant list if callback provided
      onClose();
    }

    setIsSubmitting(false);
  };

  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleWateringScheduleChange = (value: string) => {
    if (value === "custom") {
      setIsCustomSelected(true);
      // Set customDays to the current watering_schedule_days value so user sees it in the input
      setCustomDays(formData.watering_schedule_days.toString());
      // Don't change the actual watering_schedule_days value when switching to custom mode
    } else {
      setIsCustomSelected(false);
      setCustomDays("");
      handleInputChange("watering_schedule_days", parseInt(value));
    }
  };

  const handleCustomDaysChange = (value: string) => {
    setCustomDays(value);
    const days = parseInt(value) || 1;
    handleInputChange(
      "watering_schedule_days",
      Math.max(1, Math.min(365, days))
    );
  };

  const commonPlantTypes = [
    "Peace Lily",
    "Monstera Deliciosa",
    "Snake Plant",
    "Fiddle Leaf Fig",
    "Pothos",
    "Rubber Plant",
    "ZZ Plant",
    "Boston Fern",
    "Aloe Vera",
    "Philodendron",
    "Bird of Paradise",
    "Spider Plant",
  ];

  // All unique plant names from the catalog
  const allPlantNames = Array.from(new Set(allPlants.map((p) => p.name)));

  // Filtered plant names for search
  const filteredPlantNames = plantTypeSearch
    ? allPlantNames.filter((name) =>
        name.toLowerCase().includes(plantTypeSearch.toLowerCase())
      )
    : commonPlantTypes;

  const wateringOptions = [
    { value: 3, label: "Every 3 days" },
    { value: 7, label: "Weekly (7 days)" },
    { value: 10, label: "Every 10 days" },
    { value: 14, label: "Bi-weekly (14 days)" },
    { value: 21, label: "Every 3 weeks" },
    { value: 30, label: "Monthly (30 days)" },
  ];

  // Enhanced plant matching function
  const findPlantInCatalog = (searchName: string) => {
    const normalizedSearch = searchName.toLowerCase().trim();

    // Exact match first
    let plant = allPlants.find(
      (p) => p.name.toLowerCase() === normalizedSearch
    );

    // Fuzzy match if no exact match (for slight variations like "Snake Man" vs "Snake Plant")
    if (!plant) {
      plant = allPlants.find(
        (p) =>
          p.name.toLowerCase().includes(normalizedSearch) ||
          normalizedSearch.includes(p.name.toLowerCase()) ||
          // Handle common variations
          (normalizedSearch.includes("snake") &&
            p.name.toLowerCase().includes("snake")) ||
          (normalizedSearch.includes("peace") &&
            p.name.toLowerCase().includes("peace"))
      );
    }

    return plant;
  };

  // Helper function to handle plant selection and update watering frequency
  const handlePlantSelection = (selectedPlantName: string) => {
    // Find the plant data in the catalog with enhanced matching
    const selectedPlant = findPlantInCatalog(selectedPlantName);

    // Update form data with plant type and image if available
    setFormData((prev) => ({
      ...prev,
      plant_type: selectedPlantName,
      image: selectedPlant?.image || prev.image, // Auto-assign catalog image if available
    }));

    // If plant found in catalog, update watering frequency
    if (selectedPlant && selectedPlant.suggestedWateringDays) {
      const suggestedDays = selectedPlant.suggestedWateringDays;

      // Update watering schedule days
      setFormData((prev) => ({
        ...prev,
        watering_schedule_days: suggestedDays,
      }));

      // Check if the suggested days match any preset option
      const presetOptions = [3, 7, 10, 14, 21, 30];
      if (presetOptions.includes(suggestedDays)) {
        // Use preset option - show in dropdown
        setIsCustomSelected(false);
        setCustomDays("");
      } else {
        // Use custom value - show in custom input
        setIsCustomSelected(true);
        setCustomDays(suggestedDays.toString());
      }
    }

    // Reset other plant type related states
    setIsCustomPlantType(false);
    setCustomPlantType("");
    setPlantTypeSearch("");
    setIsPlantTypePopoverOpen(false);
  };

  // Helper function to handle custom plant type selection
  const handleCustomPlantSelection = (customPlantName: string) => {
    // Check if this "custom" plant actually exists in catalog (fuzzy match)
    const catalogPlant = findPlantInCatalog(customPlantName);

    if (catalogPlant) {
      // If found in catalog, treat as regular plant selection
      handlePlantSelection(catalogPlant.name);
    } else {
      // True custom plant - no catalog data available
      setFormData((prev) => ({
        ...prev,
        plant_type: customPlantName,
      }));
      setIsCustomPlantType(true);
      setCustomPlantType(customPlantName);
      setPlantTypeSearch("");
      setIsPlantTypePopoverOpen(false);
    }
  };

  // Determine the current select value
  const getCurrentSelectValue = () => {
    if (isCustomSelected) return "custom";
    return formData.watering_schedule_days.toString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-plant-text dark:text-zinc-200 ">
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
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="plant_type"
              className="text-plant-text dark:text-zinc-200"
            >
              Plant Type *
            </Label>
            <div className="relative plant-type-dropdown">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setIsPlantTypePopoverOpen(!isPlantTypePopoverOpen)
                }
                className="w-full justify-between border-plant-secondary/30 focus:border-plant-primary font-normal"
              >
                <span className="font-normal text-muted-foreground">
                  {formData.plant_type || "Search or select plant type..."}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
              {isPlantTypePopoverOpen && (
                <div className="absolute top-full left-0 right-0 z-50 bg-card border border-border rounded-md shadow-lg mt-1">
                  <div className="border-b p-2">
                    <Input
                      placeholder="Search plant types..."
                      value={plantTypeSearch}
                      onChange={(e) => setPlantTypeSearch(e.target.value)}
                      className="border-0 focus:ring-0 focus:outline-none"
                      autoFocus
                    />
                  </div>
                  <div
                    className="max-h-[200px] overflow-y-scroll p-1 bg-card"
                    style={{
                      maxHeight: "200px",
                      overflowY: "scroll",
                      scrollbarWidth: "thin",
                    }}
                  >
                    {filteredPlantNames.length === 0 ? (
                      <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                        No plants found.
                      </div>
                    ) : (
                      filteredPlantNames.map((type) => (
                        <div
                          key={type}
                          className="flex items-center px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded-sm"
                          onClick={() => {
                            handlePlantSelection(type);
                            setIsPlantTypePopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.plant_type === type
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {type}
                        </div>
                      ))
                    )}
                    {plantTypeSearch &&
                      !allPlantNames.some(
                        (name) =>
                          name.toLowerCase() === plantTypeSearch.toLowerCase()
                      ) && (
                        <div
                          className="flex items-center px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded-sm"
                          onClick={() => {
                            handleCustomPlantSelection(plantTypeSearch);
                            setIsPlantTypePopoverOpen(false);
                          }}
                        >
                          <Check className="mr-2 h-4 w-4 opacity-0" />
                          Add "{plantTypeSearch}" as custom
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
            {/* Show custom plant type input if a custom type is selected */}
            {isCustomPlantType && (
              <div className="space-y-2">
                <Label
                  htmlFor="custom_plant_type"
                  className="text-plant-text dark:text-zinc-200"
                >
                  Custom Plant Type *
                </Label>
                <Input
                  id="custom_plant_type"
                  value={customPlantType}
                  onChange={(e) => {
                    setCustomPlantType(e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      plant_type: e.target.value,
                    }));
                  }}
                  placeholder="Enter custom plant type"
                  className="border-plant-secondary/30 focus:border-plant-primary"
                  required
                />
              </div>
            )}
          </div>

          {/* Household Assignment */}
          {households.length > 0 && (
            <div className="space-y-2">
              <Label
                htmlFor="household_assignment"
                className="text-plant-text dark:text-zinc-200"
              >
                Assignment
              </Label>
              <Select
                value={formData.household_id || "personal"}
                onValueChange={(value) =>
                  handleInputChange(
                    "household_id",
                    value === "personal" ? "" : value
                  )
                }
              >
                <SelectTrigger className="border-plant-secondary/30 focus:border-plant-primary">
                  <SelectValue placeholder="Personal plant or assign to household" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">
                    <div className="flex items-center gap-2">
                      <span>👤</span>
                      <span>Personal Plant</span>
                    </div>
                  </SelectItem>
                  {households.map((household) => (
                    <SelectItem key={household.id} value={household.id}>
                      <div className="flex items-center gap-2">
                        <span>🏠</span>
                        <span>{household.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({household.member_count} members)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.household_id && (
                <p className="text-xs text-muted-foreground">
                  This plant will be visible and manageable by all household
                  members
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label
              htmlFor="room"
              className="text-plant-text dark:text-zinc-200"
            >
              Room (Optional)
            </Label>
            <Select
              value={formData.room}
              onValueChange={(value) => {
                if (value === "custom") {
                  setIsCustomRoom(true);
                  handleInputChange("room", customRoom);
                } else {
                  setIsCustomRoom(false);
                  setCustomRoom("");
                  handleInputChange("room", value);
                }
              }}
            >
              <SelectTrigger className="border-plant-secondary/30 focus:border-plant-primary">
                <SelectValue placeholder="Select a room or leave empty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_ROOM_VALUE}>No room assigned</SelectItem>
                {ROOM_OPTIONS.map((room) => (
                  <SelectItem key={room.value} value={room.value}>
                    <span className="flex items-center gap-2">
                      <span>{room.icon}</span>
                      <span>{room.label}</span>
                    </span>
                  </SelectItem>
                ))}
                <SelectItem value="custom">🏠 Custom Room</SelectItem>
              </SelectContent>
            </Select>

            {isCustomRoom && (
              <div className="space-y-1">
                <Label
                  htmlFor="custom_room"
                  className="text-plant-text dark:text-zinc-200 text-sm"
                >
                  Custom Room Name
                </Label>
                <Input
                  id="custom_room"
                  value={customRoom}
                  onChange={(e) => {
                    setCustomRoom(e.target.value);
                    handleInputChange("room", e.target.value);
                  }}
                  placeholder="Enter custom room name"
                  className="border-plant-secondary/30 focus:border-plant-primary"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-plant-text dark:text-zinc-200">
              Last Watered
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal border-plant-secondary/30 focus:border-plant-primary"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {lastWateredDate
                    ? format(lastWateredDate, "PPP")
                    : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={lastWateredDate}
                  onSelect={setLastWateredDate}
                  initialFocus
                />
                <div className="p-3 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setLastWateredDate(undefined)}
                  >
                    Clear Date
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            {!lastWateredDate && (
              <div className="flex items-center gap-2 p-2 bg-sprout-warning/10 border border-sprout-warning/30 rounded-md">
                <AlertTriangle className="h-4 w-4 text-sprout-warning" />
                <p className="text-sm text-sprout-warning">
                  No last watering date set - watering schedule calculations may
                  be inaccurate
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="watering_schedule"
              className="text-plant-text dark:text-zinc-200"
            >
              Watering Schedule
            </Label>
            <Select
              value={getCurrentSelectValue()}
              onValueChange={handleWateringScheduleChange}
            >
              <SelectTrigger className="border-plant-secondary/30 focus:border-plant-primary">
                <SelectValue placeholder="Select watering frequency" />
              </SelectTrigger>
              <SelectContent>
                {wateringOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value.toString()}
                  >
                    {option.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              className="w-full mt-2 text-sm border-plant-primary/30 hover:bg-plant-primary/5 hover:border-plant-primary dark:bg-sprout-success dark:hover:bg-sprout-success/90 dark:border-sprout-success dark:text-white"
              onClick={() => setIsSmartWizardOpen(true)}
              data-testid="smart-watering-button"
            >
              <Brain className="w-4 h-4 mr-2" />
              Find optimal schedule for this plant
            </Button>

            {isCustomSelected && (
              <div className="space-y-1">
                <Label
                  htmlFor="custom_days"
                  className="text-plant-text dark:text-zinc-200 text-sm"
                >
                  Custom days
                </Label>
                <Input
                  id="custom_days"
                  type="number"
                  min="1"
                  max="365"
                  value={customDays}
                  onChange={(e) => handleCustomDaysChange(e.target.value)}
                  placeholder="Enter days between watering"
                  className="border-plant-secondary/30 focus:border-plant-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a number between 1 and 365 days
                </p>
              </div>
            )}
          </div>

          <ImageUpload
            value={formData.image}
            onChange={(url) => handleInputChange("image", url)}
            label="Plant Image"
            placeholder="Enter image URL or upload a photo"
          />

          <div className="space-y-2">
            <Label
              htmlFor="notes"
              className="text-plant-text dark:text-zinc-200"
            >
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Care instructions, botanical name, etc."
              className="border-plant-secondary/30 focus:border-plant-primary min-h-20"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-outdoor-plant"
                checked={formData.is_outdoor_plant}
                onCheckedChange={(checked) =>
                  handleInputChange("is_outdoor_plant", checked === true)
                }
              />
              <Label
                htmlFor="is-outdoor-plant"
                className="text-plant-text dark:text-zinc-200 flex items-center gap-2"
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

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-plant-secondary/30 hover:bg-plant-secondary/10"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !formData.nickname.trim() ||
                !formData.plant_type.trim() ||
                isSubmitting
              }
              className="flex-1 bg-sprout-success hover:bg-sprout-success/90 text-sprout-white rounded-xl font-medium"
            >
              {isSubmitting ? "Adding..." : "Add Plant"}
            </Button>
          </div>
        </form>

        <SmartWateringWizard
          isOpen={isSmartWizardOpen}
          onClose={() => setIsSmartWizardOpen(false)}
          onApplySchedule={(days) => {
            handleInputChange("watering_schedule_days", days);

            // Check if the recommended days match any preset option
            const presetOptions = [3, 7, 10, 14, 21, 30];
            if (presetOptions.includes(days)) {
              // Use preset option - show in dropdown
              setIsCustomSelected(false);
              setCustomDays("");
            } else {
              // Use custom value - show in custom input
              setIsCustomSelected(true);
              setCustomDays(days.toString());
            }

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

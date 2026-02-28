import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronDown } from "lucide-react";
import { plants as allPlants } from "@/data/plantData";
import { cn } from "@/lib/utils";
import type { AddPlantFormData } from "./types";

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

// Enhanced plant matching function
export const findPlantInCatalog = (searchName: string) => {
  const normalizedSearch = searchName.toLowerCase().trim();

  let plant = allPlants.find(
    (p) => p.name.toLowerCase() === normalizedSearch
  );

  if (!plant) {
    plant = allPlants.find(
      (p) =>
        p.name.toLowerCase().includes(normalizedSearch) ||
        normalizedSearch.includes(p.name.toLowerCase()) ||
        (normalizedSearch.includes("snake") &&
          p.name.toLowerCase().includes("snake")) ||
        (normalizedSearch.includes("peace") &&
          p.name.toLowerCase().includes("peace"))
    );
  }

  return plant;
};

interface PlantTypeSelectorProps {
  formData: AddPlantFormData;
  isDialogOpen: boolean;
  onPlantSelection: (selectedPlantName: string) => void;
  onCustomPlantSelection: (customPlantName: string) => void;
  isCustomPlantType: boolean;
  customPlantType: string;
  onCustomPlantTypeChange: (value: string) => void;
  onFormDataChange: (field: string, value: string) => void;
}

export const PlantTypeSelector = ({
  formData,
  isDialogOpen,
  onPlantSelection,
  onCustomPlantSelection,
  isCustomPlantType,
  customPlantType,
  onCustomPlantTypeChange,
  onFormDataChange,
}: PlantTypeSelectorProps) => {
  const [plantTypeSearch, setPlantTypeSearch] = useState("");
  const [isPlantTypePopoverOpen, setIsPlantTypePopoverOpen] = useState(false);

  // Auto-close dropdown when dialog closes
  if (!isDialogOpen && isPlantTypePopoverOpen) {
    setIsPlantTypePopoverOpen(false);
  }

  const filteredPlantNames = plantTypeSearch
    ? allPlantNames.filter((name) =>
        name.toLowerCase().includes(plantTypeSearch.toLowerCase())
      )
    : commonPlantTypes;

  return (
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
          onClick={() => setIsPlantTypePopoverOpen(!isPlantTypePopoverOpen)}
          className="w-full justify-between border-plant-secondary/30 focus:border-plant-primary font-normal"
          data-testid="plant-type-trigger"
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
                data-testid="plant-type-search-input"
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
                      onPlantSelection(type);
                      setPlantTypeSearch("");
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
                      onCustomPlantSelection(plantTypeSearch);
                      setPlantTypeSearch("");
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
              onCustomPlantTypeChange(e.target.value);
              onFormDataChange("plant_type", e.target.value);
            }}
            placeholder="Enter custom plant type"
            className="border-plant-secondary/30 focus:border-plant-primary"
            required
            data-testid="custom-plant-type-input"
          />
        </div>
      )}
    </div>
  );
};

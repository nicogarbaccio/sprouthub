import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Plus, Search } from "lucide-react";
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

const rank = (name: string, query: string) => {
  const lower = name.toLowerCase();
  if (lower === query) return 0;
  if (lower.startsWith(query)) return 1;
  return 2;
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

/**
 * Search field over a wrap of chips: common types by default, catalog matches while typing, and
 * an "add as custom" chip when nothing matches exactly.
 */
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

  // Clear the search when the dialog closes
  if (!isDialogOpen && plantTypeSearch) {
    setPlantTypeSearch("");
  }

  const query = plantTypeSearch.trim().toLowerCase();
  const matches = query
    ? allPlantNames
        .filter((name) => name.toLowerCase().includes(query))
        // Exact, then prefix, then anywhere, so the obvious pick is always in view
        .sort((a, b) => rank(a, query) - rank(b, query) || a.localeCompare(b))
        .slice(0, 12)
    : commonPlantTypes.slice(0, 8);

  // Keep the current pick visible even when it isn't in the default set
  const chips =
    formData.plant_type && !isCustomPlantType && !matches.includes(formData.plant_type)
      ? [formData.plant_type, ...matches]
      : matches;

  const canAddCustom =
    query !== "" && !allPlantNames.some((name) => name.toLowerCase() === query);

  const chipClass = (selected: boolean) =>
    cn(
      "h-11 px-3.5 rounded-full flex items-center gap-1.5 font-bold text-sm transition-colors",
      selected ? "bg-foreground text-background" : "bg-card text-foreground"
    );

  return (
    <div className="space-y-3">
      <div className="relative" data-testid="plant-type-trigger">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
        <Label htmlFor="plant_type_search" className="sr-only">
          Plant type
        </Label>
        <Input
          id="plant_type_search"
          placeholder={`Search ${allPlantNames.length}+ plant types`}
          value={plantTypeSearch}
          onChange={(e) => setPlantTypeSearch(e.target.value)}
          className="h-[52px] rounded-[18px] border-0 bg-card pl-12 text-[15px] font-medium"
          data-testid="plant-type-search-input"
          autoComplete="off"
        />
      </div>

      <div role="listbox" aria-label="Plant types" className="flex flex-wrap gap-2">
        {chips.map((type) => {
          const selected = formData.plant_type === type && !isCustomPlantType;
          return (
            <button
              key={type}
              type="button"
              role="option"
              aria-selected={selected}
              className={chipClass(selected)}
              onClick={() => {
                onPlantSelection(type);
                setPlantTypeSearch("");
              }}
            >
              {selected && <Check className="h-4 w-4" />}
              {type}
            </button>
          );
        })}
        {canAddCustom && (
          <button
            type="button"
            role="option"
            aria-selected={false}
            className={cn(chipClass(false), "border-2 border-dashed border-muted-foreground/40 bg-transparent")}
            onClick={() => {
              onCustomPlantSelection(plantTypeSearch.trim());
              setPlantTypeSearch("");
            }}
          >
            <Plus className="h-4 w-4" />
            Add "{plantTypeSearch.trim()}" as custom
          </button>
        )}
        {query && chips.length === 0 && !canAddCustom && (
          <p className="text-sm text-muted-foreground px-1.5 py-2">No plants found.</p>
        )}
      </div>

      {isCustomPlantType && (
        <div className="rounded-3xl bg-card p-4 space-y-1.5">
          <Label
            htmlFor="custom_plant_type"
            className="text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground"
          >
            Custom plant type
          </Label>
          <Input
            id="custom_plant_type"
            value={customPlantType}
            onChange={(e) => {
              onCustomPlantTypeChange(e.target.value);
              onFormDataChange("plant_type", e.target.value);
            }}
            placeholder="Enter custom plant type"
            className="h-11 rounded-2xl border-0 bg-field text-[15px] font-semibold"
            required
            data-testid="custom-plant-type-input"
          />
        </div>
      )}
    </div>
  );
};

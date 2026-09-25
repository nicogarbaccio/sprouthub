import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import {
 Collapsible,
 CollapsibleContent,
 CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface PlantSearchFiltersProps {
 searchTerm: string;
 setSearchTerm: (term: string) => void;
 isFilterOpen: boolean;
 setIsFilterOpen: (open: boolean) => void;
 selectedCategory: string;
 setSelectedCategory: (category: string) => void;
 selectedCareLevel: string;
 setSelectedCareLevel: (level: string) => void;
 selectedLightRequirement: string;
 setSelectedLightRequirement: (light: string) => void;
 categories: string[];
 careLevels: string[];
 lightRequirements: string[];
 hasActiveFilters: boolean;
 clearAllFilters: () => void;
}

const PlantSearchFilters = ({
 searchTerm,
 setSearchTerm,
 isFilterOpen,
 setIsFilterOpen,
 selectedCategory,
 setSelectedCategory,
 selectedCareLevel,
 setSelectedCareLevel,
 selectedLightRequirement,
 setSelectedLightRequirement,
 categories,
 careLevels,
 lightRequirements,
 hasActiveFilters,
 clearAllFilters,
}: PlantSearchFiltersProps) => {
 const activeFilterCount = [selectedCategory, selectedCareLevel, selectedLightRequirement].filter(
  (v) => v && v !== "all"
 ).length;

 const selectClasses =
 "h-12 rounded-2xl border-0 bg-field text-[15px] font-medium focus:ring-2 focus:ring-offset-0";

 const filter = (
 label: string,
 value: string,
 onChange: (v: string) => void,
 options: string[],
 allLabel: string,
 testId: string
 ) => (
 <div>
  <label className="block text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground px-1 mb-1.5">
  {label}
  </label>
  <Select value={value} onValueChange={onChange}>
  <SelectTrigger className={selectClasses} data-testid={testId}>
   <SelectValue placeholder={allLabel} />
  </SelectTrigger>
  <SelectContent className="rounded-2xl max-h-60">
   <SelectItem value="all">{allLabel}</SelectItem>
   {options.map((option) => (
   <SelectItem key={option} value={option}>
    {option}
   </SelectItem>
   ))}
  </SelectContent>
  </Select>
 </div>
 );

 return (
 <div className="mt-[18px] mb-4">
  <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
  <div className="flex gap-2">
   <div className="relative flex-1 min-w-0 lg:max-w-xl">
   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
   <Input
    type="text"
    placeholder="Search plants"
    aria-label="Search plants"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="h-[52px] rounded-[18px] border-0 bg-card pl-12 pr-11 text-[15px] font-medium focus-visible:ring-2 focus-visible:ring-offset-0"
    data-testid="search-input"
   />
   {searchTerm && (
    <button
    type="button"
    onClick={() => setSearchTerm("")}
    aria-label="Clear search"
    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground"
    data-testid="clear-search-button"
    >
    <X className="w-4 h-4" />
    </button>
   )}
   </div>

   <CollapsibleTrigger asChild>
   <button
    type="button"
    className={cn(
    "shrink-0 h-[52px] px-4 rounded-[18px] font-bold text-sm inline-flex items-center gap-2 transition-colors",
    activeFilterCount > 0 || isFilterOpen
     ? "bg-foreground text-background"
     : "bg-card text-foreground"
    )}
    data-testid="filters-button"
   >
    <SlidersHorizontal className="w-4 h-4" />
    Filters
    {activeFilterCount > 0 && (
    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-sprout-cream text-sprout-dark text-xs font-bold">
     {activeFilterCount}
    </span>
    )}
   </button>
   </CollapsibleTrigger>
  </div>

  <CollapsibleContent className="mt-3">
   <div className="rounded-card bg-card p-4 md:p-5">
   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
    {filter("Category", selectedCategory, setSelectedCategory, categories, "All Categories", "category-filter")}
    {filter("Care Level", selectedCareLevel, setSelectedCareLevel, careLevels, "All Levels", "care-level-filter")}
    {filter("Light Requirement", selectedLightRequirement, setSelectedLightRequirement, lightRequirements, "All Light Types", "light-requirement-filter")}
   </div>

   {hasActiveFilters && (
    <button
    type="button"
    onClick={clearAllFilters}
    className="mt-3 h-10 px-4 rounded-[14px] bg-field text-foreground text-sm font-bold inline-flex items-center gap-1.5"
    data-testid="clear-filters-button"
    >
    <X className="w-4 h-4" />
    Clear All Filters
    </button>
   )}
   </div>
  </CollapsibleContent>
  </Collapsible>
 </div>
 );
};

export default PlantSearchFilters;

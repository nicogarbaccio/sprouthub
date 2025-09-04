import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
 return (
 <div className="max-w-4xl mx-auto space-y-6 mb-8">
  <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
  {/* Search Bar and Filter Button Row */}
  <div className="flex justify-center gap-4">
   <div className="relative w-full max-w-md">
   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
   <Input
    type="text"
    placeholder="Search plants..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="pl-10 border-plant-secondary/30 focus:border-plant-primary rounded-xl h-11"
    data-testid="search-input"
   />
   </div>

   <CollapsibleTrigger asChild>
   <Button
    variant="outline"
    className="border-plant-secondary/30 hover:bg-plant-secondary/10 rounded-xl h-11 px-6 flex-shrink-0"
    data-testid="filters-button"
   >
    <Filter className="w-4 h-4 mr-2" />
    Filters
    {hasActiveFilters && (
    <Badge
     variant="secondary"
     className="ml-2 bg-plant-primary text-white text-xs"
    >
     Active
    </Badge>
    )}
   </Button>
   </CollapsibleTrigger>
  </div>

  {/* Filters Panel - Appears Below and Centered */}
  <CollapsibleContent className="mt-6">
   <div className="flex justify-center">
   <div className="p-6 bg-card rounded-xl border border-border shadow-lg w-full max-w-3xl">
    {/* Filter Controls */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="space-y-3">
     <label className="text-sm font-medium text-foreground block">
     Category
     </label>
     <Select
     value={selectedCategory}
     onValueChange={setSelectedCategory}
     >
     <SelectTrigger className="border-plant-secondary/30 w-full h-11">
      <SelectValue placeholder="All Categories" />
     </SelectTrigger>
     <SelectContent className="bg-card border border-plant-secondary/30 shadow-lg z-50 max-h-60">
      <SelectItem value="all">All Categories</SelectItem>
      {categories.map((category) => (
      <SelectItem key={category} value={category}>
       {category}
      </SelectItem>
      ))}
     </SelectContent>
     </Select>
    </div>

    <div className="space-y-3">
     <label className="text-sm font-medium text-foreground block">
     Care Level
     </label>
     <Select
     value={selectedCareLevel}
     onValueChange={setSelectedCareLevel}
     >
     <SelectTrigger className="border-plant-secondary/30 w-full h-11">
      <SelectValue placeholder="All Levels" />
     </SelectTrigger>
     <SelectContent className="bg-card border border-plant-secondary/30 shadow-lg z-50 max-h-60">
      <SelectItem value="all">All Levels</SelectItem>
      {careLevels.map((level) => (
      <SelectItem key={level} value={level}>
       {level}
      </SelectItem>
      ))}
     </SelectContent>
     </Select>
    </div>

    <div className="space-y-3">
     <label className="text-sm font-medium text-foreground block">
     Light Requirement
     </label>
     <Select
     value={selectedLightRequirement}
     onValueChange={setSelectedLightRequirement}
     >
     <SelectTrigger className="border-plant-secondary/30 w-full h-11">
      <SelectValue placeholder="All Light Types" />
     </SelectTrigger>
     <SelectContent className="bg-card border border-plant-secondary/30 shadow-lg z-50 max-h-60">
      <SelectItem value="all">All Light Types</SelectItem>
      {lightRequirements.map((light) => (
      <SelectItem key={light} value={light}>
       {light}
      </SelectItem>
      ))}
     </SelectContent>
     </Select>
    </div>
    </div>

    {/* Clear Filters Button */}
    {hasActiveFilters && (
    <div className="mt-6 pt-4 border-t border-border flex justify-center">
     <Button
     variant="ghost"
     onClick={clearAllFilters}
     className="text-muted-foreground hover:text-foreground hover:bg-accent px-4 py-2 transition-colors"
     >
     <X className="w-4 h-4 mr-2" />
     Clear All Filters
     </Button>
    </div>
    )}
   </div>
   </div>
  </CollapsibleContent>
  </Collapsible>
 </div>
 );
};

export default PlantSearchFilters;

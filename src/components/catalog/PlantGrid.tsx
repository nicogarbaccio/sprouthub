import { Sprout, X } from "lucide-react";
import { PlantCardSkeleton } from "@/components/ui/skeleton";
import PlantCard from "../PlantCard";
import { Plant } from "@/data/plantData";
import { cn } from "@/lib/utils";
import { CascadingContainer } from "@/components/ui/cascading-container";

interface PlantGridProps {
 plants: Plant[];
 onAddToCollection: (plant: Plant) => void;
 onViewDetails: (plantName: string) => void;
 hasActiveFilters: boolean;
 clearAllFilters: () => void;
 isLoading?: boolean;
 isChangingPage?: boolean;
 isAuthenticated?: boolean;
 onSignInToAdd?: () => void;
}

const PlantGrid = ({
 plants,
 onAddToCollection,
 onViewDetails,
 hasActiveFilters,
 clearAllFilters,
 isLoading = false,
 isChangingPage = false,
 isAuthenticated = false,
 onSignInToAdd,
}: PlantGridProps) => {
 // Show skeleton during loading or page changes
 if (isLoading || isChangingPage) {
 return (
  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 md:gap-3.5">
  {Array.from({ length: 12 }).map((_, index) => (
   <PlantCardSkeleton key={index} />
  ))}
  </div>
 );
 }

 if (plants.length === 0) {
 return (
  <div className="rounded-tile bg-card p-10 text-center animate-fade-in" data-testid="no-results">
  <Sprout className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-60" />
  <h3 className="font-display text-xl font-bold text-foreground mb-1">No plants found</h3>
  <p className="text-muted-foreground mb-5">Try a different search or fewer filters.</p>
  {hasActiveFilters && (
   <button
   type="button"
   onClick={clearAllFilters}
   className="h-11 px-5 rounded-full bg-foreground text-background font-bold text-sm inline-flex items-center gap-1.5"
   >
   <X className="h-4 w-4" />
   Clear All Filters
   </button>
  )}
  </div>
 );
 }

 return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 md:gap-3.5 transition-all duration-300"
      )}
      data-testid="plant-grid"
    >
      {plants.map((plant, index) => (
        <CascadingContainer
          key={`${plant.name}-${index}`}
          delay={index * 10}
          className="h-full"
        >
          <PlantCard
            {...plant}
            onAddToCollection={() => onAddToCollection(plant)}
            onViewDetails={() => onViewDetails(plant.name)}
            isAuthenticated={isAuthenticated}
            onSignInToAdd={onSignInToAdd}
          />
        </CascadingContainer>
      ))}
    </div>
 );
};

export default PlantGrid;

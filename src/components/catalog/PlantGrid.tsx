import { Button } from "@/components/ui/button";
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
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {Array.from({ length: 24 }).map((_, index) => (
   <PlantCardSkeleton key={index} />
  ))}
  </div>
 );
 }

 if (plants.length === 0) {
 return (
  <div className="text-center py-12 animate-fade-in" data-testid="no-results">
  <div className="mb-4">
   <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-plant-secondary/20 flex items-center justify-center">
   <span className="text-2xl">🌱</span>
   </div>
   <p className="text-muted-foreground text-lg mb-4">
   No plants found matching your criteria.
   </p>
   <p className="text-muted-foreground/70 text-sm mb-6">
   Try adjusting your filters or search terms to find more plants.
   </p>
  </div>
  {hasActiveFilters && (
   <Button
   variant="outline"
   onClick={clearAllFilters}
   className="border-plant-secondary/30 hover:bg-plant-secondary/10 transition-all duration-200"
   >
   Clear All Filters
   </Button>
  )}
  </div>
 );
 }

 return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-all duration-300"
      )}
      data-testid="plant-grid"
    >
      {plants.map((plant, index) => (
        <CascadingContainer
          key={`${plant.name}-${index}`}
          delay={index * 10}
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

import { Badge } from "@/components/ui/badge";

interface PlantResultsSummaryProps {
 filteredCount: number;
 totalCount: number;
 hasActiveFilters: boolean;
 startItem?: number;
 endItem?: number;
 isPaginated?: boolean;
}

const PlantResultsSummary = ({
 filteredCount,
 totalCount,
 hasActiveFilters,
 startItem,
 endItem,
 isPaginated = false,
}: PlantResultsSummaryProps) => {
 const displayText =
 isPaginated && startItem && endItem
  ? `Showing ${startItem}-${endItem} of ${filteredCount} plants`
  : `Showing ${filteredCount} of ${totalCount} plants`;

 return (
 <div className="mb-6 text-center" data-testid="results-summary">
  <p className="text-muted-foreground">
  {displayText}
  {hasActiveFilters && (
   <span className="ml-2">
   <Badge variant="outline" className="border-plant-secondary/30">
    Filtered
   </Badge>
   </span>
  )}
  </p>
 </div>
 );
};

export default PlantResultsSummary;

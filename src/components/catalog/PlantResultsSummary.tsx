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
  ? `Showing ${startItem}–${endItem} of ${filteredCount} plants`
  : `Showing ${filteredCount} of ${totalCount} plants`;

 return (
 <div className="flex items-center gap-2 px-1.5 lg:px-1 mb-3" data-testid="results-summary">
  <p className="text-sm font-semibold text-muted-foreground">{displayText}</p>
  {hasActiveFilters && (
  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sprout-cream text-sprout-dark">
   Filtered
  </span>
  )}
 </div>
 );
};

export default PlantResultsSummary;

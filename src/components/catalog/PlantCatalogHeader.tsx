interface PlantCatalogHeaderProps {
  isHomepage?: boolean;
  totalPlants?: number;
  categoryCount?: number;
}

const PlantCatalogHeader = ({ isHomepage = false, totalPlants }: PlantCatalogHeaderProps) => {
  if (isHomepage) {
    return (
      <div className="text-center mb-8">
        <h2 className="font-display text-[28px] md:text-[40px] font-bold tracking-[-0.04em] text-foreground">
          Find your next <span className="text-sprout-success">green</span> companion
        </h2>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mt-2">
          Browse our catalog of indoor plants with detailed care guides and growing tips.
        </p>
      </div>
    );
  }

  return (
    <div className="px-1.5 lg:px-0">
      <h1 className="font-display text-[28px] lg:text-[34px] font-bold tracking-[-0.04em] text-foreground">
        Plant Catalog
      </h1>
      <p className="text-sm lg:text-[15px] font-medium text-muted-foreground mt-0.5">
        {totalPlants ? `${totalPlants} plants` : "Plants"} with care guides and growing tips. Find your next green companion.
      </p>
    </div>
  );
};

export default PlantCatalogHeader;

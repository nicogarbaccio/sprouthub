import { Search } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";

interface PlantCatalogHeaderProps {
  isHomepage?: boolean;
  totalPlants?: number;
  categoryCount?: number;
}

const PlantCatalogHeader = ({
  isHomepage = false,
  totalPlants,
  categoryCount,
}: PlantCatalogHeaderProps) => {
  if (isHomepage) {
    return (
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Find your next <span className="text-sprout-success">green</span>{" "}
          companion
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Browse our extensive catalog of indoor plants with detailed care guides
          and growing tips.
        </p>
      </div>
    );
  }

  return (
    <PageHero
      icon={Search}
      title={
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Find your next{" "}
          <span className="text-sprout-cream">green</span> companion
        </h1>
      }
      subtitle="Browse our extensive catalog of indoor plants with detailed care guides and growing tips."
      stats={[]}
    />
  );
};

export default PlantCatalogHeader;

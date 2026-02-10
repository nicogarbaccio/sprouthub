import { Plus, Droplets, Flower2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CascadingContainer } from "@/components/ui/cascading-container";

interface QuickActionsProps {
  plantsNeedingWaterCount: number;
  onAddPlantClick: () => void;
  onWaterPlantsClick: () => void;
  onViewAllPlantsClick: () => void;
}

export const QuickActions = ({
  plantsNeedingWaterCount,
  onAddPlantClick,
  onWaterPlantsClick,
  onViewAllPlantsClick,
}: QuickActionsProps) => {
  const handleWaterButtonClick = () => {
    if (plantsNeedingWaterCount > 0) {
      onWaterPlantsClick();
    } else {
      onViewAllPlantsClick();
    }
  };

  return (
    <CascadingContainer delay={100}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Button
          onClick={onAddPlantClick}
          className="h-16 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-medium text-lg"
          size="lg"
        >
          <Plus className="w-6 h-6 mr-3" />
          Add New Plant
        </Button>

        <Button
          className="h-16 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white hover:text-white rounded-xl font-medium text-lg border-0"
          size="lg"
          onClick={handleWaterButtonClick}
        >
          {plantsNeedingWaterCount > 0 ? (
            <>
              <Droplets className="w-6 h-6 mr-3" />
              Water {plantsNeedingWaterCount} Plant
              {plantsNeedingWaterCount > 1 ? "s" : ""}
            </>
          ) : (
            <>
              <Flower2 className="w-6 h-6 mr-3" />
              View All Plants
            </>
          )}
        </Button>
      </div>
    </CascadingContainer>
  );
};

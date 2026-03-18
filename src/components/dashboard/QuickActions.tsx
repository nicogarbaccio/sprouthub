import { Plus, Droplets, Flower2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { Badge } from "@/components/ui/badge";

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
        {/* Add New Plant Button */}
        <Button
          onClick={onAddPlantClick}
          className="relative h-20 overflow-hidden bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 text-white rounded-2xl font-semibold text-lg shadow-lg transition-transform duration-300 border-0 active:scale-[0.98]"
          size="lg"
        >
          <div className="flex items-center justify-center gap-3">
            <Plus className="w-7 h-7" />
            <span>Add New Plant</span>
          </div>
        </Button>

        {/* Water Plants / View All Plants Button */}
        <Button
          className="relative h-20 overflow-hidden bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 text-white rounded-2xl font-semibold text-lg border-0 shadow-lg transition-transform duration-300 active:scale-[0.98]"
          size="lg"
          onClick={handleWaterButtonClick}
        >
          {plantsNeedingWaterCount > 0 ? (
            <div className="flex items-center justify-center gap-3">
              <Droplets className="w-7 h-7" />
              <span className="flex items-center gap-2">
                Water {plantsNeedingWaterCount} Plant
                {plantsNeedingWaterCount > 1 ? "s" : ""}
                <Badge className="ml-1 bg-white/20 hover:bg-white/30 text-white border-white/40 px-2 py-0.5 text-sm font-bold">
                  {plantsNeedingWaterCount}
                </Badge>
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <Flower2 className="w-7 h-7" />
              <span>View All Plants</span>
            </div>
          )}
        </Button>
      </div>
    </CascadingContainer>
  );
};

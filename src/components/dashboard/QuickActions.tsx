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
          className="group relative h-20 overflow-hidden bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 hover:from-green-600 hover:via-emerald-600 hover:to-green-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-2xl transition-all duration-300 border-0 hover:scale-[1.02] active:scale-[0.98]"
          size="lg"
        >
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-green-400/0 group-hover:bg-green-400/20 blur-xl transition-all duration-300" />

          <div className="relative flex items-center justify-center gap-3">
            {/* Animated icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-white/30 rounded-full blur-md group-hover:animate-pulse" />
              <Plus className="w-7 h-7 relative transform group-hover:rotate-90 transition-transform duration-300" />
            </div>

            <span className="relative">Add New Plant</span>
          </div>
        </Button>

        {/* Water Plants / View All Plants Button */}
        <Button
          className="group relative h-20 overflow-hidden bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 hover:from-cyan-600 hover:via-blue-600 hover:to-cyan-600 text-white hover:text-white rounded-2xl font-semibold text-lg border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          size="lg"
          onClick={handleWaterButtonClick}
        >
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-cyan-400/0 group-hover:bg-cyan-400/20 blur-xl transition-all duration-300" />

          {plantsNeedingWaterCount > 0 ? (
            <div className="relative flex items-center justify-center gap-3">
              {/* Animated water droplet icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-md group-hover:animate-pulse" />
                <Droplets className="w-7 h-7 relative transform group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300" />
              </div>

              <span className="relative flex items-center gap-2">
                Water {plantsNeedingWaterCount} Plant
                {plantsNeedingWaterCount > 1 ? "s" : ""}

                {/* Animated badge */}
                <Badge className="ml-1 bg-white/20 hover:bg-white/30 text-white border-white/40 px-2 py-0.5 text-sm font-bold">
                  {plantsNeedingWaterCount}
                </Badge>
              </span>
            </div>
          ) : (
            <div className="relative flex items-center justify-center gap-3">
              {/* Animated flower icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-md group-hover:animate-pulse" />
                <Flower2 className="w-7 h-7 relative transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
              </div>

              <span className="relative">View All Plants</span>
            </div>
          )}
        </Button>
      </div>
    </CascadingContainer>
  );
};

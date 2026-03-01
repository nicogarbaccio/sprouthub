import {
  Calendar,
  Droplets,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PlantImage from "@/components/ui/plant-image";
import { calculateWateringSchedule } from "@/utils/watering/schedule";
import { getPlantImageUrl } from "@/utils/plants/images";
import type { UserPlant } from "@/hooks/useUserPlants";

interface DashboardTodaysTasksProps {
  plantsNeedingWater: UserPlant[];
  onQuickWater: (plantId: string, plantName: string) => void;
  onNavigate: (path: string) => void;
}

export function DashboardTodaysTasks({
  plantsNeedingWater,
  onQuickWater,
  onNavigate,
}: DashboardTodaysTasksProps) {
  return (
    <Card
      id="todays-tasks"
      data-testid="todays-tasks-card"
      className="border-2 border-border/50 hover:border-border transition-all duration-300 bg-gradient-to-br from-background to-muted/10"
    >
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-foreground">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mr-3 shadow-lg">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold">Today's Tasks</div>
            <div className="text-sm font-normal text-muted-foreground">
              {plantsNeedingWater.length === 0
                ? "All caught up!"
                : `${plantsNeedingWater.length} plant${plantsNeedingWater.length > 1 ? "s" : ""} need attention`}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {plantsNeedingWater.length === 0 ? (
          <div
            data-testid="no-tasks-message"
            className="text-center py-12 relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50/50 dark:from-emerald-900/20 dark:to-green-900/10 border-2 border-emerald-200/50 dark:border-emerald-700/30"
          >
            {/* Decorative gradient blob */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-green-400/10 rounded-full blur-2xl" />

            <div className="relative">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 mb-4 shadow-lg">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                All Caught Up!
              </p>
              <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
                No plants need watering today
              </p>
            </div>
          </div>
        ) : (
          <div data-testid="tasks-list" className="space-y-3">
            {plantsNeedingWater.slice(0, 5).map((plant) => {
              const wateringCalc = calculateWateringSchedule(plant);
              const isOverdue = wateringCalc.isOverdue;

              return (
                <div
                  key={plant.id}
                  data-testid={`task-item-${plant.id}`}
                  className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                    isOverdue
                      ? "border-red-300/50 dark:border-red-600/40 hover:border-red-400 dark:hover:border-red-500 bg-gradient-to-br from-red-50/50 to-rose-50/30 dark:from-red-900/20 dark:to-rose-900/10"
                      : "border-cyan-300/50 dark:border-cyan-600/40 hover:border-cyan-400 dark:hover:border-cyan-500 bg-gradient-to-br from-cyan-50/50 to-blue-50/30 dark:from-cyan-900/20 dark:to-blue-900/10"
                  }`}
                >
                  {/* Decorative gradient blob */}
                  <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${
                    isOverdue
                      ? "bg-gradient-to-br from-red-400/20 to-rose-400/10"
                      : "bg-gradient-to-br from-cyan-400/20 to-blue-400/10"
                  }`} />

                  <div className="flex items-center justify-between p-4 relative gap-3">
                    <div
                      className="flex items-center space-x-4 flex-1 min-w-0 cursor-pointer"
                      onClick={() => onNavigate(`/my-plants/${plant.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onNavigate(`/my-plants/${plant.id}`);
                        }
                      }}
                      aria-label={`View details for ${plant.nickname}`}
                    >
                      {/* Plant Image with gradient overlay */}
                      <div className="relative group/image shrink-0">
                        <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
                          isOverdue
                            ? "bg-gradient-to-br from-red-500/20 to-rose-500/20 group-hover/image:from-red-500/30 group-hover/image:to-rose-500/30"
                            : "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 group-hover/image:from-cyan-500/30 group-hover/image:to-blue-500/30"
                        }`} />
                        <PlantImage
                          src={getPlantImageUrl(
                            plant.image,
                            plant.plant_type,
                            ""
                          )}
                          fallbackSrc="https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=60&h=60&fit=crop"
                          alt={plant.nickname}
                          className="w-14 h-14 rounded-full object-cover relative ring-2 ring-white/50 dark:ring-gray-800/50 group-hover/image:scale-110 transition-transform duration-300"
                        />
                      </div>

                      {/* Plant Info */}
                      <div className="flex-1 min-w-0 group-hover:translate-x-1 transition-transform duration-300">
                        <p className="font-semibold text-foreground text-base mb-0.5 truncate">
                          {plant.nickname}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {plant.plant_type}
                        </p>
                        {isOverdue ? (
                          <Badge
                            data-testid={`overdue-badge-${plant.id}`}
                            className="text-xs px-3 py-1 mt-1 bg-gradient-to-r from-red-600 to-rose-600 text-white border-0 shadow-md"
                          >
                            <AlertTriangle className="w-3 h-3 mr-1 inline" />
                            {Math.abs(wateringCalc.daysUntilWatering)} day{Math.abs(wateringCalc.daysUntilWatering) > 1 ? "s" : ""} overdue
                          </Badge>
                        ) : (
                          <Badge
                            data-testid={`due-today-badge-${plant.id}`}
                            className="text-xs px-3 py-1 mt-1 bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-0 shadow-md"
                          >
                            Due today
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Water Button */}
                    <div className="flex items-center shrink-0">
                      <Button
                        data-testid={`quick-water-button-${plant.id}`}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickWater(plant.id, plant.nickname);
                        }}
                        className="relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 bg-sprout-water hover:bg-sprout-water/90 text-white"
                      >
                        <Droplets className="w-4 h-4 group-hover:animate-bounce" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress indicator for multiple plants */}
                  {plantsNeedingWater.length > 1 && (
                    <div className={`h-1 w-full ${
                      isOverdue
                        ? "bg-red-200/30 dark:bg-red-800/30"
                        : "bg-cyan-200/30 dark:bg-cyan-800/30"
                    }`}>
                      <div
                        className={`h-1 transition-all duration-700 ${
                          isOverdue
                            ? "bg-gradient-to-r from-red-500 to-rose-500"
                            : "bg-gradient-to-r from-cyan-500 to-blue-500"
                        }`}
                        style={{ width: `${((plantsNeedingWater.indexOf(plant) + 1) / plantsNeedingWater.length) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {plantsNeedingWater.length > 5 && (
              <div className="text-center py-3 px-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50">
                <p className="text-sm font-medium text-muted-foreground">
                  +{plantsNeedingWater.length - 5} more plant{plantsNeedingWater.length - 5 > 1 ? "s" : ""} need attention
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

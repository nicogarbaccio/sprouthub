import {
  Activity,
  Droplets,
  Clock,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PlantImage from "@/components/ui/plant-image";
import { formatDistanceToNow } from "date-fns";
import { getPlantImageUrl } from "@/utils/plantImageUtils";

interface DashboardRecentActivityProps {
  recentlyWateredPlants: any[]; // UserPlant array
}

export function DashboardRecentActivity({
  recentlyWateredPlants,
}: DashboardRecentActivityProps) {
  return (
    <Card data-testid="recent-activity-card" className="border-2 border-border/50 hover:border-border transition-all duration-300 bg-gradient-to-br from-background to-muted/10">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-foreground">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sprout-primary to-sprout-medium flex items-center justify-center mr-3 shadow-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold">Recent Activity</div>
            <div className="text-sm font-normal text-muted-foreground">
              {recentlyWateredPlants.length === 0
                ? "No activity yet"
                : `${recentlyWateredPlants.length} recent action${recentlyWateredPlants.length > 1 ? "s" : ""}`}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentlyWateredPlants.length === 0 ? (
          <div
            data-testid="no-recent-activity"
            className="text-center py-12 relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/10 border-2 border-sprout-primary/30 dark:border-sprout-medium/30"
          >
            {/* Decorative gradient blob */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-400/10 rounded-full blur-2xl" />

            <div className="relative">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-sprout-primary to-sprout-medium mb-4 shadow-lg">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <p className="text-lg font-semibold text-sprout-primary dark:text-sprout-light mb-1">
                No Activity Yet
              </p>
              <p className="text-sm text-sprout-medium dark:text-sprout-light/80">
                Start caring for your plants!
              </p>
            </div>
          </div>
        ) : (
          <div data-testid="recent-activity-list" className="space-y-1 relative">
            {/* Timeline connector line - centered behind icons, stops before last item */}
            {recentlyWateredPlants.length > 1 && (
              <div className="absolute left-[38px] top-[38px] bottom-[calc(1.25rem+44px)] w-0.5 bg-gradient-to-b from-cyan-300 via-blue-300 to-cyan-300 dark:from-cyan-600 dark:via-blue-600 dark:to-cyan-600 opacity-30" />
            )}

            {recentlyWateredPlants.map((plant, index) => (
              <div
                key={plant.id}
                data-testid={`recent-activity-item-${plant.id}`}
                className="group relative flex items-start gap-4 p-4 hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-blue-50/30 dark:hover:from-cyan-900/20 dark:hover:to-blue-900/10 rounded-xl transition-all duration-300 hover:shadow-md"
                style={{
                  animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`
                }}
              >
                {/* Timeline dot with icon */}
                <div className="relative flex-shrink-0 z-10">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg ring-4 ring-background group-hover:scale-110 transition-transform duration-300">
                    <Droplets className="w-5 h-5 text-white" />
                  </div>
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-50 blur-md transition-opacity duration-300" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Plant Image */}
                    <div className="relative group/image">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 group-hover/image:from-cyan-500/30 group-hover/image:to-blue-500/30 transition-all duration-300" />
                      <PlantImage
                        src={getPlantImageUrl(
                          plant.image,
                          plant.plant_type,
                          ""
                        )}
                        fallbackSrc="https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=40&h=40&fit=crop"
                        alt={plant.nickname}
                        className="w-10 h-10 rounded-full object-cover relative ring-2 ring-white/50 dark:ring-gray-800/50 group-hover/image:scale-110 transition-transform duration-300"
                      />
                    </div>

                    {/* Action description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:translate-x-1 transition-transform duration-300">
                        Watered{" "}
                        <span className="font-bold text-sprout-success dark:text-sprout-success">
                          {plant.nickname}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(
                          new Date(plant.latest_watering!),
                          { addSuffix: true }
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Achievement milestone for first watering */}
                  {index === recentlyWateredPlants.length - 1 && recentlyWateredPlants.length === 1 && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-cyan-600 dark:text-cyan-400">
                      <Sparkles className="w-3 h-3" />
                      <span className="font-medium">First activity!</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

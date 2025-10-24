import { Flower2, Droplets, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CascadingContainer } from "@/components/ui/cascading-container";

interface CareStatusOverviewProps {
  totalPlants: number;
  plantsNeedingWaterToday: number;
  overduePlants: number;
  recentlyAddedCount: number;
}

export const CareStatusOverview = ({
  totalPlants,
  plantsNeedingWaterToday,
  overduePlants,
  recentlyAddedCount,
}: CareStatusOverviewProps) => {
  return (
    <CascadingContainer delay={200}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-border hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Plants
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {totalPlants}
                </p>
              </div>
              <div className="w-12 h-12 bg-plant-secondary/20 dark:bg-plant-primary/20 rounded-full flex items-center justify-center">
                <Flower2 className="w-6 h-6 text-plant-primary dark:text-plant-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Need Water Today
                </p>
                <p className="text-3xl font-bold text-sprout-warning">
                  {plantsNeedingWaterToday}
                </p>
              </div>
              <div className="w-12 h-12 bg-sprout-warning/20 rounded-full flex items-center justify-center">
                <Droplets className="w-6 h-6 text-sprout-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Overdue
                </p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {overduePlants}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-between">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  New This Week
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {recentlyAddedCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CascadingContainer>
  );
};

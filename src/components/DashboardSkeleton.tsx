import {
  DashboardMetricSkeleton,
  DashboardTaskSkeleton,
  DashboardActivitySkeleton,
  Skeleton,
} from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

export const DashboardSkeleton = () => {
  return (
    <div className="py-8 bg-background min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-10 w-80 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>

        {/* Quick Actions Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Skeleton className="h-16 rounded-xl bg-primary/5 border border-border" />
          <Skeleton className="h-16 rounded-xl bg-primary/5 border border-border" />
        </div>

        {/* Care Status Overview Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardMetricSkeleton />
          <DashboardMetricSkeleton />
          <DashboardMetricSkeleton />
          <DashboardMetricSkeleton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Today's Tasks Skeleton */}
          <Card className="border-border bg-primary/5">
            <CardHeader>
              <div className="flex items-center">
                <Skeleton className="w-5 h-5 mr-2 rounded-full" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <DashboardTaskSkeleton />
                <DashboardTaskSkeleton />
                <DashboardTaskSkeleton />
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Skeleton */}
          <Card className="border-border bg-primary/5">
            <CardHeader>
              <div className="flex items-center">
                <Skeleton className="w-5 h-5 mr-2 rounded-full" />
                <Skeleton className="h-6 w-36" />
              </div>
              <Skeleton className="h-4 w-52" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <DashboardActivitySkeleton />
                <DashboardActivitySkeleton />
                <DashboardActivitySkeleton />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plant Health Insights Skeleton */}
        <Card className="border-border mb-8 bg-primary/5">
          <CardHeader>
            <div className="flex items-center">
              <Skeleton className="w-5 h-5 mr-2 rounded-full" />
              <Skeleton className="h-6 w-44" />
            </div>
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-6 w-28" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Favorite Plants Skeleton */}
        <Card className="border-border bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <Skeleton className="w-5 h-5 mr-2 rounded-full" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-4 w-48 mt-2" />
              </div>
              <Skeleton className="h-10 w-24 rounded-xl" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-primary/5 border border-border rounded-lg"
                >
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

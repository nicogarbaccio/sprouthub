import {
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
          <Skeleton className="h-9 md:h-10 w-64 md:w-80 mb-2" />
          <Skeleton className="h-6 md:h-7 w-72 md:w-96" />
        </div>

        {/* Quick Actions Skeleton - Updated to match new gradient buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Skeleton className="h-20 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10" />
          <Skeleton className="h-20 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10" />
        </div>

        {/* Care Status Overview Skeleton - Updated to match new card design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Plants Card Skeleton - Emerald theme */}
          <Card className="relative overflow-hidden border-2 border-emerald-300/50 dark:border-emerald-600/40 bg-gradient-to-br from-emerald-50 to-green-50/50 dark:from-emerald-900/30 dark:to-green-900/20">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-green-400/10 rounded-full blur-2xl" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-10 w-16" />
                </div>
                <Skeleton className="w-14 h-14 rounded-2xl" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>

          {/* Need Water Today Card Skeleton - Cyan theme */}
          <Card className="relative overflow-hidden border-2 border-cyan-300/50 dark:border-cyan-600/40 bg-gradient-to-br from-cyan-50 to-blue-50/50 dark:from-cyan-900/30 dark:to-blue-900/20">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-blue-400/10 rounded-full blur-2xl" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Skeleton className="h-3 w-24 mb-2" />
                  <Skeleton className="h-10 w-12" />
                </div>
                <Skeleton className="w-14 h-14 rounded-2xl" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full mb-2" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>

          {/* Overdue Card Skeleton - Red theme */}
          <Card className="relative overflow-hidden border-2 border-gray-300/50 dark:border-gray-600/40 bg-gradient-to-br from-gray-50 to-slate-50/50 dark:from-gray-900/30 dark:to-slate-900/20">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-gray-400/20 to-slate-400/10 rounded-full blur-2xl" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-10 w-10" />
                </div>
                <Skeleton className="w-14 h-14 rounded-2xl" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full mb-2" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>

          {/* New This Week Card Skeleton - Purple theme */}
          <Card className="relative overflow-hidden border-2 border-purple-300/50 dark:border-purple-600/40 bg-gradient-to-br from-purple-50 to-pink-50/50 dark:from-purple-900/30 dark:to-pink-900/20">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/10 rounded-full blur-2xl" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Skeleton className="h-3 w-24 mb-2" />
                  <Skeleton className="h-10 w-12" />
                </div>
                <Skeleton className="w-14 h-14 rounded-2xl" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Today's Tasks Skeleton - Updated to match new design */}
          <Card className="border-2 border-border/50 bg-gradient-to-br from-background to-muted/10">
            <CardHeader className="pb-4">
              <div className="flex items-center text-foreground">
                <Skeleton className="w-10 h-10 rounded-xl mr-3" />
                <div className="flex-1">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <DashboardTaskSkeleton />
                <DashboardTaskSkeleton />
                <DashboardTaskSkeleton />
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Skeleton - Updated to match new design */}
          <Card className="border-2 border-border/50 bg-gradient-to-br from-background to-muted/10">
            <CardHeader className="pb-4">
              <div className="flex items-center text-foreground">
                <Skeleton className="w-10 h-10 rounded-xl mr-3" />
                <div className="flex-1">
                  <Skeleton className="h-6 w-36 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
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

        {/* Plant Health Insights Skeleton - Updated to match new design */}
        <Card className="border-2 border-border/50 mb-8 bg-gradient-to-br from-background to-muted/10">
          <CardHeader className="pb-4">
            <div className="flex items-center text-foreground">
              <Skeleton className="w-10 h-10 rounded-xl mr-3" />
              <div className="flex-1">
                <Skeleton className="h-6 w-44 mb-2" />
                <Skeleton className="h-4 w-60" />
              </div>
            </div>
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

        {/* Favorite Plants Skeleton - Updated to match new design */}
        <Card className="border-2 border-border/50 bg-gradient-to-br from-background to-muted/10">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-foreground">
                <Skeleton className="w-10 h-10 rounded-xl mr-3" />
                <div className="flex-1">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-10 w-24 rounded-xl" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-muted/20 border-2 border-border/50 rounded-xl"
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

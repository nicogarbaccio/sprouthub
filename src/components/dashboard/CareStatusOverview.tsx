import { Flower2, Droplets, AlertTriangle, TrendingUp, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { Badge } from "@/components/ui/badge";

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
        {/* Total Plants - Green/Emerald Theme */}
        <Card className="group relative overflow-hidden border-2 border-emerald-300/50 dark:border-emerald-600/40 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-emerald-50 to-green-50/50 dark:from-emerald-900/30 dark:to-green-900/20">
          {/* Decorative gradient blob */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-green-400/10 rounded-full blur-2xl" />

          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Total Plants
                </p>
                <p className="text-4xl font-bold bg-gradient-to-br from-emerald-700 to-green-700 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent tabular-nums">
                  {totalPlants}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <Flower2 className="w-7 h-7 text-white" />
              </div>
            </div>

            {/* Progress indicator */}
            <div className="w-full bg-emerald-200/30 dark:bg-emerald-800/30 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-green-500 h-1.5 rounded-full transition-all duration-700"
                style={{ width: '100%' }}
              />
            </div>

            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
              Your growing collection
            </p>
          </CardContent>
        </Card>

        {/* Need Water Today - Blue/Cyan Theme */}
        <Card className={`group relative overflow-hidden border-2 transition-all duration-300 ${
          plantsNeedingWaterToday > 0
            ? 'border-cyan-300/50 dark:border-cyan-600/40 hover:border-cyan-400 dark:hover:border-cyan-500 bg-gradient-to-br from-cyan-50 to-blue-50/50 dark:from-cyan-900/30 dark:to-blue-900/20'
            : 'border-gray-300/50 dark:border-gray-600/40 hover:border-gray-400 dark:hover:border-gray-500 bg-gradient-to-br from-gray-50 to-slate-50/50 dark:from-gray-900/30 dark:to-slate-900/20'
        } hover:shadow-2xl`}>
          {/* Decorative gradient blob */}
          <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl ${
            plantsNeedingWaterToday > 0
              ? 'bg-gradient-to-br from-cyan-400/20 to-blue-400/10'
              : 'bg-gradient-to-br from-gray-400/20 to-slate-400/10'
          }`} />

          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className={`text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1 ${
                  plantsNeedingWaterToday > 0
                    ? 'text-cyan-700 dark:text-cyan-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  <Droplets className="w-3 h-3" />
                  Need Water Today
                </p>
                <p className={`text-4xl font-bold bg-gradient-to-br bg-clip-text text-transparent tabular-nums ${
                  plantsNeedingWaterToday > 0
                    ? 'from-cyan-700 to-blue-700 dark:from-cyan-400 dark:to-blue-400'
                    : 'from-gray-600 to-slate-600 dark:from-gray-400 dark:to-slate-400'
                }`}>
                  {plantsNeedingWaterToday}
                </p>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 ${
                plantsNeedingWaterToday > 0
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-500 group-hover:rotate-6'
                  : 'bg-gradient-to-br from-gray-400 to-slate-400'
              }`}>
                <Droplets className="w-7 h-7 text-white" />
              </div>
            </div>

            {/* Progress indicator */}
            {totalPlants > 0 && (
              <div className={`w-full rounded-full h-1.5 overflow-hidden ${
                plantsNeedingWaterToday > 0
                  ? 'bg-cyan-200/30 dark:bg-cyan-800/30'
                  : 'bg-gray-200/30 dark:bg-gray-800/30'
              }`}>
                <div
                  className={`h-1.5 rounded-full transition-all duration-700 ${
                    plantsNeedingWaterToday > 0
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                      : 'bg-gradient-to-r from-gray-400 to-slate-400'
                  }`}
                  style={{ width: `${(plantsNeedingWaterToday / totalPlants) * 100}%` }}
                />
              </div>
            )}

            <p className={`text-xs mt-2 font-medium ${
              plantsNeedingWaterToday > 0
                ? 'text-cyan-600 dark:text-cyan-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {plantsNeedingWaterToday > 0 ? 'Scheduled for today' : 'All caught up!'}
            </p>
          </CardContent>
        </Card>

        {/* Overdue - Red/Rose Theme with Pulse */}
        <Card className={`group relative overflow-hidden border-2 transition-all duration-300 ${
          overduePlants > 0
            ? 'border-red-300/50 dark:border-red-600/40 hover:border-red-400 dark:hover:border-red-500 bg-gradient-to-br from-red-50 to-rose-50/50 dark:from-red-900/30 dark:to-rose-900/20 animate-pulse'
            : 'border-gray-300/50 dark:border-gray-600/40 hover:border-gray-400 dark:hover:border-gray-500 bg-gradient-to-br from-gray-50 to-slate-50/50 dark:from-gray-900/30 dark:to-slate-900/20'
        } hover:shadow-2xl`}>
          {/* Decorative gradient blob */}
          <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl ${
            overduePlants > 0
              ? 'bg-gradient-to-br from-red-400/20 to-rose-400/10'
              : 'bg-gradient-to-br from-gray-400/20 to-slate-400/10'
          }`} />

          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className={`text-xs font-semibold uppercase tracking-wide flex items-center gap-1 ${
                    overduePlants > 0
                      ? 'text-red-700 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    <AlertTriangle className="w-3 h-3" />
                    Overdue
                  </p>
                  {overduePlants > 0 && (
                    <Badge className="bg-gradient-to-r from-red-600 to-rose-600 text-white border-0 text-xs px-1.5 py-0">
                      Urgent
                    </Badge>
                  )}
                </div>
                <p className={`text-4xl font-bold bg-gradient-to-br bg-clip-text text-transparent tabular-nums ${
                  overduePlants > 0
                    ? 'from-red-700 to-rose-700 dark:from-red-400 dark:to-rose-400'
                    : 'from-gray-600 to-slate-600 dark:from-gray-400 dark:to-slate-400'
                }`}>
                  {overduePlants}
                </p>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 ${
                overduePlants > 0
                  ? 'bg-gradient-to-br from-red-500 to-rose-500 group-hover:rotate-12'
                  : 'bg-gradient-to-br from-gray-400 to-slate-400'
              }`}>
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
            </div>

            {/* Progress indicator */}
            {totalPlants > 0 && (
              <div className={`w-full rounded-full h-1.5 overflow-hidden ${
                overduePlants > 0
                  ? 'bg-red-200/30 dark:bg-red-800/30'
                  : 'bg-gray-200/30 dark:bg-gray-800/30'
              }`}>
                <div
                  className={`h-1.5 rounded-full transition-all duration-700 ${
                    overduePlants > 0
                      ? 'bg-gradient-to-r from-red-500 to-rose-500'
                      : 'bg-gradient-to-r from-gray-400 to-slate-400'
                  }`}
                  style={{ width: `${(overduePlants / totalPlants) * 100}%` }}
                />
              </div>
            )}

            <p className={`text-xs mt-2 font-medium ${
              overduePlants > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {overduePlants > 0 ? 'Needs attention now' : 'Nothing overdue'}
            </p>
          </CardContent>
        </Card>

        {/* New This Week - Purple/Pink Theme */}
        <Card className={`group relative overflow-hidden border-2 transition-all duration-300 ${
          recentlyAddedCount > 0
            ? 'border-purple-300/50 dark:border-purple-600/40 hover:border-purple-400 dark:hover:border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50/50 dark:from-purple-900/30 dark:to-pink-900/20'
            : 'border-gray-300/50 dark:border-gray-600/40 hover:border-gray-400 dark:hover:border-gray-500 bg-gradient-to-br from-gray-50 to-slate-50/50 dark:from-gray-900/30 dark:to-slate-900/20'
        } hover:shadow-2xl`}>
          {/* Decorative gradient blob */}
          <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl ${
            recentlyAddedCount > 0
              ? 'bg-gradient-to-br from-purple-400/20 to-pink-400/10'
              : 'bg-gradient-to-br from-gray-400/20 to-slate-400/10'
          }`} />

          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className={`text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1 ${
                  recentlyAddedCount > 0
                    ? 'text-purple-700 dark:text-purple-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  <TrendingUp className="w-3 h-3" />
                  New This Week
                </p>
                <p className={`text-4xl font-bold bg-gradient-to-br bg-clip-text text-transparent tabular-nums ${
                  recentlyAddedCount > 0
                    ? 'from-purple-700 to-pink-700 dark:from-purple-400 dark:to-pink-400'
                    : 'from-gray-600 to-slate-600 dark:from-gray-400 dark:to-slate-400'
                }`}>
                  {recentlyAddedCount}
                </p>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 ${
                recentlyAddedCount > 0
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 group-hover:-rotate-6'
                  : 'bg-gradient-to-br from-gray-400 to-slate-400'
              }`}>
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
            </div>

            {/* Progress indicator */}
            {totalPlants > 0 && (
              <div className={`w-full rounded-full h-1.5 overflow-hidden ${
                recentlyAddedCount > 0
                  ? 'bg-purple-200/30 dark:bg-purple-800/30'
                  : 'bg-gray-200/30 dark:bg-gray-800/30'
              }`}>
                <div
                  className={`h-1.5 rounded-full transition-all duration-700 ${
                    recentlyAddedCount > 0
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                      : 'bg-gradient-to-r from-gray-400 to-slate-400'
                  }`}
                  style={{ width: `${Math.min((recentlyAddedCount / totalPlants) * 100, 100)}%` }}
                />
              </div>
            )}

            <p className={`text-xs mt-2 font-medium ${
              recentlyAddedCount > 0
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {recentlyAddedCount > 0 ? 'Growing your collection' : 'No new additions'}
            </p>
          </CardContent>
        </Card>
      </div>
    </CascadingContainer>
  );
};

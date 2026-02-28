import {
  Target,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Clock,
  Droplets,
  Flower2,
  CheckCircle,
  CheckCircle2,
  Star,
  Plus,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CascadingContainer } from "@/components/ui/cascading-container";

interface DashboardHealthInsightsProps {
  totalPlants: number;
  plantsWithoutWateringData: number;
  overduePlants: number;
  plantsNeedingWaterToday: number;
  plantsUpcomingSoon: number;
  hasActiveCareRoutine: boolean;
  hasCareStreak: boolean;
  onAddPlant: () => void;
  onNavigate: (path: string) => void;
}

export function DashboardHealthInsights({
  totalPlants,
  plantsWithoutWateringData,
  overduePlants,
  plantsNeedingWaterToday,
  plantsUpcomingSoon,
  hasActiveCareRoutine,
  hasCareStreak,
  onAddPlant,
  onNavigate,
}: DashboardHealthInsightsProps) {
  return (
    <CascadingContainer delay={400}>
      <Card
        data-testid="plant-health-insights-card"
        className="border-border mb-8"
      >
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <Target className="w-5 h-5 mr-2 text-plant-primary dark:text-plant-secondary" />
            Plant Health Insights
          </CardTitle>
          <CardDescription>
            Recommendations to keep your plants thriving
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-plant-primary dark:text-plant-secondary" />
                Health Summary
              </h4>

              {/* Overall Health Score - Enhanced with circular progress */}
              {totalPlants > 0 && (
                <div className="relative p-6 bg-gradient-to-br from-sprout-primary/10 via-sprout-light/5 to-sprout-success/5 dark:from-sprout-primary/20 dark:via-sprout-medium/10 dark:to-sprout-success/10 rounded-2xl border-2 border-sprout-light/30 dark:border-sprout-medium/40 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  {/* Decorative background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-sprout-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative flex items-center justify-between">
                    {/* Circular Progress Indicator */}
                    <div className="relative">
                      <svg className="w-24 h-24 -rotate-90 transform" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-muted/30"
                        />
                        {/* Progress circle with gradient */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="url(#healthGradient)"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${((totalPlants - plantsWithoutWateringData - overduePlants) / totalPlants) * 251.2} 251.2`}
                          className="transition-all duration-1000 ease-out"
                          style={{
                            filter: ((totalPlants - plantsWithoutWateringData - overduePlants) / totalPlants) > 0.8
                              ? 'drop-shadow(0 0 8px rgba(45, 90, 58, 0.5))'
                              : 'none'
                          }}
                        />
                        <defs>
                          <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" className="text-sprout-primary" style={{ stopColor: 'currentColor' }} />
                            <stop offset="100%" className="text-sprout-success" style={{ stopColor: 'currentColor' }} />
                          </linearGradient>
                        </defs>
                      </svg>
                      {/* Center percentage */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold bg-gradient-to-br from-sprout-primary to-sprout-success bg-clip-text text-transparent dark:from-sprout-light dark:to-sprout-success">
                          {Math.round(((totalPlants - plantsWithoutWateringData - overduePlants) / totalPlants) * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Health Status */}
                    <div className="flex-1 ml-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-foreground">Overall Health</span>
                          {((totalPlants - plantsWithoutWateringData - overduePlants) / totalPlants) >= 0.9 && (
                            <Badge className="bg-gradient-to-r from-sprout-success to-emerald-500 text-white border-0 shadow-md">
                              Excellent
                            </Badge>
                          )}
                          {((totalPlants - plantsWithoutWateringData - overduePlants) / totalPlants) >= 0.7 &&
                           ((totalPlants - plantsWithoutWateringData - overduePlants) / totalPlants) < 0.9 && (
                            <Badge className="bg-gradient-to-r from-sprout-primary to-sprout-light text-white border-0 shadow-md">
                              Good
                            </Badge>
                          )}
                          {((totalPlants - plantsWithoutWateringData - overduePlants) / totalPlants) < 0.7 && (
                            <Badge className="bg-gradient-to-r from-sprout-warning to-orange-500 text-white border-0 shadow-md">
                              Needs Care
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold text-sprout-primary dark:text-sprout-light">
                            {totalPlants - plantsWithoutWateringData - overduePlants}
                          </span>
                          {' '}of{' '}
                          <span className="font-semibold text-foreground">{totalPlants}</span>
                          {' '}plants thriving
                        </p>
                        {((totalPlants - plantsWithoutWateringData - overduePlants) / totalPlants) >= 0.9 && (
                          <p className="text-xs text-sprout-success font-medium flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Outstanding care routine!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Individual Metrics - Enhanced Mini Cards */}
              <div className="grid grid-cols-1 gap-3">
                {/* Well-maintained plants */}
                <div className="group relative p-4 bg-gradient-to-br from-green-50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/10 rounded-xl border border-green-200/50 dark:border-green-700/30 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/10 to-transparent rounded-full -mr-10 -mt-10" />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Well-maintained</p>
                        <p className="text-xs text-muted-foreground">Regular care routine</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">
                        {totalPlants > 0
                          ? `${Math.round(((totalPlants - plantsWithoutWateringData - overduePlants) / totalPlants) * 100)}%`
                          : '0%'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {totalPlants - plantsWithoutWateringData - overduePlants} plants
                      </p>
                    </div>
                  </div>
                  {totalPlants > 0 && (
                    <div className="mt-3 w-full bg-green-200/30 dark:bg-green-800/30 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-700 ease-out shadow-sm"
                        style={{
                          width: `${((totalPlants - plantsWithoutWateringData - overduePlants) / totalPlants) * 100}%`
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Need immediate attention */}
                <div className={`group relative p-4 bg-gradient-to-br rounded-xl border transition-all duration-300 overflow-hidden ${
                  overduePlants > 0
                    ? 'from-red-50 to-rose-50/50 dark:from-red-900/20 dark:to-rose-900/10 border-red-200/50 dark:border-red-700/30 hover:border-red-300 dark:hover:border-red-600 hover:shadow-lg'
                    : 'from-gray-50 to-slate-50/50 dark:from-gray-900/20 dark:to-slate-900/10 border-gray-200/50 dark:border-gray-700/30'
                }`}>
                  {overduePlants > 0 && (
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-400/10 to-transparent rounded-full -mr-10 -mt-10" />
                  )}
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 ${
                        overduePlants > 0
                          ? 'bg-gradient-to-br from-red-500 to-rose-500'
                          : 'bg-gradient-to-br from-gray-400 to-slate-400'
                      }`}>
                        <AlertTriangle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Immediate Attention</p>
                        <p className="text-xs text-muted-foreground">Overdue for watering</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold tabular-nums ${
                        overduePlants > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {totalPlants > 0
                          ? `${Math.round((overduePlants / totalPlants) * 100)}%`
                          : '0%'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {overduePlants} plants
                      </p>
                    </div>
                  </div>
                  {totalPlants > 0 && (
                    <div className={`mt-3 w-full rounded-full h-2 overflow-hidden ${
                      overduePlants > 0
                        ? 'bg-red-200/30 dark:bg-red-800/30'
                        : 'bg-gray-200/30 dark:bg-gray-800/30'
                    }`}>
                      <div
                        className={`h-2 rounded-full transition-all duration-700 ease-out shadow-sm ${
                          overduePlants > 0
                            ? 'bg-gradient-to-r from-red-500 to-rose-500'
                            : 'bg-gradient-to-r from-gray-400 to-slate-400'
                        }`}
                        style={{
                          width: `${(overduePlants / totalPlants) * 100}%`
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Missing care schedule */}
                <div className={`group relative p-4 bg-gradient-to-br rounded-xl border transition-all duration-300 overflow-hidden ${
                  plantsWithoutWateringData > 0
                    ? 'from-amber-50 to-yellow-50/50 dark:from-amber-900/20 dark:to-yellow-900/10 border-amber-200/50 dark:border-amber-700/30 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-lg'
                    : 'from-gray-50 to-slate-50/50 dark:from-gray-900/20 dark:to-slate-900/10 border-gray-200/50 dark:border-gray-700/30'
                }`}>
                  {plantsWithoutWateringData > 0 && (
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-400/10 to-transparent rounded-full -mr-10 -mt-10" />
                  )}
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 ${
                        plantsWithoutWateringData > 0
                          ? 'bg-gradient-to-br from-amber-500 to-yellow-500'
                          : 'bg-gradient-to-br from-gray-400 to-slate-400'
                      }`}>
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Missing Schedule</p>
                        <p className="text-xs text-muted-foreground">Needs initial care data</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold tabular-nums ${
                        plantsWithoutWateringData > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {totalPlants > 0
                          ? `${Math.round((plantsWithoutWateringData / totalPlants) * 100)}%`
                          : '0%'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {plantsWithoutWateringData} plants
                      </p>
                    </div>
                  </div>
                  {totalPlants > 0 && (
                    <div className={`mt-3 w-full rounded-full h-2 overflow-hidden ${
                      plantsWithoutWateringData > 0
                        ? 'bg-amber-200/30 dark:bg-amber-800/30'
                        : 'bg-gray-200/30 dark:bg-gray-800/30'
                    }`}>
                      <div
                        className={`h-2 rounded-full transition-all duration-700 ease-out shadow-sm ${
                          plantsWithoutWateringData > 0
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                            : 'bg-gradient-to-r from-gray-400 to-slate-400'
                        }`}
                        style={{
                          width: `${(plantsWithoutWateringData / totalPlants) * 100}%`
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-plant-primary dark:text-plant-secondary" />
                Recommendations
              </h4>

              <div className="space-y-3">
                {/* Overdue Plants - Urgent Action Required */}
                {overduePlants > 0 && (
                  <div
                    data-testid="overdue-plants-warning"
                    className="group relative p-4 bg-gradient-to-br from-red-50 to-rose-50/50 dark:from-red-900/30 dark:to-rose-900/20 rounded-xl border-2 border-red-300/50 dark:border-red-600/40 hover:border-red-400 dark:hover:border-red-500 hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    {/* Decorative gradient blob */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-red-400/20 to-rose-400/10 rounded-full blur-2xl" />

                    <div className="relative flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-1">
                          <h5 className="font-semibold text-foreground">Urgent: Water Needed</h5>
                          <Badge className="bg-gradient-to-r from-red-600 to-rose-600 text-white border-0 text-xs mt-1">
                            {overduePlants} plant{overduePlants > 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {overduePlants === 1
                            ? "One plant is overdue for watering and needs immediate attention"
                            : `${overduePlants} plants are overdue for watering and need immediate attention`
                          }
                        </p>
                        <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-medium">
                          <Clock className="w-3 h-3" />
                          <span>Action required today</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plants Without Watering Data */}
                {plantsWithoutWateringData > 0 && (
                  <div
                    data-testid="missing-watering-data-warning"
                    className="group relative p-4 bg-gradient-to-br from-amber-50 to-yellow-50/50 dark:from-amber-900/30 dark:to-yellow-900/20 rounded-xl border-2 border-amber-300/50 dark:border-amber-600/40 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    {/* Decorative gradient blob */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-yellow-400/10 rounded-full blur-2xl" />

                    <div className="relative flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-1">
                          <h5 className="font-semibold text-foreground">Setup Required</h5>
                          <Badge className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white border-0 text-xs mt-1">
                            {plantsWithoutWateringData} plant{plantsWithoutWateringData > 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {plantsWithoutWateringData === 1
                            ? "One plant needs initial watering data to establish a care schedule"
                            : `${plantsWithoutWateringData} plants need initial watering data to establish care schedules`
                          }
                        </p>
                        <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 font-medium">
                          <Droplets className="w-3 h-3" />
                          <span>Water once to get started</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plants Needing Water Today (not overdue) */}
                {plantsNeedingWaterToday > 0 && overduePlants === 0 && (
                  <div
                    className="group relative p-4 bg-gradient-to-br from-blue-50 to-cyan-50/50 dark:from-blue-900/30 dark:to-cyan-900/20 rounded-xl border-2 border-blue-300/50 dark:border-blue-600/40 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-400/10 rounded-full blur-2xl" />

                    <div className="relative flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-sprout-water to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <Droplets className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-1">
                          <h5 className="font-semibold text-foreground">Watering Scheduled</h5>
                          <Badge className="bg-gradient-to-r from-sprout-water to-cyan-600 text-white border-0 text-xs mt-1">
                            {plantsNeedingWaterToday} plant{plantsNeedingWaterToday > 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {plantsNeedingWaterToday === 1
                            ? "One plant is scheduled for watering today"
                            : `${plantsNeedingWaterToday} plants are scheduled for watering today`
                          }
                        </p>
                        <div className="flex items-center gap-2 text-xs text-sprout-water dark:text-cyan-400 font-medium">
                          <Calendar className="w-3 h-3" />
                          <span>Due today - on schedule</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* All Plants Healthy - Success State */}
                {overduePlants === 0 &&
                  plantsWithoutWateringData === 0 &&
                  plantsNeedingWaterToday === 0 &&
                  totalPlants > 0 && (
                    <div
                      data-testid="all-plants-healthy-message"
                      className="group relative p-5 bg-gradient-to-br from-emerald-50 to-green-50/50 dark:from-emerald-900/30 dark:to-green-900/20 rounded-xl border-2 border-emerald-300/50 dark:border-emerald-600/40 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-xl transition-all duration-300 overflow-hidden"
                    >
                      {/* Animated gradient background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-green-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {/* Decorative elements */}
                      <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-green-400/10 rounded-full blur-2xl" />
                      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr from-green-400/15 to-emerald-400/5 rounded-full blur-2xl" />

                      <div className="relative flex items-start gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 flex-shrink-0">
                          <CheckCircle2 className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="mb-2">
                            <h5 className="text-lg font-bold bg-gradient-to-r from-emerald-700 to-green-700 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
                              Perfect Care Routine!
                            </h5>
                            <Badge className="bg-gradient-to-r from-emerald-600 to-green-600 text-white border-0 mt-1">
                              All Clear
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            All your plants are thriving with proper care. No immediate actions needed - keep up the excellent work!
                          </p>
                          <div className="flex flex-wrap gap-3 text-xs">
                            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Watering on track</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400 font-medium">
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span>Schedules established</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                              <Flower2 className="w-3.5 h-3.5" />
                              <span>Plants thriving</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Upcoming Care - Plants Due in 1-2 Days */}
                {plantsUpcomingSoon > 0 && totalPlants > 0 && (
                  <div
                    className="group relative p-4 bg-gradient-to-br from-indigo-50 to-violet-50/50 dark:from-indigo-900/30 dark:to-violet-900/20 rounded-xl border-2 border-indigo-300/50 dark:border-indigo-600/40 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-indigo-400/20 to-violet-400/10 rounded-full blur-2xl" />

                    <div className="relative flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-1">
                          <h5 className="font-semibold text-foreground">Coming Up Soon</h5>
                          <Badge className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 text-xs mt-1">
                            {plantsUpcomingSoon} plant{plantsUpcomingSoon > 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {plantsUpcomingSoon === 1
                            ? "One plant will need watering in the next 1-2 days"
                            : `${plantsUpcomingSoon} plants will need watering in the next 1-2 days`
                          }
                        </p>
                        <div className="flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-400 font-medium">
                          <Clock className="w-3 h-3" />
                          <span>Stay ahead of the schedule</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Care Achievement - Motivational Card */}
                {hasActiveCareRoutine && hasCareStreak && plantsNeedingWaterToday === 0 && totalPlants > 0 && (
                  <div
                    className="group relative p-4 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-900/30 dark:to-orange-900/20 rounded-xl border-2 border-sprout-cream/50 dark:border-amber-700/40 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-orange-400/10 rounded-full blur-2xl" />

                    <div className="relative flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-sprout-cream to-amber-400 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 flex-shrink-0">
                        <Star className="w-6 h-6 text-white fill-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold text-foreground">On a Roll!</h5>
                          <Badge className="bg-gradient-to-r from-amber-600 to-orange-600 text-white border-0 text-xs">
                            Active Streak
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          You're maintaining an excellent care routine with all plants on schedule
                        </p>
                        <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 font-medium">
                          <TrendingUp className="w-3 h-3" />
                          <span>Keep up the momentum</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* No Plants - Onboarding State */}
                {totalPlants === 0 && (
                  <div
                    data-testid="add-first-plant-prompt"
                    className="text-center p-6 bg-gradient-to-br from-plant-primary/5 to-plant-secondary/5 dark:from-plant-primary/10 dark:to-plant-secondary/10 rounded-xl border-2 border-plant-primary/20"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-plant-primary to-plant-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Flower2 className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground mb-2">
                      Start Your Plant Journey
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                      Add your first plant to unlock smart watering schedules, care reminders, and personalized insights!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button
                        data-testid="add-first-plant-button"
                        onClick={onAddPlant}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Plant
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => onNavigate("/plant-catalog")}
                        size="sm"
                        className="border-plant-primary/30 hover:bg-plant-primary/5"
                      >
                        Browse Plant Catalog
                      </Button>
                    </div>

                    {/* Quick Start Guide */}
                    <div className="mt-6 pt-6 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-3">QUICK START GUIDE</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                        <div className="flex gap-2">
                          <div className="w-6 h-6 rounded-full bg-plant-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            1
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">Add a Plant</p>
                            <p className="text-xs text-muted-foreground">Give it a nickname</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-6 h-6 rounded-full bg-plant-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            2
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">Set Schedule</p>
                            <p className="text-xs text-muted-foreground">Use Smart Wizard</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-6 h-6 rounded-full bg-plant-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            3
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">Track Care</p>
                            <p className="text-xs text-muted-foreground">Get reminders</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </CascadingContainer>
  );
}

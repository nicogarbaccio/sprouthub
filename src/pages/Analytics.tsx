import { useAuth } from '@/contexts/AuthContext';
import { useUserPlants } from '@/hooks/useUserPlants';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  Droplets,
  TrendingUp,
  Heart,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Target,
  Award,
} from 'lucide-react';
import {
  calculateWateringStats,
  calculatePlantHealthStats,
  getTimeDistribution,
  getAnalyticsInsights,
} from '@/utils/analytics';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { getPlantImageUrl } from '@/utils/plants/images';
import { AnalyticsSkeleton } from '@/components/ui/skeleton';
import { CascadingContainer } from '@/components/ui/cascading-container';
import { LoadingTransition } from '@/components/ui/loading-transition';
import { FeatureErrorBoundary } from '@/components/ui/feature-error-boundary';

const AnalyticsContent = () => {
  const { user, loading: authLoading } = useAuth();
  const { plants, loading: plantsLoading } = useUserPlants();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
    }
  }, [user, authLoading, navigate]);

  const isLoading = authLoading || plantsLoading;
  const { enrichedPerformance, wateringRecords, isLoading: analyticsLoading } = useAnalyticsData(
    isLoading ? [] : plants,
  );

  if (!isLoading && !user) return null;

  const wateringStats = !isLoading ? calculateWateringStats(plants, wateringRecords.size > 0 ? wateringRecords : undefined) : { totalWaterings: 0, thisWeek: 0, averagePerWeek: 0, streak: 0, longestStreak: 0, thisMonth: 0 };
  const healthStats = !isLoading ? calculatePlantHealthStats(plants) : { totalPlants: 0, onSchedule: 0, needsAttention: 0, overduePlants: 0, overwateringRisk: 0 };
  const weeklyDistribution = !isLoading ? getTimeDistribution(plants, wateringRecords.size > 0 ? wateringRecords : undefined) : [];
  const insights = !isLoading ? getAnalyticsInsights(plants, enrichedPerformance.length > 0 ? enrichedPerformance : undefined) : [];

  return (
    <div className="min-h-dvh bg-background pb-28 lg:pb-0">
      <Navigation />
      <main className="py-8">
        <LoadingTransition loading={isLoading} skeleton={<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><AnalyticsSkeleton /></div>}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <CascadingContainer delay={100}>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="h-8 w-8 text-sprout-primary" />
                <h1 className="text-3xl font-bold text-foreground">Plant Care Analytics</h1>
              </div>
              <p className="text-muted-foreground">
                Track your plant care performance and identify trends
              </p>
            </div>
          </CascadingContainer>

          {/* Insights Banner */}
          {insights.length > 0 && (
            <CascadingContainer delay={150}>
              <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {insights.map((insight, idx) => (
                      <li key={idx} className="text-sm text-foreground">
                        {insight.names && (
                          <span className="font-bold text-sprout-success">{insight.names}</span>
                        )}
                        {insight.names ? ' — ' : ''}{insight.message}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </CascadingContainer>
          )}

          {/* Watering Stats Cards */}
          <CascadingContainer delay={200}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    Total Waterings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{wateringStats.totalWaterings}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All time
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    This Week
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{wateringStats.thisWeek}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg: {wateringStats.averagePerWeek}/week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Current Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{wateringStats.streak}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Longest: {wateringStats.longestStreak} days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{wateringStats.thisMonth}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Waterings completed
                  </p>
                </CardContent>
              </Card>
            </div>
          </CascadingContainer>

          {/* Plant Health Overview */}
          <CascadingContainer delay={250}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Plant Health Overview
                </CardTitle>
                <CardDescription>
                  Current status of your {healthStats.totalPlants} plants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Healthy Plants */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">On Schedule</span>
                      </div>
                      <span className="text-sm font-bold">{healthStats.onSchedule}</span>
                    </div>
                    <Progress
                      value={(healthStats.onSchedule / healthStats.totalPlants) * 100}
                      className="h-2"
                    />
                  </div>

                  {/* Needs Attention */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">Needs Attention</span>
                      </div>
                      <span className="text-sm font-bold">{healthStats.needsAttention}</span>
                    </div>
                    <Progress
                      value={(healthStats.needsAttention / healthStats.totalPlants) * 100}
                      className="h-2 [&>div]:bg-orange-500"
                    />
                  </div>

                  {/* Overdue */}
                  {healthStats.overduePlants > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium">Overdue</span>
                        </div>
                        <span className="text-sm font-bold">{healthStats.overduePlants}</span>
                      </div>
                      <Progress
                        value={(healthStats.overduePlants / healthStats.totalPlants) * 100}
                        className="h-2 [&>div]:bg-red-500"
                      />
                    </div>
                  )}

                  {/* Overwatering Risk */}
                  {healthStats.overwateringRisk > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Droplets className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">Overwatering Risk</span>
                        </div>
                        <span className="text-sm font-bold">{healthStats.overwateringRisk}</span>
                      </div>
                      <Progress
                        value={(healthStats.overwateringRisk / healthStats.totalPlants) * 100}
                        className="h-2 [&>div]:bg-blue-500"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </CascadingContainer>

          {/* Watering by Day of Week */}
          <CascadingContainer delay={300}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Watering Activity by Day</CardTitle>
                <CardDescription>
                  Which days you water most — last 90 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weeklyDistribution.map((day) => {
                    const maxWaterings = Math.max(...weeklyDistribution.map(d => d.waterings));
                    const percentage = maxWaterings > 0 ? (day.waterings / maxWaterings) * 100 : 0;

                    return (
                      <div key={day.period}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium w-24">{day.period}</span>
                          <div className="flex-1 mx-4">
                            <div className="h-6 bg-background/40 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-400 dark:bg-emerald-500 transition-all duration-300 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-bold w-8 text-right">{day.waterings}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </CascadingContainer>

          {/* Plant Performance Table */}
          <CascadingContainer delay={350}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span aria-hidden>🌱</span> Plant Performance
                </CardTitle>
                <CardDescription>
                  Care scores based on watering consistency over the last 90 days
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-border bg-muted/50">
                        <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plant</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <span title="Based on how consistently you water relative to the schedule over the last 90 days">Care Score</span>
                        </th>
                        <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pattern</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Postponements</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(analyticsLoading ? [] : enrichedPerformance).slice(0, 10).map((plant) => (
                        <tr key={plant.plantId} className="hover:bg-muted/30 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-start gap-3">
                              <img
                                src={getPlantImageUrl(plant.plantImage, plant.plantType)}
                                alt={plant.plantName}
                                className="w-10 h-10 rounded-full object-cover shrink-0 mt-0.5"
                              />
                              <div className="min-w-0">
                                <div className="font-medium">{plant.plantName}</div>
                                <div className="text-xs text-muted-foreground">{plant.plantType}</div>
                                {plant.tip && (
                                  <div className="text-xs text-muted-foreground/80 mt-1.5 italic leading-relaxed">
                                    {plant.tip}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            {plant.careScore === -1 ? (
                              <Badge variant="outline" className="text-muted-foreground">--</Badge>
                            ) : (
                              <Badge
                                className={
                                  plant.careScore >= 75
                                    ? 'bg-green-500'
                                    : plant.careScore >= 50
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }
                              >
                                {plant.careScore}%
                              </Badge>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={
                              `text-xs font-medium inline-flex items-center rounded-md px-2 py-1 ${
                                plant.pattern === 'consistent' ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                : plant.pattern === 'early' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : plant.pattern === 'late' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                : 'bg-muted text-muted-foreground'
                              }`
                            }>
                              {plant.pattern === 'insufficient' ? 'New'
                                : plant.pattern.charAt(0).toUpperCase() + plant.pattern.slice(1)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center text-sm">
                            {plant.postponementCount > 0 ? (
                              <span className={
                                plant.postponementCount >= 3
                                  ? 'inline-flex items-center rounded-md bg-orange-500/10 px-2 py-1 text-xs font-medium text-orange-600 dark:text-orange-400'
                                  : ''
                              }>
                                {plant.postponementCount}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {analyticsLoading && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                            Analyzing watering history...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </CascadingContainer>
        </div>
        </LoadingTransition>
      </main>
      <Footer />
    </div>
  );
};

const Analytics = () => {
  return (
    <FeatureErrorBoundary featureName="Analytics">
      <AnalyticsContent />
    </FeatureErrorBoundary>
  );
};

export default Analytics;

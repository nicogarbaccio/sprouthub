import { useAuth } from '@/contexts/AuthContext';
import { useUserPlants } from '@/hooks/useUserPlants';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  ArrowLeft,
} from 'lucide-react';
import {
  calculateWateringStats,
  calculatePlantHealthStats,
  getWateringFrequency,
  calculatePlantPerformance,
  getTimeDistribution,
  getAnalyticsInsights,
} from '@/utils/analytics';
import { AnalyticsSkeleton } from '@/components/ui/skeleton';
import { CascadingContainer } from '@/components/ui/cascading-container';
import { format } from 'date-fns';
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

  if (authLoading || plantsLoading) {
    return (
      <div className="min-h-dvh bg-background pb-20 lg:pb-0">
        <Navigation />
        <main className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnalyticsSkeleton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  const wateringStats = calculateWateringStats(plants);
  const healthStats = calculatePlantHealthStats(plants);
  const plantPerformance = calculatePlantPerformance(plants);
  const weeklyDistribution = getTimeDistribution(plants, 'week');
  const insights = getAnalyticsInsights(plants);

  return (
    <div className="min-h-dvh bg-background pb-20 lg:pb-0">
      <Navigation />
      <main className="py-8">
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
                        {insight}
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
                  See when you typically water your plants
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
                            <div className="h-6 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-sprout-primary transition-all duration-300"
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
                <CardTitle>Plant Performance</CardTitle>
                <CardDescription>
                  Track how well each plant is being cared for
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Plant</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Type</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Days Owned</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Compliance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plantPerformance.slice(0, 10).map((plant) => (
                        <tr key={plant.plantId} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-3 px-2 font-medium">{plant.plantName}</td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">{plant.plantType}</td>
                          <td className="py-3 px-2 text-center text-sm">{plant.daysOwned}</td>
                          <td className="py-3 px-2 text-center">
                            <Badge
                              className={
                                plant.compliance >= 80
                                  ? 'bg-green-500'
                                  : plant.compliance >= 50
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }
                            >
                              {plant.compliance}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </CascadingContainer>
        </div>
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

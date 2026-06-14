import { useAuth } from '@/contexts/AuthContext';
import { useUserPlants } from '@/hooks/useUserPlants';
import { useNavigate, Link } from 'react-router-dom';
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
  FlaskConical,
  CalendarRange,
} from 'lucide-react';
import {
  calculateWateringStats,
  calculatePlantHealthStats,
  classifyWateringHabits,
  habitNote,
  getTimeDistribution,
  getAnalyticsInsights,
  calculateFertilizationSummaries,
} from '@/utils/analytics';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { getPlantImageUrl } from '@/utils/plants/images';
import { getMoodConfig } from '@/types/journalTypes';
import { AnalyticsSkeleton } from '@/components/ui/skeleton';
import { CascadingContainer } from '@/components/ui/cascading-container';
import { LoadingTransition } from '@/components/ui/loading-transition';
import { FeatureErrorBoundary } from '@/components/ui/feature-error-boundary';
import { PageHero } from '@/components/ui/page-hero';
import { Leaf } from 'lucide-react';

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
  const { enrichedPerformance, wateringRecords, seasonalSchedules, isLoading: analyticsLoading } = useAnalyticsData(
    isLoading ? [] : plants,
    user?.id,
  );

  if (!isLoading && !user) return null;

  const fertilizationSummaries = !isLoading ? calculateFertilizationSummaries(plants) : [];

  const wateringStats = !isLoading ? calculateWateringStats(plants, wateringRecords.size > 0 ? wateringRecords : undefined) : { totalWaterings: 0, thisWeek: 0, averagePerWeek: 0, streak: 0, longestStreak: 0, thisMonth: 0 };
  const healthStats = !isLoading ? calculatePlantHealthStats(plants) : { totalPlants: 0, healthyPlants: 0, onSchedule: 0, needsAttention: 0, overduePlants: 0, lists: { overdue: [], needsAttention: [], onSchedule: [] } };
  // Single source of truth for the status drill-down lists
  const healthPlantLists = healthStats.lists;
  // Habit groupings + per-plant lookup, both derived from the same `pattern`
  // value that drives the Performance table's Pattern column.
  const wateringHabits = classifyWateringHabits(enrichedPerformance);
  const perfByPlantId = new Map(enrichedPerformance.map(p => [p.plantId, p]));
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
            <PageHero
              icon={BarChart3}
              title="Plant Care Analytics"
              subtitle="Track your plant care performance and identify trends"
              stats={[
                { icon: Leaf, label: "plants", value: plants.length },
                { icon: Droplets, label: "waterings", value: wateringStats.totalWaterings },
                ...(wateringStats.streak > 0 ? [{ icon: Award, label: "day streak", value: wateringStats.streak }] : []),
              ]}
            />
          </CascadingContainer>

          {/* Insights Banner */}
          {insights.length > 0 && (
            <CascadingContainer delay={150}>
              <Card className="mb-6 border-0 shadow-md overflow-hidden bg-blue-50 dark:bg-blue-950/20">
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
              <Card className="border-0 shadow-md overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-sprout-water via-sprout-success to-sprout-medium" />
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

              <Card className="border-0 shadow-md overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-sprout-water via-sprout-success to-sprout-medium" />
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

              <Card className="border-0 shadow-md overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-sprout-water via-sprout-success to-sprout-medium" />
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

              <Card className="border-0 shadow-md overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-sprout-water via-sprout-success to-sprout-medium" />
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
            <Card className="mb-6 border-0 shadow-md overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-sprout-water via-sprout-success to-sprout-medium" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-red-500/10"><Heart className="h-5 w-5 text-red-500" /></div>
                  Plant Health Overview
                </CardTitle>
                <CardDescription>
                  Where your {healthStats.totalPlants} plants stand right now, and how your watering habits look over the last 90 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Section A — current status (snapshot) */}
                  <div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <h3 className="text-sm font-semibold">Watering status</h3>
                      <span className="text-xs text-muted-foreground">right now</span>
                    </div>
                    <div className="space-y-4">
                      {/* On Schedule */}
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
                        {healthPlantLists.onSchedule.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1.5">
                            {healthPlantLists.onSchedule.map((p, i) => {
                              const note = habitNote(perfByPlantId.get(p.id)?.pattern);
                              return (
                                <span key={p.id}>{i > 0 && ', '}<Link to={`/my-plants/${p.id}`} className="underline underline-offset-2 hover:text-foreground">{p.name}</Link>{note && <span className="opacity-70"> · {note}</span>}</span>
                              );
                            })}
                          </p>
                        )}
                      </div>

                      {/* Needs Attention */}
                      {healthStats.needsAttention > 0 && (
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
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1.5">
                            {healthPlantLists.needsAttention.map((p, i) => {
                              const note = habitNote(perfByPlantId.get(p.id)?.pattern);
                              return (
                                <span key={p.id}>{i > 0 && ', '}<Link to={`/my-plants/${p.id}`} className="underline underline-offset-2 hover:text-orange-400 dark:hover:text-orange-300">{p.name}</Link>{note && <span className="opacity-70"> · {note}</span>}</span>
                              );
                            })}
                          </p>
                        </div>
                      )}

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
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">
                            {healthPlantLists.overdue.map((p, i) => {
                              const note = habitNote(perfByPlantId.get(p.id)?.pattern);
                              return (
                                <span key={p.id}>{i > 0 && ', '}<Link to={`/my-plants/${p.id}`} className="underline underline-offset-2 hover:text-red-400 dark:hover:text-red-300">{p.name}</Link>{note && <span className="opacity-70"> · {note}</span>}</span>
                              );
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section B — watering habits (90-day history) */}
                  {enrichedPerformance.length > 0 && (
                    <div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <h3 className="text-sm font-semibold">Watering habits</h3>
                        <span className="text-xs text-muted-foreground">last 90 days</span>
                      </div>
                      {wateringHabits.late.length === 0 && wateringHabits.early.length === 0 && wateringHabits.irregular.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          {wateringHabits.consistentCount > 0
                            ? 'Your plants are watered on a consistent rhythm — nice work!'
                            : 'Not enough watering history yet to spot habits.'}
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {/* Runs late */}
                          {wateringHabits.late.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="inline-block w-3 h-3 rounded-full bg-orange-500" />
                                  <span className="text-sm font-medium">Runs late</span>
                                </div>
                                <span className="text-sm font-bold">{wateringHabits.late.length}</span>
                              </div>
                              <Progress
                                value={(wateringHabits.late.length / healthStats.totalPlants) * 100}
                                className="h-2 [&>div]:bg-orange-500"
                              />
                              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1.5">
                                {wateringHabits.late.map((p, i) => (
                                  <span key={p.id}>{i > 0 && ', '}<Link to={`/my-plants/${p.id}`} className="underline underline-offset-2 hover:text-orange-400 dark:hover:text-orange-300">{p.name}</Link></span>
                                ))}
                              </p>
                            </div>
                          )}

                          {/* Runs early */}
                          {wateringHabits.early.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
                                  <span className="text-sm font-medium">Runs early</span>
                                </div>
                                <span className="text-sm font-bold">{wateringHabits.early.length}</span>
                              </div>
                              <Progress
                                value={(wateringHabits.early.length / healthStats.totalPlants) * 100}
                                className="h-2 [&>div]:bg-blue-500"
                              />
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5">
                                {wateringHabits.early.map((p, i) => (
                                  <span key={p.id}>{i > 0 && ', '}<Link to={`/my-plants/${p.id}`} className="underline underline-offset-2 hover:text-blue-400 dark:hover:text-blue-300">{p.name}</Link></span>
                                ))}
                              </p>
                            </div>
                          )}

                          {/* Inconsistent */}
                          {wateringHabits.irregular.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="inline-block w-3 h-3 rounded-full bg-muted-foreground/50" />
                                  <span className="text-sm font-medium">Inconsistent timing</span>
                                </div>
                                <span className="text-sm font-bold">{wateringHabits.irregular.length}</span>
                              </div>
                              <Progress
                                value={(wateringHabits.irregular.length / healthStats.totalPlants) * 100}
                                className="h-2 [&>div]:bg-muted-foreground/50"
                              />
                              <p className="text-xs text-muted-foreground mt-1.5">
                                {wateringHabits.irregular.map((p, i) => (
                                  <span key={p.id}>{i > 0 && ', '}<Link to={`/my-plants/${p.id}`} className="underline underline-offset-2 hover:text-foreground">{p.name}</Link></span>
                                ))}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </CascadingContainer>

          {/* Fertilization Status */}
          <CascadingContainer delay={275}>
            <Card className="mb-6 border-0 shadow-md overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-sprout-primary via-sprout-medium to-sprout-light" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sprout-primary/10"><FlaskConical className="h-5 w-5 text-sprout-primary" /></div>
                  Fertilization Status
                </CardTitle>
                <CardDescription>
                  {fertilizationSummaries.length > 0 && fertilizationSummaries[0].isGrowingSeason
                    ? 'Growing season — time to feed your plants'
                    : 'Dormant season — no fertilization needed'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {fertilizationSummaries.length > 0 && fertilizationSummaries[0].isGrowingSeason ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plant</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Frequency</th>
                          <th className="text-center py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Fed</th>
                          <th className="text-center py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {fertilizationSummaries.map((plant) => (
                          <tr key={plant.plantId} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={getPlantImageUrl(plant.plantImage, plant.plantType)}
                                  alt={plant.plantName}
                                  className="w-8 h-8 rounded-full object-cover shrink-0"
                                />
                                <span className="text-sm font-medium truncate">{plant.plantName}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="text-xs text-muted-foreground">
                                {plant.frequencyLabel.charAt(0).toUpperCase() + plant.frequencyLabel.slice(1)}
                                {plant.fertilizerType && <span className="block text-muted-foreground/70">{plant.fertilizerType.charAt(0).toUpperCase() + plant.fertilizerType.slice(1).toLowerCase()}</span>}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="text-sm text-muted-foreground">
                                {plant.daysSinceLastFertilized === null
                                  ? 'Never'
                                  : plant.daysSinceLastFertilized === 0
                                  ? 'Today'
                                  : `${plant.daysSinceLastFertilized}d ago`}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {plant.isDue ? (
                                <Badge className="bg-amber-500 text-xs">Due</Badge>
                              ) : plant.daysUntilDue !== null ? (
                                <Badge variant="outline" className="text-xs">In {plant.daysUntilDue}d</Badge>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Plants are resting during the dormant season. Resume fertilizing in spring.
                  </p>
                )}
              </CardContent>
            </Card>
          </CascadingContainer>

          {/* Watering by Day of Week */}
          <CascadingContainer delay={300}>
            <Card className="mb-6 border-0 shadow-md overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-sprout-water via-sprout-success to-sprout-medium" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sprout-water/10"><Calendar className="h-5 w-5 text-sprout-water" /></div>
                  Watering Activity by Day
                </CardTitle>
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

          {/* Seasonal Schedule History */}
          <CascadingContainer delay={325}>
            <Card className="mb-6 border-0 shadow-md overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-sprout-primary via-sprout-medium to-sprout-light" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sprout-medium/10"><CalendarRange className="h-5 w-5 text-sprout-medium" /></div>
                  Seasonal Schedule History
                </CardTitle>
                <CardDescription>
                  How watering schedules have changed across seasons
                </CardDescription>
              </CardHeader>
              <CardContent>
                {seasonalSchedules.length > 0 ? (() => {
                  const currentYear = new Date().getFullYear();
                  const seasons = ['spring', 'summer', 'fall', 'winter'] as const;
                  const month = new Date().getMonth();
                  const currentSeason = month >= 2 && month <= 4 ? 'spring'
                    : month >= 5 && month <= 7 ? 'summer'
                    : month >= 8 && month <= 10 ? 'fall' : 'winter';

                  // Group by plant
                  const byPlant = new Map<string, { nickname: string; seasons: Record<string, number | null> }>();
                  for (const s of seasonalSchedules) {
                    if (s.year !== currentYear || !s.plant_id) continue;
                    const plantData = (s as any).user_plants;
                    const nickname = plantData?.nickname ?? 'Unknown';
                    if (!byPlant.has(s.plant_id)) {
                      byPlant.set(s.plant_id, { nickname, seasons: { spring: null, summer: null, fall: null, winter: null } });
                    }
                    byPlant.get(s.plant_id)!.seasons[s.season] = s.watering_days;
                  }

                  if (byPlant.size === 0) {
                    return (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        Seasonal schedules will appear here as seasons change
                      </p>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Plant</th>
                            {seasons.map(s => (
                              <th
                                key={s}
                                className={`text-center py-2 px-3 text-xs font-semibold capitalize ${
                                  s === currentSeason
                                    ? 'text-sprout-primary bg-sprout-primary/5 rounded-t-md'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {s}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {[...byPlant.entries()].map(([plantId, data]) => (
                            <tr key={plantId}>
                              <td className="py-2 px-3 text-sm font-medium">{data.nickname}</td>
                              {seasons.map(s => (
                                <td
                                  key={s}
                                  className={`py-2 px-3 text-center text-sm ${
                                    s === currentSeason ? 'bg-sprout-primary/5 font-medium' : ''
                                  }`}
                                >
                                  {data.seasons[s] !== null ? `${data.seasons[s]}d` : '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })() : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Seasonal schedules will appear here as seasons change
                  </p>
                )}
              </CardContent>
            </Card>
          </CascadingContainer>

          {/* Plant Performance Table */}
          <CascadingContainer delay={350}>
            <Card className="border-0 shadow-md overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-sprout-water via-sprout-success to-sprout-medium" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sprout-success/10"><Leaf className="h-5 w-5 text-sprout-success" /></div>
                  Plant Performance
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
                        <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <span title="How well your current schedule matches your actual watering rhythm">Fit</span>
                        </th>
                        <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pattern</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mood</th>
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
                            <span
                              title={plant.scheduleFit.suggestion || (plant.scheduleFit.verdict === 'good' ? 'Schedule matches your watering rhythm' : 'Not enough data yet')}
                              className={`inline-block w-3 h-3 rounded-full ${
                                plant.scheduleFit.verdict === 'good' ? 'bg-green-500'
                                : plant.scheduleFit.verdict === 'tight' ? 'bg-orange-500'
                                : plant.scheduleFit.verdict === 'loose' ? 'bg-orange-500'
                                : 'bg-muted'
                              }`}
                            />
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
                          <td className="py-4 px-4 text-center">
                            {plant.moodSummary ? (() => {
                              const config = getMoodConfig(plant.moodSummary.dominantMood as any);
                              const trendIcon = plant.moodSummary.trend === 'improving' ? '↑'
                                : plant.moodSummary.trend === 'declining' ? '↓' : '→';
                              const trendColor = plant.moodSummary.trend === 'improving' ? 'text-green-500'
                                : plant.moodSummary.trend === 'declining' ? 'text-red-500' : 'text-muted-foreground';
                              return (
                                <span
                                  className="inline-flex items-center gap-1.5 text-xs"
                                  title={`Based on ${plant.moodSummary.totalEntries} journal entries (90 days)`}
                                >
                                  <span>{config?.icon ?? '😐'}</span>
                                  <span className="font-medium">{config?.label ?? plant.moodSummary.dominantMood}</span>
                                  <span className={`font-medium ${trendColor}`}>{trendIcon}</span>
                                </span>
                              );
                            })() : (
                              <span className="text-muted-foreground">—</span>
                            )}
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
                          <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
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

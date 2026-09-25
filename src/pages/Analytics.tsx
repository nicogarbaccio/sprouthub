import { useAuth } from '@/contexts/AuthContext';
import { useUserPlants } from '@/hooks/useUserPlants';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
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
import { useCareStreak } from '@/hooks/useCareStreak';
import { AnalyticsSkeleton } from '@/components/ui/skeleton';
import { CascadingContainer } from '@/components/ui/cascading-container';
import { LoadingTransition } from '@/components/ui/loading-transition';
import { FeatureErrorBoundary } from '@/components/ui/feature-error-boundary';
import {
  AnalyticsTiles,
  FertilizationCard,
  InsightsCard,
  PerformanceCard,
  SeasonalCard,
  WateringHabitsCard,
  WateringStatusCard,
  WeekdayCard,
  groupSeasonalSchedules,
} from '@/components/analytics/AnalyticsBento';

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

  // Same streak as the Home tile, so the two screens never disagree
  const { checkStreak, streakDays, onTimeRate, lookbackDays } = useCareStreak();
  useEffect(() => {
    if (!isLoading && plants.length > 0) {
      checkStreak(plants);
    }
  }, [isLoading, plants, checkStreak]);

  if (!isLoading && !user) return null;

  const records = wateringRecords.size > 0 ? wateringRecords : undefined;
  const fertilizationSummaries = !isLoading ? calculateFertilizationSummaries(plants) : [];
  const wateringStats = calculateWateringStats(isLoading ? [] : plants, records);
  const healthStats = calculatePlantHealthStats(isLoading ? [] : plants);
  // Habit groupings + per-plant lookup, both derived from the same `pattern`
  // value that drives the Performance card's pattern pill.
  const wateringHabits = classifyWateringHabits(enrichedPerformance);
  const perfByPlantId = new Map(enrichedPerformance.map(p => [p.plantId, p]));
  const weeklyDistribution = !isLoading ? getTimeDistribution(plants, records) : [];
  const insights = !isLoading ? getAnalyticsInsights(plants, enrichedPerformance.length > 0 ? enrichedPerformance : undefined) : [];
  const seasonalRows = groupSeasonalSchedules(seasonalSchedules);

  return (
    <div className="bg-background pb-32 lg:pb-10">
      <main className="px-4 lg:px-8 pt-3.5 lg:pt-7">
        <LoadingTransition loading={isLoading} skeleton={<div className="max-w-7xl mx-auto"><AnalyticsSkeleton /></div>}>
        <div className="max-w-7xl mx-auto space-y-2.5 md:space-y-3.5">
          <CascadingContainer delay={0}>
            <div className="px-1.5 lg:px-0 pb-2">
              <h1 className="font-display text-[28px] lg:text-[34px] font-bold tracking-[-0.04em] text-foreground">
                Analytics
              </h1>
              <p className="text-sm lg:text-[15px] font-medium text-muted-foreground mt-0.5">
                How your care is going across {plants.length} {plants.length === 1 ? 'plant' : 'plants'}
              </p>
            </div>
          </CascadingContainer>

          <CascadingContainer delay={50}>
            <AnalyticsTiles
              stats={wateringStats}
              streak={{ days: streakDays, onTimeRate, lookbackDays }}
            />
          </CascadingContainer>

          {insights.length > 0 && (
            <CascadingContainer delay={100}>
              <InsightsCard insights={insights} />
            </CascadingContainer>
          )}

          <CascadingContainer delay={150}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 md:gap-3.5 items-start">
              <div className="space-y-2.5 md:space-y-3.5">
                <WateringStatusCard
                  health={healthStats}
                  note={(plant) => habitNote(perfByPlantId.get(plant.id)?.pattern)}
                />
                <WateringHabitsCard habits={wateringHabits} loading={analyticsLoading} />
                <FertilizationCard summaries={fertilizationSummaries} />
              </div>
              <div className="space-y-2.5 md:space-y-3.5">
                <WeekdayCard distribution={weeklyDistribution} />
                <SeasonalCard rows={seasonalRows} />
              </div>
            </div>
          </CascadingContainer>

          <CascadingContainer delay={200}>
            <PerformanceCard plants={enrichedPerformance} loading={analyticsLoading} />
          </CascadingContainer>
        </div>
        </LoadingTransition>
      </main>
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

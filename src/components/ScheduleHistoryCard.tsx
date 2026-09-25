import React, { useState, useEffect } from "react";
import { Calendar, Droplets, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { scheduleVersioningService } from "@/services/scheduleVersioningService";
import { Season } from "@/services/seasonalDetectionService";
import type { Database } from "@/integrations/supabase/types";

type PlantSeasonalSchedule =
  Database["public"]["Tables"]["plant_seasonal_schedules"]["Row"];

interface ScheduleHistoryCardProps {
  plantId: string;
  plantName: string;
  currentSchedule?: number;
}

interface SeasonSchedules {
  season: Season;
  schedules: PlantSeasonalSchedule[];
}

const seasonOrder: Season[] = ["spring", "summer", "fall", "winter"];

const seasonEmoji: Record<Season, string> = {
  spring: "🌸",
  summer: "☀️",
  fall: "🍂",
  winter: "❄️",
};

const seasonColors: Record<Season, string> = {
  spring: "bg-sprout-success text-sprout-dark",
  summer: "bg-sprout-cream text-sprout-dark",
  fall: "bg-sprout-warning text-sprout-dark",
  winter: "bg-sprout-water text-sprout-dark",
};

export function ScheduleHistoryCard({
  plantId,
  plantName,
  currentSchedule,
}: ScheduleHistoryCardProps) {
  const [scheduleHistory, setScheduleHistory] = useState<SeasonSchedules[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lives in its own tab of the edit dialog, so it loads as soon as the tab opens
  useEffect(() => {
    loadScheduleHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantId]);

  const loadScheduleHistory = async () => {
    try {
      setIsLoading(true);

      // Load history for each season
      const seasonData: SeasonSchedules[] = [];

      for (const season of seasonOrder) {
        const schedules = await scheduleVersioningService.getScheduleHistory(
          plantId,
          season
        );
        if (schedules.length > 0) {
          seasonData.push({ season, schedules });
        }
      }

      setScheduleHistory(seasonData);
    } catch (error) {
      console.error("Error loading schedule history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getChangeIcon = (previous: number, current: number) => {
    if (current > previous)
      return <TrendingUp className="h-4 w-4 text-muted-foreground" aria-label="Longer than the year before" />;
    if (current < previous)
      return <TrendingDown className="h-4 w-4 text-muted-foreground" aria-label="Shorter than the year before" />;
    return <Minus className="h-4 w-4 text-muted-foreground" aria-label="Same as the year before" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const getLatestScheduleForSeason = (season: Season) => {
    const seasonData = scheduleHistory.find((s) => s.season === season);
    if (!seasonData || seasonData.schedules.length === 0) return null;

    return seasonData.schedules[0]; // Already sorted by year desc
  };

  const hasAnyHistory = scheduleHistory.some((s) => s.schedules.length > 0);

  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading schedule history">
        <Skeleton className="h-[76px] w-full rounded-[22px]" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {seasonOrder.map((season) => (
            <Skeleton key={season} className="h-24 rounded-[22px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {currentSchedule && (
        <div className="rounded-[22px] bg-card p-4 flex items-center gap-3">
          <div className="w-11 h-11 shrink-0 rounded-[14px] bg-sprout-water text-sprout-dark flex items-center justify-center">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.8px] text-muted-foreground">Current schedule</p>
            <p className="font-display text-lg font-bold text-foreground">Every {currentSchedule} days</p>
          </div>
        </div>
      )}

      {!hasAnyHistory ? (
        <div className="rounded-3xl bg-card p-5 flex items-start gap-3.5">
          <div className="w-11 h-11 shrink-0 rounded-[14px] bg-field text-foreground flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-foreground">No schedule history yet</p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
              This tracks how {plantName}'s watering schedule changes with the seasons. History appears when you
              adjust the schedule or apply a seasonal recommendation.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Seasonal pattern overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {seasonOrder.map((season) => {
              const latestSchedule = getLatestScheduleForSeason(season);
              return (
                <div
                  key={season}
                  className={cn(
                    "rounded-[22px] p-3.5",
                    latestSchedule ? seasonColors[season] : "bg-card text-muted-foreground"
                  )}
                >
                  <div className="text-xs font-bold uppercase tracking-[0.8px]">
                    <span aria-hidden="true">{seasonEmoji[season]} </span>
                    {season}
                  </div>
                  <div className="font-display text-lg font-bold mt-1">
                    {latestSchedule ? `${latestSchedule.watering_days} days` : "No data"}
                  </div>
                  {latestSchedule && <div className="text-[13px] font-semibold">{latestSchedule.year}</div>}
                </div>
              );
            })}
          </div>

          {/* Detailed history by season */}
          {scheduleHistory.map(({ season, schedules }) => (
            <section key={season} className="rounded-3xl bg-card p-4">
              <h4 className="flex items-center gap-2 text-[15px] font-bold text-foreground capitalize">
                <span aria-hidden="true">{seasonEmoji[season]}</span>
                {season}
                <span className="text-xs font-bold normal-case px-2 py-0.5 rounded-full bg-field text-muted-foreground">
                  {schedules.length} {schedules.length === 1 ? "year" : "years"}
                </span>
              </h4>

              <ul className="space-y-1.5 mt-3">
                {schedules.map((schedule, index) => {
                  const previousSchedule = schedules[index + 1];
                  const conditions = schedule.weather_conditions as Record<string, unknown> | null;
                  return (
                    <li key={schedule.id} className="flex items-center gap-3 rounded-[16px] bg-field px-3.5 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground">{schedule.year}</p>
                        <p className="text-xs text-muted-foreground">
                          {schedule.applied_at ? formatDate(schedule.applied_at) : "Not applied"}
                        </p>
                      </div>
                      {previousSchedule && getChangeIcon(previousSchedule.watering_days, schedule.watering_days)}
                      <span className="text-sm font-bold text-foreground">{schedule.watering_days} days</span>
                      {schedule.user_modified && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-card text-foreground">Custom</span>
                      )}
                      {conditions && typeof conditions === "object" && "temperature" in conditions && (
                        <span className="ml-auto text-xs text-muted-foreground">{String(conditions.temperature)}°C</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          {scheduleHistory.length >= 2 && (
            <div className="rounded-3xl bg-sprout-cream text-sprout-dark p-4 flex items-start gap-2.5">
              <Sparkles className="h-5 w-5 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-bold">Pattern insights</p>
                <div className="font-medium space-y-1 mt-0.5">{getScheduleInsights()}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  function getScheduleInsights(): React.ReactNode[] {
    const insights: React.ReactNode[] = [];

    // Find most and least frequent watering seasons
    const seasonAverages = seasonOrder
      .map((season) => {
        const schedules =
          scheduleHistory.find((s) => s.season === season)?.schedules || [];
        if (schedules.length === 0) return null;

        const avg =
          schedules.reduce((sum, s) => sum + s.watering_days, 0) /
          schedules.length;
        return { season, average: avg };
      })
      .filter(Boolean) as Array<{ season: Season; average: number }>;

    if (seasonAverages.length >= 2) {
      const sorted = [...seasonAverages].sort((a, b) => a.average - b.average);
      const mostFrequent = sorted[0];
      const leastFrequent = sorted[sorted.length - 1];

      insights.push(
        <div key="frequency">
          You water most frequently in <strong>{mostFrequent.season}</strong> (
          {Math.round(mostFrequent.average)} days) and least in{" "}
          <strong>{leastFrequent.season}</strong> (
          {Math.round(leastFrequent.average)} days)
        </div>
      );
    }

    // Check for consistency
    const hasCustomizations = scheduleHistory.some((s) =>
      s.schedules.some((schedule) => schedule.user_modified)
    );

    if (hasCustomizations) {
      insights.push(
        <div key="customization">
          You've made custom adjustments, showing attentive plant care
        </div>
      );
    }

    return insights;
  }
}

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  History,
  Calendar,
  Droplets,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";
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
  spring: "bg-green-100 text-green-800 border-green-200",
  summer: "bg-yellow-100 text-yellow-800 border-yellow-200",
  fall: "bg-orange-100 text-orange-800 border-orange-200",
  winter: "bg-blue-100 text-blue-800 border-blue-200",
};

export function ScheduleHistoryCard({
  plantId,
  plantName,
  currentSchedule,
}: ScheduleHistoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [scheduleHistory, setScheduleHistory] = useState<SeasonSchedules[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isExpanded && scheduleHistory.length === 0) {
      loadScheduleHistory();
    }
  }, [isExpanded, plantId]);

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
      return <TrendingUp className="h-3 w-3 text-blue-500" />;
    if (current < previous)
      return <TrendingDown className="h-3 w-3 text-orange-500" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
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

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <History className="h-5 w-5 text-gray-500" />
            <span>Schedule History</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="text-sm">
              {isExpanded ? "Collapse" : "View History"}
            </span>
          </Button>
        </div>

        {/* Show preview when collapsed */}
        {!isExpanded && (
          <div className="mt-2 text-sm text-sprout-light dark:text-sprout-light">
            {isLoading
              ? "Loading..."
              : hasAnyHistory
              ? `Seasonal watering adjustments for ${plantName}`
              : "Track seasonal watering schedule changes over time"}
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sprout-medium dark:text-sprout-light">
              <div className="animate-spin mr-2">
                <Sparkles className="h-5 w-5" />
              </div>
              Loading history...
            </div>
          ) : !hasAnyHistory ? (
            <div className="text-center py-8 text-sprout-medium dark:text-sprout-light">
              <Calendar className="h-8 w-8 mx-auto mb-3 text-sprout-medium dark:text-sprout-light opacity-60" />
              <p className="text-base font-medium mb-2 text-sprout-dark dark:text-sprout-white">
                No schedule history yet
              </p>
              <p className="text-sm mb-4 max-w-md mx-auto leading-relaxed">
                This section tracks how your watering schedule changes with the
                seasons. History will appear when you adjust schedules or when
                seasonal recommendations are applied.
              </p>
              <div className="text-xs text-sprout-medium dark:text-sprout-light space-y-1 opacity-80">
                <p>• Seasonal schedule adjustments</p>
                <p>• Smart watering recommendations</p>
                <p>• Manual schedule changes</p>
                <p>• Weather-based modifications</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Schedule */}
              {currentSchedule && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-blue-900">
                        Current Schedule
                      </div>
                      <div className="text-sm text-blue-700">
                        Every {currentSchedule} days
                      </div>
                    </div>
                    <Droplets className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              )}

              <Separator />

              {/* Seasonal Pattern Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {seasonOrder.map((season) => {
                  const latestSchedule = getLatestScheduleForSeason(season);
                  const seasonName =
                    season.charAt(0).toUpperCase() + season.slice(1);

                  return (
                    <div
                      key={season}
                      className={`p-3 rounded-lg border ${
                        seasonColors[season]
                      } ${!latestSchedule ? "opacity-50" : ""}`}
                    >
                      <div className="text-center">
                        <div className="text-lg mb-1">
                          {seasonEmoji[season]}
                        </div>
                        <div className="text-xs font-medium mb-1">
                          {seasonName}
                        </div>
                        <div className="text-sm">
                          {latestSchedule
                            ? `${latestSchedule.watering_days} days`
                            : "No data"}
                        </div>
                        {latestSchedule && (
                          <div className="text-xs opacity-75 mt-1">
                            {latestSchedule.year}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detailed History by Season */}
              {scheduleHistory.map(({ season, schedules }) => (
                <div key={season} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="text-lg">{seasonEmoji[season]}</div>
                    <h4 className="font-medium capitalize">{season} History</h4>
                    <Badge variant="outline" className="text-xs">
                      {schedules.length}{" "}
                      {schedules.length === 1 ? "year" : "years"}
                    </Badge>
                  </div>

                  <div className="space-y-2 ml-6">
                    {schedules.map((schedule, index) => {
                      const previousSchedule = schedules[index + 1];

                      return (
                        <div
                          key={schedule.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="text-sm">
                              <div className="font-medium">{schedule.year}</div>
                              <div className="text-xs text-gray-600">
                                {schedule.applied_at
                                  ? formatDate(schedule.applied_at)
                                  : "Not applied"}
                              </div>
                            </div>

                            {previousSchedule && (
                              <div className="flex items-center space-x-1">
                                {getChangeIcon(
                                  previousSchedule.watering_days,
                                  schedule.watering_days
                                )}
                              </div>
                            )}

                            <div className="text-sm">
                              <span className="font-medium">
                                {schedule.watering_days} days
                              </span>
                              {schedule.user_modified && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-xs"
                                >
                                  Custom
                                </Badge>
                              )}
                            </div>
                          </div>

                          {schedule.weather_conditions && (
                            <div className="text-xs text-gray-500">
                              {typeof schedule.weather_conditions ===
                                "object" &&
                                schedule.weather_conditions !== null &&
                                "temperature" in
                                  schedule.weather_conditions && (
                                  <span>
                                    {
                                      (schedule.weather_conditions as any)
                                        .temperature
                                    }
                                    °C
                                  </span>
                                )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Insights */}
              {scheduleHistory.length >= 2 && (
                <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Sparkles className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium text-green-900 mb-1">
                        Pattern Insights
                      </div>
                      <div className="text-green-800 space-y-1">
                        {getScheduleInsights()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
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

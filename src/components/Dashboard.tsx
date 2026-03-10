import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CloudRain, Calendar } from "lucide-react";
import { calculateWateringSchedule } from "@/utils/watering/schedule";
import { hookLogger } from "@/utils/hookLogging";
import { useDialogState } from "@/hooks/useDialogState";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { CareStatusOverview } from "@/components/dashboard/CareStatusOverview";
import { DashboardTodaysTasks } from "@/components/dashboard/DashboardTodaysTasks";
import { DashboardRecentActivity } from "@/components/dashboard/DashboardRecentActivity";
import { DashboardHealthInsights } from "@/components/dashboard/DashboardHealthInsights";
import { DashboardPlantGallery } from "@/components/dashboard/DashboardPlantGallery";
import MyPlantsBlogSection from "@/components/blog/MyPlantsBlogSection";
import { DashboardDialogs } from "@/components/dashboard/DashboardDialogs";

const COMPONENT_NAME = "Dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { LoadingTransition } from "@/components/ui/loading-transition";
import { useUserPlants } from "@/hooks/useUserPlants";
import { useProfileData } from "@/contexts/ProfileDataContext";
import { useSeasonalDetection } from "@/hooks/useSeasonalDetection";
import { useSeasonalSuggestions } from "@/hooks/useSeasonalSuggestions";
import { useWeatherData } from "@/hooks/useWeatherData";
import { useLocation } from "@/hooks/useLocation";
import { useSmartWateringPreferences } from "@/hooks/useSmartWateringPreferences";
import { useCalendarSeasonalNotification } from "@/hooks/useCalendarSeasonalNotification";
import { WeatherMoodBanner } from "@/components/WeatherMoodBanner";
import { calculateRainDelay } from "@/utils/watering/rainDelay";
import { SeasonalReviewBanner } from "./SeasonalReviewBanner";
import { CalendarSeasonalBanner } from "./CalendarSeasonalBanner";
import { SmartSuggestionsBanner } from "./SmartSuggestionsBanner";
import { EnableWeatherPrompt } from "./EnableWeatherPrompt";
import { shouldShowOverwateringWarning } from "@/utils/plants/overwatering";
import { useBulkPatternAnalysis } from "@/hooks/useWateringPatternAnalysis";
import { useDismissedSuggestions } from "@/hooks/useDismissedSuggestions";
import type { PatternInsight } from "@/types/wateringPatternTypes";
import { useKeyboardShortcuts, createPlantShortcuts } from "@/hooks/useKeyboardShortcuts";
import { usePlantNotifications } from "@/hooks/usePlantNotifications";
import { useCareStreak } from "@/hooks/useCareStreak";

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { plants, loading, waterPlant, fetchPlants, updatePlantSchedule } =
    useUserPlants();
  const { profileData } = useProfileData();
  const { preferences, hasPreferences: hasLoadedPreferences, loadPreferences } = useSmartWateringPreferences();
  const location = useLocation({
    autoRequest: false, // Don't auto-request, only fetch if user has weather enabled
  });
  const weather = useWeatherData({
    location: location.location,
    autoFetch: !!preferences?.use_weather_data && !!location.location,
  });
  const navigate = useNavigate();

  // Handle refresh from onboarding
  useEffect(() => {
    const shouldRefresh = searchParams.get('refresh');
    if (shouldRefresh === 'true') {
      // Remove the refresh parameter from URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('refresh');
      setSearchParams(newParams, { replace: true });

      // Reload preferences which will trigger location request via separate effect
      if (loadPreferences) {
        loadPreferences();
      }
    }
  }, [searchParams, setSearchParams, loadPreferences]);

  // Request location when weather is enabled in preferences
  useEffect(() => {
    if (preferences?.use_weather_data && !location.location && location.requestLocation) {
      hookLogger.info(COMPONENT_NAME, 'Weather enabled, requesting location');
      location.requestLocation().catch((error) => {
        hookLogger.warn(COMPONENT_NAME, 'Failed to get location:', error);
      });
    }
  }, [preferences?.use_weather_data, location.location]);

  // Dialog states using useDialogState hook
  const addDialog = useDialogState();
  const bulkWaterDialog = useDialogState();
  const seasonalReviewDialog = useDialogState();
  const calendarSeasonalDialog = useDialogState();
  const smartSuggestionsDialog = useDialogState();

  // Use database-backed dismissed suggestions hook
  const {
    dismissedPlantIds: dismissedSuggestions,
    dismissSuggestion: dismissSingleSuggestion,
    dismissSuggestions: dismissMultipleSuggestions,
    loading: isDismissedSuggestionsLoading,
    migrateLocalToDatabase,
  } = useDismissedSuggestions();

  const isDismissedSuggestionsLoaded = !isDismissedSuggestionsLoading;
  const [waterConfirmation, setWaterConfirmation] = useState<{
    show: boolean;
    plantId: string;
    plantName: string;
    lastWatered?: string;
    suggestedWateringDays?: number;
  }>({
    show: false,
    plantId: "",
    plantName: "",
  });
  const [fullscreenImage, setFullscreenImage] = useState<{
    show: boolean;
    src: string;
    alt: string;
    plantName: string;
    imageSource?: string;
  }>({
    show: false,
    src: "",
    alt: "",
    plantName: "",
  });

  // Weather-based seasonal detection and suggestions (requires weather data enabled)
  const { pendingTransition, shouldShowReview, dismissReview, snoozeReview } =
    useSeasonalDetection();

  const {
    suggestions,
    isLoading: isSuggestionsLoading,
    applySuggestion,
    applyAllSuggestions,
    customizeSchedule,
    hasUnappliedSuggestions,
  } = useSeasonalSuggestions({
    newSeason: pendingTransition?.to_season || null,
    weatherConditions: weather.weatherData,
    enabled: shouldShowReview && !!pendingTransition,
  });

  // Calendar-based seasonal notifications (works without weather data)
  const {
    upcomingChange: calendarSeasonChange,
    shouldShowNotification: shouldShowCalendarNotification,
    plantSuggestions: calendarPlantSuggestions,
    isLoading: isCalendarSuggestionsLoading,
    dismissNotification: dismissCalendarNotification,
    snoozeNotification: snoozeCalendarNotification,
    applyAllSuggestions: applyAllCalendarSuggestions,
    applySuggestion: applyCalendarSuggestion,
  } = useCalendarSeasonalNotification(location.location?.latitude || 0);

  // Track which plants have been applied in calendar suggestions
  const [appliedCalendarPlants, setAppliedCalendarPlants] = useState<
    Set<string>
  >(new Set());

  // Care streak check - verifies recent waterings were actually on time
  const { hasStreak: hasCareStreak, checkStreak } = useCareStreak();

  useEffect(() => {
    if (!loading && plants.length > 0) {
      checkStreak(plants);
    }
  }, [loading, plants, checkStreak]);

  // Smart suggestions analysis - stabilize plantIds to prevent infinite re-renders
  const plantIds = useMemo(() => plants.map((plant) => plant.id), [plants]);
  const {
    plantsWithSuggestions,
    isLoading: isSuggestionsAnalyzing,
    refreshAnalysis: refreshSuggestionsAnalysis,
  } = useBulkPatternAnalysis(plantIds);

  // Migrate localStorage dismissed suggestions to database (one-time migration)
  useEffect(() => {
    migrateLocalToDatabase();
  }, [migrateLocalToDatabase]);

  // Filter out dismissed suggestions - only after dismissed suggestions are loaded
  const activePlantsWithSuggestions = useMemo(() => {
    if (!isDismissedSuggestionsLoaded) {
      return []; // Return empty array until dismissed suggestions are loaded
    }
    return plantsWithSuggestions.filter(
      (plant) => !dismissedSuggestions.has(plant.plantId)
    );
  }, [
    plantsWithSuggestions,
    dismissedSuggestions,
    isDismissedSuggestionsLoaded,
  ]);

  // Request location if user has weather enabled and we don't have location yet
  useEffect(() => {
    if (
      preferences?.use_weather_data &&
      !location.location &&
      !location.isLoading
    ) {
      location.requestLocation();
    }
  }, [preferences?.use_weather_data, location]);

  // Only gate the skeleton on plant data — profile is only used for the
  // greeting which already has a fallback ("Welcome back, plant parent!").
  // This avoids keeping the skeleton visible while the profile fetch resolves.
  const isLoading = loading;

  // Get the user's first name, with fallback to "plant parent"
  const firstName = profileData.first_name?.trim();
  const greeting = firstName
    ? `Welcome back, ${firstName}!`
    : "Welcome back, plant parent!";

  // Calculate care statistics using the new watering calculation utility
  const totalPlants = plants.length;

  // Setup keyboard shortcuts - MUST be before any early returns
  useKeyboardShortcuts({
    shortcuts: createPlantShortcuts({
      onAddPlant: () => addDialog.open(),
      onWaterAllDue: () => {
        const plantsNeedingWater = plants.filter((plant) => {
          const calc = calculateWateringSchedule(plant);
          return calc.isOverdue || calc.daysUntilWatering === 0;
        });
        if (plantsNeedingWater.length > 0) {
          bulkWaterDialog.open();
        }
      },
    }),
  });

  // Automatically generate notifications from plant data
  usePlantNotifications(plants, !loading);

  const careStats = plants.reduce(
    (stats, plant) => {
      const wateringCalc = calculateWateringSchedule(plant);

      if (wateringCalc.hasUnknownWateringDate) {
        stats.plantsWithoutWateringData++;
      } else if (wateringCalc.isOverdue) {
        stats.overduePlants++;
        stats.plantsNeedingWaterToday++;
      } else if (wateringCalc.daysUntilWatering === 0) {
        // Only count plants that are actually due today, not postponed ones
        stats.plantsNeedingWaterToday++;
      }
      // Note: postponed plants are intentionally not counted as "needing water today"

      return stats;
    },
    {
      plantsWithoutWateringData: 0,
      plantsNeedingWaterToday: 0,
      overduePlants: 0,
    }
  );

  const { plantsWithoutWateringData, plantsNeedingWaterToday, overduePlants } =
    careStats;

  // Calculate plants needing water in the next 1-2 days (for upcoming care card)
  const plantsUpcomingSoon = plants.filter((plant) => {
    const wateringCalc = calculateWateringSchedule(plant);
    return !wateringCalc.hasUnknownWateringDate &&
           !wateringCalc.isOverdue &&
           wateringCalc.daysUntilWatering > 0 &&
           wateringCalc.daysUntilWatering <= 2;
  }).length;

  // Calculate care streak (consecutive days with all plants watered on time)
  const hasActiveCareRoutine = totalPlants > 0 &&
                                 overduePlants === 0 &&
                                 plantsWithoutWateringData === 0;

  const recentlyAddedCount = plants.filter((plant) => {
    const plantDate = new Date(plant.created_at);
    const daysDiff = Math.floor(
      (Date.now() - plantDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff <= 7;
  }).length;

  // Get plants needing water today (for task list) using the new utility
  const plantsNeedingWater = plants
    .filter((plant) => {
      const wateringCalc = calculateWateringSchedule(plant);
      return (
        !wateringCalc.hasUnknownWateringDate &&
        (wateringCalc.isOverdue || wateringCalc.daysUntilWatering === 0)
        // Note: postponed plants are excluded from today's task list
      );
    })
    .sort((a, b) => {
      const calcA = calculateWateringSchedule(a);
      const calcB = calculateWateringSchedule(b);

      // Sort by priority: overdue first (by how overdue), then due today
      if (calcA.isOverdue && calcB.isOverdue) {
        return calcA.daysUntilWatering - calcB.daysUntilWatering; // More overdue first (more negative)
      }
      if (calcA.isOverdue && !calcB.isOverdue) return -1;
      if (!calcA.isOverdue && calcB.isOverdue) return 1;

      return 0; // Equal priority
    });

  // Check for outdoor plants that should be rain-delayed
  const outdoorPlantsWithRainDelay = useMemo(() => {
    if (!weather.weatherData || !preferences?.use_weather_data) {
      return [];
    }

    return plantsNeedingWater
      .filter((plant) => plant.is_outdoor_plant)
      .map((plant) => {
        const rainDelay = calculateRainDelay(weather.weatherData, {
          isOutdoorPlant: true,
        });
        return {
          plant,
          rainDelay,
        };
      })
      .filter((item) => item.rainDelay.shouldDelay);
  }, [plantsNeedingWater, weather.weatherData, preferences?.use_weather_data]);

  // Get recent activities (recently watered plants)
  const recentlyWateredPlants = plants
    .filter((plant) => plant.latest_watering)
    .sort(
      (a, b) =>
        new Date(b.latest_watering!).getTime() -
        new Date(a.latest_watering!).getTime()
    )
    .slice(0, 5);

  // Get favorite plants (most recently cared for)
  const favoritePlants = plants
    .filter((plant) => plant.latest_watering)
    .sort(
      (a, b) =>
        new Date(b.latest_watering!).getTime() -
        new Date(a.latest_watering!).getTime()
    )
    .slice(0, 4);

  // Get unique plant type names for blog post matching
  const myPlantNames = useMemo(
    () => [...new Set(plants.map((p) => p.plant_type).filter(Boolean))],
    [plants]
  );

  // Check if we should show the smart suggestions banner - only after dismissed suggestions are loaded
  const shouldShowSmartSuggestionsBanner = useMemo(() => {
    return (
      isDismissedSuggestionsLoaded && activePlantsWithSuggestions.length > 0
    );
  }, [isDismissedSuggestionsLoaded, activePlantsWithSuggestions]);

  const handleQuickWater = (plantId: string, plantName: string) => {
    const plant = plants.find((p) => p.id === plantId);
    setWaterConfirmation({
      show: true,
      plantId,
      plantName,
      lastWatered: plant?.latest_watering,
      suggestedWateringDays: plant?.suggested_watering_days || 7,
    });
  };

  const handleConfirmQuickWater = async (notes?: string) => {
    // Capture the plant ID before closing the dialog
    const plantId = waterConfirmation.plantId;

    // Close dialog immediately to prevent duplicate confirmations
    setWaterConfirmation({ show: false, plantId: "", plantName: "" });

    // Then process the watering asynchronously
    await waterPlant(plantId, notes || `Quick watered from dashboard`);
  };

  const handleAlreadyWatered = async (_date: string, notes?: string) => {
    const plantId = waterConfirmation.plantId;
    setWaterConfirmation({ show: false, plantId: "", plantName: "" });
    // FUTURE FEATURE: Implement backdating watering to a specific date
    // This would require modifying waterPlant to accept a date parameter
    // For now, just water the plant with current timestamp
    await waterPlant(plantId, notes || `Backdated watering from dashboard`);
  };

  const handleImageClick = (
    imageSrc: string,
    plantName: string,
    imageSource?: string
  ) => {
    setFullscreenImage({
      show: true,
      src: imageSrc,
      alt: plantName,
      plantName,
      imageSource,
    });
  };

  const handleBulkWater = async () => {
    // Close dialog first to prevent UI issues
    bulkWaterDialog.close();

    // Don't proceed if there are no plants to water
    if (plantsNeedingWater.length === 0) {
      return;
    }

    // Water all plants that need watering today
    const waterPromises = plantsNeedingWater.map((plant) =>
      waterPlant(plant.id, `Bulk watered from dashboard`)
    );

    try {
      await Promise.all(waterPromises);
      // Success feedback will be handled by the useUserPlants hook
    } catch (error) {
      hookLogger.error(COMPONENT_NAME, "Error bulk watering plants", error);
    }
  };

  // Smart suggestions handlers
  const handleSmartSuggestionsReview = () => {
    smartSuggestionsDialog.open();
  };

  const handleDismissAllSuggestions = () => {
    const allPlantIds = activePlantsWithSuggestions.map(
      (plant) => plant.plantId
    );
    dismissMultipleSuggestions(allPlantIds, "user_dismissed");
  };

  const handleSnoozeSuggestions = (_weeks: number) => {
    // For now, just dismiss suggestions with snooze tracking
    // In a real implementation, you could implement time-based snoozing
    const allPlantIds = activePlantsWithSuggestions.map(
      (plant) => plant.plantId
    );
    dismissMultipleSuggestions(allPlantIds, "user_dismissed");
  };

  const handleApplyAllSuggestions = async () => {
    // Apply all schedule adjustments
    const appliedPlantIds: string[] = [];

    for (const plant of activePlantsWithSuggestions) {
      for (const insight of plant.insights) {
        if (insight.suggestion && insight.actionable) {
          try {
            // Find the plant in our plants array to apply the schedule change
            const plantData = plants.find((p) => p.id === plant.plantId);
            if (plantData && onScheduleAdjustment) {
              await onScheduleAdjustment(
                plant.plantId,
                insight.suggestion.suggestedSchedule
              );
              if (!appliedPlantIds.includes(plant.plantId)) {
                appliedPlantIds.push(plant.plantId);
              }
            }
          } catch (error) {
            hookLogger.error(
              COMPONENT_NAME,
              `Failed to apply suggestion for plant ${plant.plantId}`,
              error
            );
          }
        }
      }
    }

    // Mark applied suggestions as dismissed with 'applied' reason
    if (appliedPlantIds.length > 0) {
      dismissMultipleSuggestions(appliedPlantIds, "applied");
    }

    // Refresh suggestions after applying changes
    setTimeout(() => refreshSuggestionsAnalysis(), 1000);
  };

  const handleApplySuggestion = async (
    plantId: string,
    insight: PatternInsight
  ) => {
    if (insight.suggestion && onScheduleAdjustment) {
      try {
        await onScheduleAdjustment(
          plantId,
          insight.suggestion.suggestedSchedule
        );

        // Mark this plant's suggestions as dismissed with 'applied' reason
        dismissSingleSuggestion(plantId, "applied");

        // Refresh suggestions after applying change
        setTimeout(() => refreshSuggestionsAnalysis(), 1000);
      } catch (error) {
        hookLogger.error(
          COMPONENT_NAME,
          `Failed to apply suggestion for plant ${plantId}`,
          error
        );
      }
    }
  };

  const handleDismissPlantSuggestions = (plantId: string) => {
    dismissSingleSuggestion(plantId, "user_dismissed");
  };

  const handleViewPlantHistory = (plantId: string) => {
    // Navigate to the plant's history - this would need to be implemented
    // For now, just close the dialog and potentially navigate to the plant detail page
    smartSuggestionsDialog.close();
    navigate(`/my-plants/${plantId}`);
  };

  // Schedule adjustment handler - now fully implemented
  const onScheduleAdjustment = async (plantId: string, newSchedule: number) => {
    await updatePlantSchedule(plantId, newSchedule);
  };

  return (
    <LoadingTransition loading={isLoading} skeleton={<DashboardSkeleton />}>
    <div
      data-testid="dashboard"
      className="py-8 bg-background min-h-[calc(100vh-4rem)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <WelcomeHeader greeting={greeting} />

        {/* Weather Mood Banner - cascades in gracefully when data loads */}
        {preferences?.use_weather_data && (
          <div
            className="grid transition-[grid-template-rows] duration-700 ease-out"
            style={{
              gridTemplateRows: weather.weatherData && !weather.isLoading ? '1fr' : '0fr',
            }}
          >
            <div className="overflow-hidden">
              <div
                className="transition-all duration-700 ease-out mb-6"
                style={{
                  opacity: weather.weatherData && !weather.isLoading ? 1 : 0,
                  transform: weather.weatherData && !weather.isLoading
                    ? 'translateY(0)'
                    : 'translateY(-8px)',
                }}
              >
                {weather.weatherData && (
                  <div data-testid="weather-mood-banner">
                    <WeatherMoodBanner
                      weatherData={weather.weatherData}
                      temperatureUnit={preferences?.temperature_unit || "F"}
                      lastUpdated={weather.lastUpdated}
                      onRefresh={() => weather.refreshWeather()}
                      isRefreshing={weather.isLoading}
                      isFallback={weather.isFallback}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Weather-based Seasonal Review Banner (requires weather enabled) */}
        {shouldShowReview && pendingTransition && suggestions.length > 0 && (
          <CascadingContainer delay={50}>
            <div data-testid="seasonal-review-banner">
              <SeasonalReviewBanner
                transition={pendingTransition}
                plantsNeedingReview={suggestions.length}
                onReviewClick={() => seasonalReviewDialog.open()}
                onDismiss={dismissReview}
                onSnooze={snoozeReview}
              />
            </div>
          </CascadingContainer>
        )}

        {/* Calendar-based Seasonal Notification (works without weather) */}
        {shouldShowCalendarNotification &&
          calendarSeasonChange &&
          !shouldShowReview && (
            <CascadingContainer delay={50}>
              <div data-testid="calendar-seasonal-banner">
                <CalendarSeasonalBanner
                  upcomingChange={calendarSeasonChange}
                  plantCount={calendarPlantSuggestions.length}
                  onReviewClick={() => calendarSeasonalDialog.open()}
                  onDismiss={dismissCalendarNotification}
                  onSnooze={snoozeCalendarNotification}
                />
              </div>
            </CascadingContainer>
          )}

        {/* Smart Suggestions Banner */}
        {shouldShowSmartSuggestionsBanner && (
          <CascadingContainer delay={100}>
            <div data-testid="smart-suggestions-banner">
              <SmartSuggestionsBanner
                plantsWithSuggestions={activePlantsWithSuggestions.map(
                  (plant) => {
                    const plantData = plants.find(
                      (p) => p.id === plant.plantId
                    );
                    return {
                      id: plant.plantId,
                      name: plantData?.nickname || "Unknown Plant",
                      suggestionsCount: plant.insights.length,
                      highPrioritySuggestions: plant.insights.filter(
                        (i) => i.severity === "high"
                      ).length,
                    };
                  }
                )}
                totalSuggestions={activePlantsWithSuggestions.reduce(
                  (sum, plant) => sum + plant.insights.length,
                  0
                )}
                onReviewClick={handleSmartSuggestionsReview}
                onDismiss={handleDismissAllSuggestions}
                onSnooze={handleSnoozeSuggestions}
              />
            </div>
          </CascadingContainer>
        )}

        {/* Quick Actions */}
        <QuickActions
          plantsNeedingWaterCount={plantsNeedingWater.length}
          onAddPlantClick={() => addDialog.open()}
          onWaterPlantsClick={() => {
            if (plantsNeedingWater.length > 0) {
              bulkWaterDialog.open();
            }
          }}
          onViewAllPlantsClick={() => navigate("/my-plants")}
        />

        {/* Care Status Overview */}
        <CareStatusOverview
          totalPlants={totalPlants}
          plantsNeedingWaterToday={plantsNeedingWaterToday}
          overduePlants={overduePlants}
          recentlyAddedCount={recentlyAddedCount}
        />

        {/* Enable Weather Prompt - only show once preferences have loaded and weather is off */}
        {hasLoadedPreferences && !preferences?.use_weather_data && (
          <CascadingContainer delay={200}>
            <div data-testid="enable-weather-prompt">
              <EnableWeatherPrompt />
            </div>
          </CascadingContainer>
        )}

        {/* Rain Delay Notification - Show when outdoor plants can skip watering */}
        {outdoorPlantsWithRainDelay.length > 0 && weather.weatherData && (
          <CascadingContainer delay={275}>
            <div data-testid="rain-delay-notification" className="mb-6">
              <Card className="border-blue-400 bg-blue-400/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <CloudRain className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-sprout-white">
                          Rain Expected - Watering Can Wait
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {weather.weatherData.upcoming_rain_probability}%
                          chance
                        </Badge>
                      </div>
                      <p className="text-sm text-sprout-light">
                        {outdoorPlantsWithRainDelay.length} outdoor plant
                        {outdoorPlantsWithRainDelay.length !== 1 ? "s" : ""} can
                        skip watering due to expected rain:
                      </p>
                      <ul className="text-sm text-sprout-light space-y-1 ml-4">
                        {outdoorPlantsWithRainDelay.slice(0, 3).map((item) => (
                          <li key={item.plant.id} className="list-disc">
                            {item.plant.nickname || item.plant.plant_type}
                          </li>
                        ))}
                        {outdoorPlantsWithRainDelay.length > 3 && (
                          <li className="list-none text-xs">
                            +{outdoorPlantsWithRainDelay.length - 3} more
                          </li>
                        )}
                      </ul>
                      {outdoorPlantsWithRainDelay[0]?.rainDelay
                        .nextCheckDate && (
                        <div className="flex items-center gap-2 text-xs text-sprout-light">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Check again on{" "}
                            {outdoorPlantsWithRainDelay[0].rainDelay.nextCheckDate.toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CascadingContainer>
        )}

        {/* Today's Tasks & Recent Activity */}
        <CascadingContainer delay={300}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <DashboardTodaysTasks
              plantsNeedingWater={plantsNeedingWater}
              onQuickWater={handleQuickWater}
              onNavigate={navigate}
            />

            <DashboardRecentActivity
              recentlyWateredPlants={recentlyWateredPlants}
            />
          </div>
        </CascadingContainer>

        {/* Plant Health Insights */}
        <DashboardHealthInsights
          totalPlants={totalPlants}
          plantsWithoutWateringData={plantsWithoutWateringData}
          overduePlants={overduePlants}
          plantsNeedingWaterToday={plantsNeedingWaterToday}
          plantsUpcomingSoon={plantsUpcomingSoon}
          hasActiveCareRoutine={hasActiveCareRoutine}
          hasCareStreak={hasCareStreak}
          onAddPlant={() => addDialog.open()}
          onNavigate={navigate}
        />

        {/* Articles For Your Plants */}
        {myPlantNames.length > 0 && (
          <CascadingContainer delay={400}>
            <div className="mb-8">
              <MyPlantsBlogSection plantNames={myPlantNames} />
            </div>
          </CascadingContainer>
        )}

        {/* Quick Plant Gallery */}
        <DashboardPlantGallery
          favoritePlants={favoritePlants}
          onImageClick={handleImageClick}
          onNavigate={navigate}
        />

        {/* All Dialogs */}
        <DashboardDialogs
          // AddPlantDialog
          addDialogOpen={addDialog.isOpen}
          onAddDialogClose={() => addDialog.close()}
          onPlantAdded={fetchPlants}
          // BulkWater AlertDialog
          bulkWaterDialogOpen={bulkWaterDialog.isOpen}
          onBulkWaterDialogClose={() => bulkWaterDialog.close()}
          onBulkWater={handleBulkWater}
          plantsNeedingWater={plantsNeedingWater}
          // WaterConfirmationDialog
          waterConfirmation={waterConfirmation}
          onWaterConfirmationChange={(open) =>
            setWaterConfirmation({ ...waterConfirmation, show: open })
          }
          onConfirmQuickWater={handleConfirmQuickWater}
          onAlreadyWatered={handleAlreadyWatered}
          showOverwateringWarning={
            shouldShowOverwateringWarning(
              waterConfirmation.lastWatered,
              waterConfirmation.suggestedWateringDays
            ).showWarning
          }
          daysSinceLastWatered={
            shouldShowOverwateringWarning(
              waterConfirmation.lastWatered,
              waterConfirmation.suggestedWateringDays
            ).daysSinceLastWatered
          }
          wateringScheduleDays={waterConfirmation.suggestedWateringDays || 7}
          // FullscreenImageModal
          fullscreenImage={fullscreenImage}
          onFullscreenImageClose={() =>
            setFullscreenImage({ show: false, src: "", alt: "", plantName: "" })
          }
          // SeasonalReviewDialog
          pendingTransition={pendingTransition}
          seasonalReviewDialogOpen={seasonalReviewDialog.isOpen}
          onSeasonalReviewDialogClose={() => seasonalReviewDialog.close()}
          seasonalSuggestions={suggestions}
          isSuggestionsLoading={isSuggestionsLoading}
          onApplySuggestion={applySuggestion}
          onApplyAllSuggestions={applyAllSuggestions}
          onCustomizeSchedule={customizeSchedule}
          hasUnappliedSuggestions={hasUnappliedSuggestions}
          // CalendarSeasonalDialog
          calendarSeasonChange={calendarSeasonChange}
          calendarSeasonalDialogOpen={calendarSeasonalDialog.isOpen}
          onCalendarSeasonalDialogClose={() => calendarSeasonalDialog.close()}
          calendarPlantSuggestions={calendarPlantSuggestions}
          isCalendarSuggestionsLoading={isCalendarSuggestionsLoading}
          onApplyCalendarSuggestion={async (plantId, days) => {
            await applyCalendarSuggestion(plantId, days);
            setAppliedCalendarPlants((prev) => new Set([...prev, plantId]));
          }}
          onApplyAllCalendarSuggestions={async () => {
            await applyAllCalendarSuggestions();
            calendarSeasonalDialog.close();
          }}
          appliedCalendarPlants={appliedCalendarPlants}
          // SmartSuggestionsDialog
          smartSuggestionsDialogOpen={smartSuggestionsDialog.isOpen}
          onSmartSuggestionsDialogClose={() => smartSuggestionsDialog.close()}
          smartPlantSuggestions={activePlantsWithSuggestions.map((plant) => {
            const plantData = plants.find((p) => p.id === plant.plantId);
            return {
              plantId: plant.plantId,
              plantName: plantData?.nickname || "Unknown Plant",
              plantType: plantData?.plant_type || "Unknown Type",
              insights: plant.insights,
            };
          })}
          onApplyAllSmartSuggestions={handleApplyAllSuggestions}
          onApplySmartSuggestion={handleApplySuggestion}
          onDismissAllSuggestions={handleDismissAllSuggestions}
          onDismissPlantSuggestions={handleDismissPlantSuggestions}
          onViewPlantHistory={handleViewPlantHistory}
          dismissedPlantIds={dismissedSuggestions}
          isSuggestionsAnalyzing={isSuggestionsAnalyzing || !isDismissedSuggestionsLoaded}
        />
      </div>
    </div>
    </LoadingTransition>
  );
};

export default Dashboard;

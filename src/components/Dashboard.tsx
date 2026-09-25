import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isToday } from "date-fns";
import { CloudRain, Calendar } from "lucide-react";
import { calculateWateringSchedule } from "@/utils/watering/schedule";
import { hookLogger } from "@/utils/hookLogging";
import { useDialogState } from "@/hooks/useDialogState";
import {
  HomeHeader,
  HomeTiles,
  UpNextList,
} from "@/components/dashboard/BentoHome";
import { DashboardHealthInsights } from "@/components/dashboard/DashboardHealthInsights";
import MyPlantsBlogSection from "@/components/blog/MyPlantsBlogSection";
import { DashboardDialogs } from "@/components/dashboard/DashboardDialogs";

const COMPONENT_NAME = "Dashboard";
import { Button } from "@/components/ui/button";
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
import { useRainDelayFromWeather } from "@/hooks/useRainDelay";
import { SeasonalReviewBanner } from "./SeasonalReviewBanner";
import { CalendarSeasonalBanner } from "./CalendarSeasonalBanner";
import { FertilizationBanner } from "./FertilizationBanner";
import { useFertilizationBanner } from "@/hooks/useFertilizationBanner";
import { SmartSuggestionsBanner } from "./SmartSuggestionsBanner";
import { shouldShowOverwateringWarning } from "@/utils/plants/overwatering";
import { useBulkPatternAnalysis } from "@/hooks/useWateringPatternAnalysis";
import { useDismissedSuggestions } from "@/hooks/useDismissedSuggestions";
import type { PatternInsight } from "@/types/wateringPatternTypes";
import { useKeyboardShortcuts, createPlantShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useCareStreak } from "@/hooks/useCareStreak";
import { useManualNotifications } from "@/hooks/usePlantNotifications";
import { useNotifications } from "@/contexts/NotificationContext";
import { openNotificationCenter } from "@/utils/appEvents";
import { getPlantFertilizationStatus } from "@/utils/plants/fertilizationAdvice";

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    plants,
    loading,
    waterPlant,
    postponeWatering,
    fetchPlants,
    updatePlantSchedule,
    logFertilization,
  } = useUserPlants();
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
  const { notifyWateringSuccess, notifyBulkWatering } = useManualNotifications();
  const { unreadCount } = useNotifications();

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
      location.requestLocation();
    }
  }, [preferences?.use_weather_data, location.location]);

  useEffect(() => {
    if (location.error) {
      hookLogger.warn(COMPONENT_NAME, 'Failed to get location:', location.error);
    }
  }, [location.error]);

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
    // Pass latitude only when we actually have it. Previously this coerced a missing
    // location to `0`, which placed the user on the equator and resolved as northern; now an
    // absent latitude falls through to timezone-based hemisphere inference.
  } = useCalendarSeasonalNotification({
    latitude: location.location?.latitude,
  });

  // Track which plants have been applied in calendar suggestions and their applied values
  const [appliedCalendarPlants, setAppliedCalendarPlants] = useState<
    Map<string, number>
  >(new Map());

  // Care streak check - verifies recent waterings were actually on time
  const {
    hasStreak: hasCareStreak,
    checkStreak,
    streakDays,
    onTimeRate,
    lookbackDays,
  } = useCareStreak();

  useEffect(() => {
    if (!loading && plants.length > 0) {
      checkStreak(plants);
    }
  }, [loading, plants, checkStreak]);

  // Spring fertilization reminder banner
  const {
    shouldShow: shouldShowFertilizationBanner,
    unfertilizedCount,
    unfertilizedPlants,
    dismiss: dismissFertilizationBanner,
    snooze: snoozeFertilizationBanner,
    // Latitude when location is granted; otherwise hemisphere is inferred from the browser
    // timezone, which on the client is a better signal than the stored profile timezone.
  } = useFertilizationBanner(plants, {
    latitude: location.location?.latitude,
  });

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

  // Only gate the skeleton on plant data — profile is only used for the
  // greeting which already has a fallback ("Welcome back, plant parent!").
  // This avoids keeping the skeleton visible while the profile fetch resolves.
  const isLoading = loading;

  const firstName = profileData.first_name?.trim();

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

  // Rain delay advice, shared with the notification center so the two agree. Reuses the
  // weather instance already loaded above rather than mounting a second one.
  const rainDelayByPlantId = useRainDelayFromWeather(
    plants,
    weather.weatherData,
    Boolean(preferences?.use_weather_data)
  );

  const outdoorPlantsWithRainDelay = useMemo(
    () =>
      plantsNeedingWater
        .map((plant) => ({ plant, rainDelay: rainDelayByPlantId[plant.id] }))
        .filter((item) => Boolean(item.rainDelay)),
    [plantsNeedingWater, rainDelayByPlantId]
  );

  // The most overdue plant headlines the Overdue tile (the list is sorted most overdue first)
  const mostOverduePlant = plantsNeedingWater.find(
    (plant) => calculateWateringSchedule(plant).isOverdue
  );
  const mostOverdue = mostOverduePlant
    ? {
        plant: mostOverduePlant,
        days: Math.abs(calculateWateringSchedule(mostOverduePlant).daysUntilWatering ?? 0),
      }
    : null;

  // Plants due in the coming week (not today), soonest first
  const upcomingPlants = plants
    .map((plant) => ({ plant, calc: calculateWateringSchedule(plant) }))
    .filter(
      ({ calc }) =>
        !calc.hasUnknownWateringDate &&
        calc.daysUntilWatering !== null &&
        calc.daysUntilWatering > 0 &&
        calc.daysUntilWatering <= 7
    )
    .sort((a, b) => (a.calc.daysUntilWatering ?? 0) - (b.calc.daysUntilWatering ?? 0))
    .map(({ plant }) => plant);

  const wateredTodayCount = plants.filter(
    (plant) => plant.latest_watering && isToday(new Date(plant.latest_watering))
  ).length;

  const plantsReadyToFeed = plants.filter(
    (plant) => getPlantFertilizationStatus(plant).status.isDue
  );

  const dueThisWeek = upcomingPlants.length;


  // Get unique plant type names for blog post matching
  const myPlantNames = useMemo(
    () => [...new Set(plants.map((p) => p.plant_type).filter(Boolean))],
    [plants]
  );

  // Check if we should show the smart suggestions banner - only after dismissed suggestions are loaded
  // Hide smart suggestions when seasonal banners are active — seasonal takes priority
  const hasActiveSeasonalBanner =
    (shouldShowReview && pendingTransition && suggestions.length > 0) ||
    (shouldShowCalendarNotification && calendarSeasonChange && calendarPlantSuggestions.length > 0);

  const shouldShowSmartSuggestionsBanner = useMemo(() => {
    return (
      isDismissedSuggestionsLoaded &&
      activePlantsWithSuggestions.length > 0 &&
      !hasActiveSeasonalBanner
    );
  }, [isDismissedSuggestionsLoaded, activePlantsWithSuggestions, hasActiveSeasonalBanner]);

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
    // Capture the plant ID and name before closing the dialog
    const plantId = waterConfirmation.plantId;
    const plantName = waterConfirmation.plantName;

    // Close dialog immediately to prevent duplicate confirmations
    setWaterConfirmation({ show: false, plantId: "", plantName: "" });

    // Then process the watering asynchronously
    const success = await waterPlant(plantId, notes || `Quick watered from dashboard`);
    if (success) {
      notifyWateringSuccess(plantName);
    }
  };

  const handleAlreadyWatered = async (date: Date, notes?: string) => {
    const plantId = waterConfirmation.plantId;
    const plantName = waterConfirmation.plantName;
    setWaterConfirmation({ show: false, plantId: "", plantName: "" });
    const success = await waterPlant(
      plantId,
      notes || `Backdated watering from dashboard`,
      date
    );
    if (success) {
      notifyWateringSuccess(plantName);
    }
  };

  /**
   * Defer a rain-delayed plant through the normal postponement mechanism, so its due date moves
   * in the one way the rest of the app understands.
   */
  const handlePostponeForRain = async (plantId: string, days: number) => {
    await postponeWatering(plantId, days, "Rain expected");
  };


  const handleBulkWater = async () => {
    // Close dialog first to prevent UI issues
    bulkWaterDialog.close();

    // Don't proceed if there are no plants to water
    if (plantsNeedingWater.length === 0) {
      return;
    }

    // Water all plants that need watering today
    const wateredCount = plantsNeedingWater.length;
    const waterPromises = plantsNeedingWater.map((plant) =>
      waterPlant(plant.id, `Bulk watered from dashboard`)
    );

    try {
      await Promise.all(waterPromises);
      // Add a single summary notification for the bulk action so the
      // notification center reflects it (each waterPlant only fires a toast).
      notifyBulkWatering(wateredCount);
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
    // Apply concrete schedule adjustments where a suggestion exists, and
    // acknowledge advisory-only insights (no suggestion to apply) so that
    // "Apply All" always clears every suggestion it displayed.
    const resolvedPlantIds: string[] = [];

    for (const plant of activePlantsWithSuggestions) {
      const applicableInsights = plant.insights.filter(
        (insight) => insight.suggestion && insight.actionable
      );

      if (applicableInsights.length === 0) {
        // Advisory-only insights (e.g. frequent postponements): nothing to
        // apply, so acknowledge them as resolved by the user's action.
        resolvedPlantIds.push(plant.plantId);
        continue;
      }

      // Apply each concrete schedule change for this plant. Only mark the plant
      // resolved if at least one change was applied successfully, so failures
      // remain visible for retry.
      let appliedAny = false;
      for (const insight of applicableInsights) {
        try {
          // Find the plant in our plants array to apply the schedule change
          const plantData = plants.find((p) => p.id === plant.plantId);
          if (plantData && onScheduleAdjustment && insight.suggestion) {
            await onScheduleAdjustment(
              plant.plantId,
              insight.suggestion.suggestedSchedule
            );
            appliedAny = true;
          }
        } catch (error) {
          hookLogger.error(
            COMPONENT_NAME,
            `Failed to apply suggestion for plant ${plant.plantId}`,
            error
          );
        }
      }

      if (appliedAny) {
        resolvedPlantIds.push(plant.plantId);
      }
    }

    // Mark resolved suggestions as dismissed with 'applied' reason
    if (resolvedPlantIds.length > 0) {
      dismissMultipleSuggestions(resolvedPlantIds, "applied");
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

  // One plant gets its own water sheet (health check, backdating, notes); several get the bulk dialog
  const openWaterAll = () => {
    if (plantsNeedingWater.length === 1) {
      handleQuickWater(plantsNeedingWater[0].id, plantsNeedingWater[0].nickname);
    } else if (plantsNeedingWater.length > 1) {
      bulkWaterDialog.open();
    }
  };

  return (
    <LoadingTransition loading={isLoading} skeleton={<DashboardSkeleton />}>
    <div
      data-testid="dashboard"
      className="pt-3.5 pb-32 lg:pt-7 lg:pb-10 bg-background"
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <HomeHeader
          firstName={firstName}
          unreadCount={unreadCount}
          onBellClick={openNotificationCenter}
          onAddPlant={() => addDialog.open()}
        />

        <div className="mt-[18px] lg:mt-6">
          <HomeTiles
            weather={{
              enabled: !!preferences?.use_weather_data,
              preferencesLoaded: hasLoadedPreferences,
              data: weather.weatherData ?? null,
              unit: preferences?.temperature_unit || "F",
              isLoading: weather.isLoading,
            }}
            streak={{
              days: streakDays,
              onTimeRate,
              lookbackDays,
            }}
            hasPlants={totalPlants > 0}
            dueCount={plantsNeedingWater.length}
            dueNames={plantsNeedingWater.map((plant) => plant.nickname)}
            wateredToday={wateredTodayCount}
            nextUp={
              upcomingPlants[0]
                ? {
                    name: upcomingPlants[0].nickname,
                    days: calculateWateringSchedule(upcomingPlants[0]).daysUntilWatering ?? 1,
                  }
                : null
            }
            onWaterAll={openWaterAll}
            attention={{
              mostOverdue,
              overdueCount: overduePlants,
              readyToFeed: plantsReadyToFeed,
              unscheduled: plants.filter(
                (plant) => calculateWateringSchedule(plant).hasUnknownWateringDate
              ),
              dueThisWeek,
            }}
          />
        </div>

        {/* Alerts sit between the tiles and today's plants so they're seen but don't bury the tiles */}
        <div className="mt-6 empty:hidden">
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
          calendarPlantSuggestions.length > 0 &&
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

        {/* Spring Fertilization Reminder Banner */}
        {shouldShowFertilizationBanner && (
          <CascadingContainer delay={75}>
            <FertilizationBanner
              plantCount={unfertilizedCount}
              plants={unfertilizedPlants}
              onLogFertilization={logFertilization}
              onDismiss={dismissFertilizationBanner}
              onSnooze={snoozeFertilizationBanner}
            />
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

        {/* Rain Delay Notification - Show when outdoor plants can skip watering */}
        {outdoorPlantsWithRainDelay.length > 0 && weather.weatherData && (
          <CascadingContainer delay={275}>
            <div data-testid="rain-delay-notification" className="mb-6">
              <div className="rounded-card bg-sprout-water text-sprout-dark p-5">
                <div className="flex items-start gap-3">
                  <CloudRain className="w-6 h-6 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-display text-lg font-bold">
                        Rain expected
                      </h4>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sprout-dark text-sprout-water">
                        {weather.weatherData.upcoming_rain_probability}% chance
                      </span>
                    </div>
                    {/*
                      These plants are still due and remain in Today's Tasks. The copy used to
                      say watering "can wait" and that plants "can skip watering", which
                      implied the reminder had been handled — but rain probability carries no
                      timing, so nothing here justifies dropping the reminder. Postponing is
                      offered as an explicit choice instead.
                    */}
                    <p className="text-sm font-medium">
                      {outdoorPlantsWithRainDelay.length} outdoor plant
                      {outdoorPlantsWithRainDelay.length !== 1 ? "s are" : " is"}{" "}
                      due, but rain is forecast. You may want to postpone
                      {outdoorPlantsWithRainDelay.length !== 1 ? " them" : " it"}:
                    </p>
                    <ul className="text-sm space-y-1.5">
                      {outdoorPlantsWithRainDelay.slice(0, 3).map((item) => (
                        <li
                          key={item.plant.id}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="truncate font-semibold">
                            {item.plant.nickname || item.plant.plant_type}
                          </span>
                          <Button
                            size="sm"
                            className="h-8 px-3 rounded-xl text-xs font-bold bg-sprout-dark text-sprout-water hover:bg-sprout-dark/90 flex-shrink-0"
                            onClick={() =>
                              handlePostponeForRain(
                                item.plant.id,
                                item.rainDelay.suggestedDelayDays
                              )
                            }
                          >
                            Postpone {item.rainDelay.suggestedDelayDays}d
                          </Button>
                        </li>
                      ))}
                      {outdoorPlantsWithRainDelay.length > 3 && (
                        <li className="text-xs font-semibold">
                          +{outdoorPlantsWithRainDelay.length - 3} more
                        </li>
                      )}
                    </ul>
                    {outdoorPlantsWithRainDelay[0]?.rainDelay
                      .nextCheckDate && (
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Check again on{" "}
                          {outdoorPlantsWithRainDelay[0].rainDelay.nextCheckDate.toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CascadingContainer>
        )}
        </div>

        {/* Today's plants and the rest of the week, in one list */}
        <div className="mt-[26px] lg:mt-7">
          <UpNextList
            today={plantsNeedingWater}
            upcoming={upcomingPlants}
            onQuickWater={handleQuickWater}
          />
        </div>

        {/* Plant Health Insights */}
        <div className="mt-8">
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
        </div>

        {/* Articles For Your Plants */}
        {myPlantNames.length > 0 && (
          <CascadingContainer delay={400}>
            <div className="mb-8">
              <MyPlantsBlogSection plantNames={myPlantNames} />
            </div>
          </CascadingContainer>
        )}

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
            setAppliedCalendarPlants((prev) => new Map([...prev, [plantId, days]]));
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

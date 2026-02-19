import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Droplets,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Clock,
  Flower2,
  CheckCircle,
  CheckCircle2,
  Target,
  Activity,
  CloudRain,
  Star,
  Sparkles,
} from "lucide-react";
import { calculateWateringSchedule } from "@/utils/watering-schedule";
import { hookLogger } from "@/utils/hookLogging";
import { useDialogState } from "@/hooks/useDialogState";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { CareStatusOverview } from "@/components/dashboard/CareStatusOverview";
import { getPlantImageUrl } from "@/utils/plantImageUtils";

const COMPONENT_NAME = "Dashboard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { useGracefulLoading } from "@/hooks/useGracefulLoading";
import { useUserPlants } from "@/hooks/useUserPlants";
import { useProfile } from "@/hooks/useProfile";
import { useSeasonalDetection } from "@/hooks/useSeasonalDetection";
import { useSeasonalSuggestions } from "@/hooks/useSeasonalSuggestions";
import { useWeatherData } from "@/hooks/useWeatherData";
import { useLocation } from "@/hooks/useLocation";
import { useSmartWateringPreferences } from "@/hooks/useSmartWateringPreferences";
import { useCalendarSeasonalNotification } from "@/hooks/useCalendarSeasonalNotification";
import { WeatherMoodBanner } from "@/components/WeatherMoodBanner";
import { RainDelayNotification } from "@/components/RainDelayNotification";
import { calculateRainDelay } from "@/utils/rainDelayLogic";
import AddPlantDialog from "./AddPlantDialog";
import PlantImage from "@/components/ui/plant-image";
import WaterConfirmationDialog from "./WaterConfirmationDialog";
import FullscreenImageModal from "@/components/ui/fullscreen-image-modal";
import { SeasonalReviewBanner } from "./SeasonalReviewBanner";
import { SeasonalReviewDialog } from "./SeasonalReviewDialog";
import { CalendarSeasonalBanner } from "./CalendarSeasonalBanner";
import { CalendarSeasonalDialog } from "./CalendarSeasonalDialog";
import { SmartSuggestionsBanner } from "./SmartSuggestionsBanner";
import { SmartSuggestionsDialog } from "./SmartSuggestionsDialog";
import { EnableWeatherPrompt } from "./EnableWeatherPrompt";
import { shouldShowOverwateringWarning } from "@/utils/overwatering";
import { useBulkPatternAnalysis } from "@/hooks/useWateringPatternAnalysis";
import { useDismissedSuggestions } from "@/hooks/useDismissedSuggestions";
import { format, formatDistanceToNow } from "date-fns";
import type { PatternInsight } from "@/types/wateringPatternTypes";
import { useKeyboardShortcuts, createPlantShortcuts } from "@/hooks/useKeyboardShortcuts";
import { usePlantNotifications } from "@/hooks/usePlantNotifications";

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { plants, loading, waterPlant, fetchPlants, updatePlantSchedule, postponeWatering } =
    useUserPlants();
  const { profileData, isLoadingProfile } = useProfile();
  const { preferences, loadPreferences } = useSmartWateringPreferences();
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

  // Smart suggestions analysis - stabilize plantIds to prevent infinite re-renders
  const plantIds = useMemo(() => plants.map((plant) => plant.id), [plants]);
  const {
    plantsWithSuggestions,
    totalSuggestions,
    highPrioritySuggestions,
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

  // All hooks must be called before any conditional logic or early returns
  const isLoading = loading || isLoadingProfile;
  const { showLoading, isReady } = useGracefulLoading(isLoading, {
    minLoadingTime: 0,
    staggerDelay: 0,
  });

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

  // Check if we should show the smart suggestions banner - only after dismissed suggestions are loaded
  const shouldShowSmartSuggestionsBanner = useMemo(() => {
    return (
      isDismissedSuggestionsLoaded && activePlantsWithSuggestions.length > 0
    );
  }, [isDismissedSuggestionsLoaded, activePlantsWithSuggestions]);

  // Now handle loading states and early returns AFTER all hooks are called
  if (showLoading) {
    return <DashboardSkeleton />;
  }

  if (!isReady) {
    return (
      <div className="py-8 bg-background min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 opacity-0">
          {/* Invisible content to maintain height */}
          <div className="mb-8">
            <div className="h-10 w-80 mb-2" />
            <div className="h-6 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="h-16" />
            <div className="h-16" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="h-24" />
            <div className="h-24" />
            <div className="h-24" />
            <div className="h-24" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="h-80" />
            <div className="h-80" />
          </div>
          <div className="h-96 mb-8" />
          <div className="h-64" />
        </div>
      </div>
    );
  }

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

  const handleQuickPostpone = async () => {
    const plantId = waterConfirmation.plantId;
    setWaterConfirmation({ show: false, plantId: "", plantName: "" });
    await postponeWatering(plantId);
  };

  const handleAlreadyWatered = async (date: string, notes?: string) => {
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

  const handleSnoozeSuggestions = (weeks: number) => {
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
    <div
      data-testid="dashboard"
      className="py-8 bg-background min-h-[calc(100vh-4rem)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <WelcomeHeader greeting={greeting} />

        {/* Weather Mood Banner - Fun animated weather status (top priority) */}
        {preferences?.use_weather_data &&
          weather.weatherData &&
          !weather.isLoading && (
            <CascadingContainer delay={50}>
              <div data-testid="weather-mood-banner" className="mb-6">
                <WeatherMoodBanner
                  weatherData={weather.weatherData}
                  temperatureUnit={preferences?.temperature_unit || "F"}
                  lastUpdated={weather.lastUpdated}
                  onRefresh={() => weather.refreshWeather()}
                  isRefreshing={weather.isLoading}
                  isFallback={weather.isFallback}
                />
              </div>
            </CascadingContainer>
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

        {/* Enable Weather Prompt - Show when weather is disabled */}
        {!preferences?.use_weather_data && (
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

        <CascadingContainer delay={300}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Today's Tasks */}
            <Card
              id="todays-tasks"
              data-testid="todays-tasks-card"
              className="border-2 border-border/50 hover:border-border transition-all duration-300 bg-gradient-to-br from-background to-muted/10"
            >
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-foreground">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mr-3 shadow-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">Today's Tasks</div>
                    <div className="text-sm font-normal text-muted-foreground">
                      {plantsNeedingWater.length === 0
                        ? "All caught up!"
                        : `${plantsNeedingWater.length} plant${plantsNeedingWater.length > 1 ? "s" : ""} need attention`}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {plantsNeedingWater.length === 0 ? (
                  <div
                    data-testid="no-tasks-message"
                    className="text-center py-12 relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50/50 dark:from-emerald-900/20 dark:to-green-900/10 border-2 border-emerald-200/50 dark:border-emerald-700/30"
                  >
                    {/* Decorative gradient blob */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-green-400/10 rounded-full blur-2xl" />

                    <div className="relative">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 mb-4 shadow-lg">
                        <CheckCircle className="w-10 h-10 text-white" />
                      </div>
                      <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                        All Caught Up!
                      </p>
                      <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
                        No plants need watering today
                      </p>
                    </div>
                  </div>
                ) : (
                  <div data-testid="tasks-list" className="space-y-3">
                    {plantsNeedingWater.slice(0, 5).map((plant) => {
                      const wateringCalc = calculateWateringSchedule(plant);
                      const isOverdue = wateringCalc.isOverdue;

                      return (
                        <div
                          key={plant.id}
                          data-testid={`task-item-${plant.id}`}
                          className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                            isOverdue
                              ? "border-red-300/50 dark:border-red-600/40 hover:border-red-400 dark:hover:border-red-500 bg-gradient-to-br from-red-50/50 to-rose-50/30 dark:from-red-900/20 dark:to-rose-900/10"
                              : "border-cyan-300/50 dark:border-cyan-600/40 hover:border-cyan-400 dark:hover:border-cyan-500 bg-gradient-to-br from-cyan-50/50 to-blue-50/30 dark:from-cyan-900/20 dark:to-blue-900/10"
                          }`}
                        >
                          {/* Decorative gradient blob */}
                          <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${
                            isOverdue
                              ? "bg-gradient-to-br from-red-400/20 to-rose-400/10"
                              : "bg-gradient-to-br from-cyan-400/20 to-blue-400/10"
                          }`} />

                          <div className="flex items-center justify-between p-4 relative gap-3">
                            <div
                              className="flex items-center space-x-4 flex-1 min-w-0 cursor-pointer"
                              onClick={() => navigate(`/my-plants/${plant.id}`)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  navigate(`/my-plants/${plant.id}`);
                                }
                              }}
                              aria-label={`View details for ${plant.nickname}`}
                            >
                              {/* Plant Image with gradient overlay */}
                              <div className="relative group/image shrink-0">
                                <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
                                  isOverdue
                                    ? "bg-gradient-to-br from-red-500/20 to-rose-500/20 group-hover/image:from-red-500/30 group-hover/image:to-rose-500/30"
                                    : "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 group-hover/image:from-cyan-500/30 group-hover/image:to-blue-500/30"
                                }`} />
                                <PlantImage
                                  src={getPlantImageUrl(
                                    plant.image,
                                    plant.plant_type,
                                    ""
                                  )}
                                  fallbackSrc="https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=60&h=60&fit=crop"
                                  alt={plant.nickname}
                                  className="w-14 h-14 rounded-full object-cover relative ring-2 ring-white/50 dark:ring-gray-800/50 group-hover/image:scale-110 transition-transform duration-300"
                                />
                              </div>

                              {/* Plant Info */}
                              <div className="flex-1 min-w-0 group-hover:translate-x-1 transition-transform duration-300">
                                <p className="font-semibold text-foreground text-base mb-0.5 truncate">
                                  {plant.nickname}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {plant.plant_type}
                                </p>
                                {isOverdue ? (
                                  <Badge
                                    data-testid={`overdue-badge-${plant.id}`}
                                    className="text-xs px-3 py-1 mt-1 bg-gradient-to-r from-red-600 to-rose-600 text-white border-0 shadow-md"
                                  >
                                    <AlertTriangle className="w-3 h-3 mr-1 inline" />
                                    {Math.abs(wateringCalc.daysUntilWatering)} day{Math.abs(wateringCalc.daysUntilWatering) > 1 ? "s" : ""} overdue
                                  </Badge>
                                ) : (
                                  <Badge
                                    data-testid={`due-today-badge-${plant.id}`}
                                    className="text-xs px-3 py-1 mt-1 bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-0 shadow-md"
                                  >
                                    Due today
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Water Button */}
                            <div className="flex items-center shrink-0">
                              <Button
                                data-testid={`quick-water-button-${plant.id}`}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickWater(plant.id, plant.nickname);
                                }}
                                className="relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 bg-sprout-water hover:bg-sprout-water/90 text-white"
                              >
                                <Droplets className="w-4 h-4 group-hover:animate-bounce" />
                              </Button>
                            </div>
                          </div>

                          {/* Progress indicator for multiple plants */}
                          {plantsNeedingWater.length > 1 && (
                            <div className={`h-1 w-full ${
                              isOverdue
                                ? "bg-red-200/30 dark:bg-red-800/30"
                                : "bg-cyan-200/30 dark:bg-cyan-800/30"
                            }`}>
                              <div
                                className={`h-1 transition-all duration-700 ${
                                  isOverdue
                                    ? "bg-gradient-to-r from-red-500 to-rose-500"
                                    : "bg-gradient-to-r from-cyan-500 to-blue-500"
                                }`}
                                style={{ width: `${((plantsNeedingWater.indexOf(plant) + 1) / plantsNeedingWater.length) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {plantsNeedingWater.length > 5 && (
                      <div className="text-center py-3 px-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50">
                        <p className="text-sm font-medium text-muted-foreground">
                          +{plantsNeedingWater.length - 5} more plant{plantsNeedingWater.length - 5 > 1 ? "s" : ""} need attention
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity Feed */}
            <Card data-testid="recent-activity-card" className="border-2 border-border/50 hover:border-border transition-all duration-300 bg-gradient-to-br from-background to-muted/10">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-foreground">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sprout-primary to-sprout-medium flex items-center justify-center mr-3 shadow-lg">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">Recent Activity</div>
                    <div className="text-sm font-normal text-muted-foreground">
                      {recentlyWateredPlants.length === 0
                        ? "No activity yet"
                        : `${recentlyWateredPlants.length} recent action${recentlyWateredPlants.length > 1 ? "s" : ""}`}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentlyWateredPlants.length === 0 ? (
                  <div
                    data-testid="no-recent-activity"
                    className="text-center py-12 relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/10 border-2 border-sprout-primary/30 dark:border-sprout-medium/30"
                  >
                    {/* Decorative gradient blob */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-400/10 rounded-full blur-2xl" />

                    <div className="relative">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-sprout-primary to-sprout-medium mb-4 shadow-lg">
                        <Clock className="w-10 h-10 text-white" />
                      </div>
                      <p className="text-lg font-semibold text-sprout-primary dark:text-sprout-light mb-1">
                        No Activity Yet
                      </p>
                      <p className="text-sm text-sprout-medium dark:text-sprout-light/80">
                        Start caring for your plants!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div data-testid="recent-activity-list" className="space-y-1 relative">
                    {/* Timeline connector line - centered behind icons, stops before last item */}
                    {recentlyWateredPlants.length > 1 && (
                      <div className="absolute left-[38px] top-[38px] bottom-[calc(1.25rem+44px)] w-0.5 bg-gradient-to-b from-cyan-300 via-blue-300 to-cyan-300 dark:from-cyan-600 dark:via-blue-600 dark:to-cyan-600 opacity-30" />
                    )}

                    {recentlyWateredPlants.map((plant, index) => (
                      <div
                        key={plant.id}
                        data-testid={`recent-activity-item-${plant.id}`}
                        className="group relative flex items-start gap-4 p-4 hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-blue-50/30 dark:hover:from-cyan-900/20 dark:hover:to-blue-900/10 rounded-xl transition-all duration-300 hover:shadow-md"
                        style={{
                          animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`
                        }}
                      >
                        {/* Timeline dot with icon */}
                        <div className="relative flex-shrink-0 z-10">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg ring-4 ring-background group-hover:scale-110 transition-transform duration-300">
                            <Droplets className="w-5 h-5 text-white" />
                          </div>
                          {/* Glow effect on hover */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-50 blur-md transition-opacity duration-300" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex items-center gap-3 mb-2">
                            {/* Plant Image */}
                            <div className="relative group/image">
                              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 group-hover/image:from-cyan-500/30 group-hover/image:to-blue-500/30 transition-all duration-300" />
                              <PlantImage
                                src={getPlantImageUrl(
                                  plant.image,
                                  plant.plant_type,
                                  ""
                                )}
                                fallbackSrc="https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=40&h=40&fit=crop"
                                alt={plant.nickname}
                                className="w-10 h-10 rounded-full object-cover relative ring-2 ring-white/50 dark:ring-gray-800/50 group-hover/image:scale-110 transition-transform duration-300"
                              />
                            </div>

                            {/* Action description */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground group-hover:translate-x-1 transition-transform duration-300">
                                Watered{" "}
                                <span className="font-bold text-sprout-success dark:text-sprout-success">
                                  {plant.nickname}
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(
                                  new Date(plant.latest_watering!),
                                  { addSuffix: true }
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Achievement milestone for first watering */}
                          {index === recentlyWateredPlants.length - 1 && recentlyWateredPlants.length === 1 && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-cyan-600 dark:text-cyan-400">
                              <Sparkles className="w-3 h-3" />
                              <span className="font-medium">First activity!</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CascadingContainer>

        {/* Plant Health Insights */}
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
                    {hasActiveCareRoutine && plantsNeedingWaterToday === 0 && totalPlants > 0 && (
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
                            onClick={() => addDialog.open()}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium"
                            size="sm"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Plant
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => navigate("/plant-catalog")}
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

        {/* Quick Plant Gallery */}
        {favoritePlants.length > 0 && (
          <CascadingContainer delay={500}>
            <Card data-testid="plant-gallery-card" className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <Flower2 className="w-5 h-5 mr-2 text-plant-primary dark:text-plant-secondary" />
                  Your Plant Gallery
                </CardTitle>
                <CardDescription>
                  Your most recently cared for plants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  data-testid="plant-gallery-grid"
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  {favoritePlants.map((plant) => (
                    <div
                      key={plant.id}
                      data-testid={`gallery-plant-${plant.id}`}
                      className="group"
                    >
                      <div
                        data-testid={`gallery-plant-image-${plant.id}`}
                        className="aspect-square bg-plant-neutral dark:bg-plant-neutral rounded-lg overflow-hidden mb-2 cursor-pointer hover:shadow-lg transition-all duration-300"
                        onClick={() =>
                          handleImageClick(
                            getPlantImageUrl(
                              plant.image,
                              plant.plant_type,
                              "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=200&h=200&fit=crop"
                            ),
                            plant.nickname,
                            plant.image_source
                          )
                        }
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleImageClick(
                              getPlantImageUrl(
                                plant.image,
                                plant.plant_type,
                                "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=200&h=200&fit=crop"
                              ),
                              plant.nickname,
                              plant.image_source
                            );
                          }
                        }}
                        aria-label={`View ${plant.nickname} image in fullscreen`}
                      >
                        <PlantImage
                          src={getPlantImageUrl(
                            plant.image,
                            plant.plant_type,
                            ""
                          )}
                          fallbackSrc="https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=200&h=200&fit=crop"
                          alt={plant.nickname}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <button
                        onClick={() => navigate(`/my-plants/${plant.id}`)}
                        className="text-sm font-medium text-foreground text-center hover:text-sprout-success hover:underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sprout-success focus:ring-offset-2 rounded-sm w-full bg-transparent border-none cursor-pointer"
                        aria-label={`View details for ${plant.nickname}`}
                      >
                        {plant.nickname}
                      </button>
                      <p className="text-xs text-muted-foreground text-center">
                        {plant.plant_type}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </CascadingContainer>
        )}

        <AddPlantDialog
          isOpen={addDialog.isOpen}
          onClose={() => addDialog.close()}
          onPlantAdded={fetchPlants}
        />

        <AlertDialog
          open={bulkWaterDialog.isOpen}
          onOpenChange={(open) => {
            if (!open) {
              bulkWaterDialog.close();
            }
          }}
        >
          <AlertDialogContent data-testid="bulk-water-dialog">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <Droplets className="w-5 h-5 mr-2 text-sprout-water" />
                Water Multiple Plants
              </AlertDialogTitle>
              <AlertDialogDescription>
                You're about to water {plantsNeedingWater.length} plant
                {plantsNeedingWater.length > 1 ? "s" : ""} that need attention
                today:
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div
              data-testid="bulk-water-plants-list"
              className="max-h-48 overflow-y-auto space-y-2 my-4"
            >
              {plantsNeedingWater.map((plant) => (
                <div
                  key={plant.id}
                  className="flex items-center space-x-3 p-2 bg-card border border-border rounded-lg"
                >
                  <PlantImage
                    src={getPlantImageUrl(plant.image, plant.plant_type, "")}
                    fallbackSrc="https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=40&h=40&fit=crop"
                    alt={plant.nickname}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {plant.nickname}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {plant.plant_type}
                    </p>
                  </div>
                  <Badge
                    className={`text-xs ${
                      calculateWateringSchedule(plant).isOverdue
                        ? "bg-sprout-error text-white"
                        : calculateWateringSchedule(plant).isPostponed
                        ? "bg-sprout-water/20 text-sprout-water"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {(() => {
                      const calc = calculateWateringSchedule(plant);
                      if (calc.isOverdue) {
                        return `${Math.abs(
                          calc.daysUntilWatering
                        )} days overdue`;
                      } else if (calc.isPostponed) {
                        return "Postponed";
                      } else {
                        return "Due today";
                      }
                    })()}
                  </Badge>
                </div>
              ))}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel data-testid="bulk-water-cancel-button">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                data-testid="bulk-water-confirm-button"
                onClick={handleBulkWater}
                className="bg-sprout-water hover:bg-sprout-water/90 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Water All Plants
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <WaterConfirmationDialog
          open={waterConfirmation.show}
          onOpenChange={(open) =>
            setWaterConfirmation({ ...waterConfirmation, show: open })
          }
          onConfirm={handleConfirmQuickWater}
          onPostpone={handleQuickPostpone}
          onAlreadyWatered={handleAlreadyWatered}
          plantName={waterConfirmation.plantName}
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
          lastWateredDate={waterConfirmation.lastWatered}
        />

        <FullscreenImageModal
          isOpen={fullscreenImage.show}
          onClose={() =>
            setFullscreenImage({ show: false, src: "", alt: "", plantName: "" })
          }
          imageSrc={fullscreenImage.src}
          imageAlt={fullscreenImage.alt}
          plantName={fullscreenImage.plantName}
        />

        {/* Weather-based Seasonal Review Dialog */}
        {pendingTransition && (
          <SeasonalReviewDialog
            isOpen={seasonalReviewDialog.isOpen}
            onClose={() => seasonalReviewDialog.close()}
            season={pendingTransition.to_season}
            suggestions={suggestions}
            isLoading={isSuggestionsLoading}
            onApplySuggestion={applySuggestion}
            onApplyAll={applyAllSuggestions}
            onCustomize={customizeSchedule}
            appliedSuggestions={
              new Set(
                suggestions
                  .filter((s) => !hasUnappliedSuggestions)
                  .map((s) => s.plant_id)
              )
            }
          />
        )}

        {/* Calendar-based Seasonal Dialog */}
        {calendarSeasonChange && (
          <CalendarSeasonalDialog
            isOpen={calendarSeasonalDialog.isOpen}
            onClose={() => calendarSeasonalDialog.close()}
            season={calendarSeasonChange.nextSeason}
            changeDate={calendarSeasonChange.changeDate}
            suggestions={calendarPlantSuggestions}
            isLoading={isCalendarSuggestionsLoading}
            onApplySuggestion={async (plantId, days) => {
              await applyCalendarSuggestion(plantId, days);
              setAppliedCalendarPlants((prev) => new Set([...prev, plantId]));
            }}
            onApplyAll={async () => {
              await applyAllCalendarSuggestions();
              calendarSeasonalDialog.close();
            }}
            appliedPlants={appliedCalendarPlants}
          />
        )}

        {/* Smart Suggestions Dialog */}
        <SmartSuggestionsDialog
          isOpen={smartSuggestionsDialog.isOpen}
          onClose={() => smartSuggestionsDialog.close()}
          plantSuggestions={activePlantsWithSuggestions.map((plant) => {
            const plantData = plants.find((p) => p.id === plant.plantId);
            return {
              plantId: plant.plantId,
              plantName: plantData?.nickname || "Unknown Plant",
              plantType: plantData?.plant_type || "Unknown Type",
              insights: plant.insights,
            };
          })}
          onApplyAllSuggestions={handleApplyAllSuggestions}
          onApplySuggestion={handleApplySuggestion}
          onDismissAllSuggestions={handleDismissAllSuggestions}
          onDismissPlantSuggestions={handleDismissPlantSuggestions}
          onViewPlantHistory={handleViewPlantHistory}
          dismissedPlantIds={dismissedSuggestions}
          isLoading={isSuggestionsAnalyzing || !isDismissedSuggestionsLoaded}
        />
      </div>
    </div>
  );
};

export default Dashboard;

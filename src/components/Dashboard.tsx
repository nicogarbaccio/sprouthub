import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  DashboardMetricSkeleton,
  DashboardTaskSkeleton,
  DashboardActivitySkeleton,
  Skeleton,
} from "@/components/ui/skeleton";
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
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { useKeyboardShortcuts, createPlantShortcuts } from "@/hooks/useKeyboardShortcuts";

const Dashboard = () => {
  const { plants, loading, waterPlant, fetchPlants, updatePlantSchedule, postponeWatering } =
    useUserPlants();
  const { profileData, isLoadingProfile } = useProfile();
  const { preferences } = useSmartWateringPreferences();
  const location = useLocation({
    autoRequest: false, // Don't auto-request, only fetch if user has weather enabled
  });
  const weather = useWeatherData({
    location: location.location,
    autoFetch: !!preferences?.use_weather_data && !!location.location,
  });
  const navigate = useNavigate();

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
    return (
      <div className="py-8 bg-background min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-10 w-80 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>

          {/* Quick Actions Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>

          {/* Care Status Overview Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <DashboardMetricSkeleton />
            <DashboardMetricSkeleton />
            <DashboardMetricSkeleton />
            <DashboardMetricSkeleton />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Today's Tasks Skeleton */}
            <Card className="border-plant-secondary/20">
              <CardHeader>
                <div className="flex items-center">
                  <Skeleton className="w-5 h-5 mr-2 rounded-full" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <DashboardTaskSkeleton />
                  <DashboardTaskSkeleton />
                  <DashboardTaskSkeleton />
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Skeleton */}
            <Card className="border-plant-secondary/20">
              <CardHeader>
                <div className="flex items-center">
                  <Skeleton className="w-5 h-5 mr-2 rounded-full" />
                  <Skeleton className="h-6 w-36" />
                </div>
                <Skeleton className="h-4 w-52" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <DashboardActivitySkeleton />
                  <DashboardActivitySkeleton />
                  <DashboardActivitySkeleton />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plant Health Insights Skeleton */}
          <Card className="border-plant-secondary/20 mb-8">
            <CardHeader>
              <div className="flex items-center">
                <Skeleton className="w-5 h-5 mr-2 rounded-full" />
                <Skeleton className="h-6 w-44" />
              </div>
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-6 w-28" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Favorite Plants Skeleton */}
          <Card className="border-plant-secondary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center">
                    <Skeleton className="w-5 h-5 mr-2 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <Skeleton className="h-4 w-48 mt-2" />
                </div>
                <Skeleton className="h-10 w-24 rounded-xl" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-plant-neutral rounded-lg"
                  >
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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
              className="border-border"
            >
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <Calendar className="w-5 h-5 mr-2 text-plant-primary dark:text-plant-secondary" />
                  Today's Tasks
                </CardTitle>
                <CardDescription>
                  Plants that need your attention today
                </CardDescription>
              </CardHeader>
              <CardContent>
                {plantsNeedingWater.length === 0 ? (
                  <div
                    data-testid="no-tasks-message"
                    className="text-center py-8"
                  >
                    <CheckCircle className="w-12 h-12 text-green-500 dark:text-green-400 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      All caught up! No plants need watering today.
                    </p>
                  </div>
                ) : (
                  <div data-testid="tasks-list" className="space-y-3">
                    {plantsNeedingWater.slice(0, 5).map((plant) => {
                      const wateringCalc = calculateWateringSchedule(plant);
                      return (
                        <div
                          key={plant.id}
                          data-testid={`task-item-${plant.id}`}
                          className="flex items-center justify-between p-3 bg-muted/30 dark:bg-muted/20 rounded-lg border border-border/50"
                        >
                          <div
                            className="flex items-center space-x-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
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
                            <PlantImage
                              src={getPlantImageUrl(
                                plant.image,
                                plant.plant_type,
                                ""
                              )}
                              fallbackSrc="https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=60&h=60&fit=crop"
                              alt={plant.nickname}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <p className="font-medium text-foreground">
                                {plant.nickname}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {plant.plant_type}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {wateringCalc.isOverdue ? (
                              <Badge
                                data-testid={`overdue-badge-${plant.id}`}
                                className="text-xs bg-sprout-error text-white"
                              >
                                {Math.abs(wateringCalc.daysUntilWatering)} days
                                overdue
                              </Badge>
                            ) : (
                              <Badge
                                data-testid={`due-today-badge-${plant.id}`}
                                variant="secondary"
                                className="text-xs"
                              >
                                Due today
                              </Badge>
                            )}
                            <Button
                              data-testid={`quick-water-button-${plant.id}`}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickWater(plant.id, plant.nickname);
                              }}
                              className="bg-sprout-water text-white hover:bg-sprout-water/90 hover:text-white"
                            >
                              <Droplets className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    {plantsNeedingWater.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center pt-2">
                        +{plantsNeedingWater.length - 5} more plants need
                        attention
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity Feed */}
            <Card data-testid="recent-activity-card" className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <Activity className="w-5 h-5 mr-2 text-plant-primary dark:text-plant-secondary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest plant care activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentlyWateredPlants.length === 0 ? (
                  <div
                    data-testid="no-recent-activity"
                    className="text-center py-8"
                  >
                    <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      No recent activity. Start caring for your plants!
                    </p>
                  </div>
                ) : (
                  <div data-testid="recent-activity-list" className="space-y-3">
                    {recentlyWateredPlants.map((plant) => (
                      <div
                        key={plant.id}
                        data-testid={`recent-activity-item-${plant.id}`}
                        className="flex items-center space-x-3 p-3 bg-muted/30 dark:bg-muted/20 rounded-lg border border-border/50"
                      >
                        <PlantImage
                          src={getPlantImageUrl(
                            plant.image,
                            plant.plant_type,
                            ""
                          )}
                          fallbackSrc="https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=40&h=40&fit=crop"
                          alt={plant.nickname}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            Watered{" "}
                            <span className="font-semibold">
                              {plant.nickname}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(plant.latest_watering!),
                              { addSuffix: true }
                            )}
                          </p>
                        </div>
                        <Droplets className="w-4 h-4 text-plant-primary dark:text-plant-secondary" />
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
                  <h4 className="font-semibold text-foreground">
                    Health Summary
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Plants with regular care
                      </span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {totalPlants -
                          plantsWithoutWateringData -
                          overduePlants}
                        /{totalPlants}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Overdue for watering
                      </span>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">
                        {overduePlants}/{totalPlants}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Unknown watering schedule
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">
                        {plantsWithoutWateringData}/{totalPlants}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">
                    Recommendations
                  </h4>
                  <div className="space-y-2">
                    {overduePlants > 0 && (
                      <div
                        data-testid="overdue-plants-warning"
                        className="flex items-start space-x-2 p-3 bg-sprout-warning/10 rounded-lg border border-sprout-warning/30"
                      >
                        <AlertTriangle className="w-4 h-4 text-sprout-warning mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-sprout-warning">
                          {overduePlants} plant{overduePlants > 1 ? "s" : ""}{" "}
                          overdue for watering - check them soon!
                        </p>
                      </div>
                    )}
                    {plantsWithoutWateringData > 0 && (
                      <div
                        data-testid="missing-watering-data-warning"
                        className="flex items-start space-x-2 p-3 bg-sprout-cream/15 rounded-lg border border-sprout-cream/40"
                      >
                        <Clock className="w-4 h-4 text-sprout-dark mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-sprout-dark">
                          {plantsWithoutWateringData} plant
                          {plantsWithoutWateringData > 1 ? "s" : ""} need
                          initial watering data
                        </p>
                      </div>
                    )}
                    {overduePlants === 0 &&
                      plantsWithoutWateringData === 0 &&
                      totalPlants > 0 && (
                        <div
                          data-testid="all-plants-healthy-message"
                          className="flex items-start space-x-2 p-3 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/30"
                        >
                          <CheckCircle className="w-4 h-4 text-plant-secondary dark:text-plant-secondary mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-green-700 dark:text-green-300">
                            Great job! All your plants are well cared for. Keep
                            up the excellent work!
                          </p>
                        </div>
                      )}
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
                        className="text-sm font-medium text-foreground text-center hover:text-sprout-water hover:underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sprout-water focus:ring-offset-2 rounded-sm w-full bg-transparent border-none cursor-pointer"
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

        {/* Floating Action Button */}
        <FloatingActionButton onClick={() => addDialog.open()} />
      </div>
    </div>
  );
};

export default Dashboard;

import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useUserPlants } from "@/hooks/useUserPlants";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { useGracefulLoading } from "@/hooks/useGracefulLoading";
import { PlantDetailsPageSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowLeft,
  Droplets,
  Edit,
  Trash2,
  History,
  Clock,
  Calendar,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import PlantImage from "@/components/ui/plant-image";
import WaterConfirmationDialog from "@/components/WaterConfirmationDialog";
import PostponeConfirmationDialog from "@/components/PostponeConfirmationDialog";
import EditPlantDialog from "@/components/EditPlantDialog";
import WateringHistoryDialog from "@/components/WateringHistoryDialog";
import PlantCareGrid from "@/components/plant-details/PlantCareGrid";
import PlantCareCards from "@/components/plant-details/PlantCareCards";
import FullscreenImageModal from "@/components/ui/fullscreen-image-modal";
import { formatDistanceToNow } from "date-fns";
import { shouldShowOverwateringWarning } from "@/utils/overwatering";
import { plants as catalogPlants } from "@/data/plantData";
import { calculateWateringSchedule } from "@/utils/watering-schedule";
import { getRoomIcon, getRoomLabel } from "@/utils/rooms";
import { useWateringPatternAnalysis } from "@/hooks/useWateringPatternAnalysis";
import { PatternSuggestionsDialog } from "@/components/watering-patterns";

const MyPlantDetails = () => {
  const { plantId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    plants,
    loading,
    overwateringByPlantId,
    waterPlant,
    postponeWatering,
    deletePlant,
    fetchPlants,
  } = useUserPlants();

  const [isLoading, setIsLoading] = useState(true);
  const [showWaterConfirmation, setShowWaterConfirmation] = useState(false);
  const [showPostponeConfirmation, setShowPostponeConfirmation] =
    useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [showSuggestionsDialog, setShowSuggestionsDialog] = useState(false);

  // Find the specific plant and memoize it to prevent re-renders
  const plant = useMemo(
    () => plants.find((p) => p.id === plantId),
    [plants, plantId]
  );
  const overwatering = plant ? overwateringByPlantId[plant.id] : undefined;

  // Add watering pattern analysis hook
  const {
    insights: pendingInsights,
    analysis,
    isLoading: isAnalyzing,
  } = useWateringPatternAnalysis({
    plantId: plant?.id,
    autoRefresh: false, // Disable auto-refresh to prevent flickering
  });

  // Find matching plant data from catalog for care information
  const catalogPlant = plant
    ? catalogPlants.find(
        (catalogP) =>
          catalogP.name.toLowerCase() === plant.plant_type.toLowerCase() ||
          catalogP.botanicalName.toLowerCase() ===
            plant.plant_type.toLowerCase()
      )
    : undefined;

  useEffect(() => {
    // Simulate loading state while data is being fetched
    if (!loading && plants.length > 0) {
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    } else if (!loading) {
      setIsLoading(false);
    }
  }, [loading, plants]);

  const { showLoading, isReady } = useGracefulLoading(isLoading, {
    minLoadingTime: 0,
    staggerDelay: 0,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate(
        "/auth?redirect=" + encodeURIComponent(window.location.pathname)
      );
    }
  }, [user, loading, navigate]);

  const handleWaterClick = useCallback(() => {
    setShowWaterConfirmation(true);
  }, []);

  const handleConfirmWater = useCallback(async () => {
    if (plant) {
      await waterPlant(plant.id);
      setShowWaterConfirmation(false);
    }
  }, [plant, waterPlant]);

  const handleEditClick = useCallback(() => {
    setShowEditDialog(true);
  }, []);

  // Format date function to match the existing format used in the app
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    let displayDate = new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    );
    if (date.getUTCHours() < 4) {
      displayDate.setUTCDate(displayDate.getUTCDate() - 1);
    }

    return displayDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  // Calculate tomorrow's date in the same format
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow.toISOString());
  };

  const handlePostponeClick = useCallback(() => {
    setShowPostponeConfirmation(true);
  }, []);

  const handleConfirmPostpone = useCallback(async () => {
    if (plant) {
      await postponeWatering(plant.id);
    }
  }, [plant, postponeWatering]);

  const handlePostpone = useCallback(async () => {
    if (plant) {
      await postponeWatering(plant.id);
    }
  }, [plant, postponeWatering]);

  const handleViewHistory = useCallback(() => {
    setShowHistoryDialog(true);
  }, []);

  const handleSmartTipsClick = useCallback(() => {
    setShowSuggestionsDialog(true);
  }, []);

  // Helper functions for suggestion metadata and badge info
  const getActionableInsights = useCallback(() => {
    return pendingInsights?.filter((insight) => insight.actionable) || [];
  }, [pendingInsights]);

  const getSuggestionMetadata = useCallback(() => {
    const actionableInsights = getActionableInsights();
    const count = actionableInsights.length;
    const highPriorityCount = actionableInsights.filter(
      (insight) => insight.severity === "high"
    ).length;
    const mediumPriorityCount = actionableInsights.filter(
      (insight) => insight.severity === "medium"
    ).length;

    return {
      count,
      highPriorityCount,
      mediumPriorityCount,
      hasHighPriority: highPriorityCount > 0,
      hasMediumPriority: mediumPriorityCount > 0,
      actionableInsights,
    };
  }, [getActionableInsights]);

  const getBadgeInfo = useCallback(() => {
    const metadata = getSuggestionMetadata();
    const { count, highPriorityCount, hasHighPriority, hasMediumPriority } =
      metadata;

    if (count === 0) return null;

    // Determine badge text based on suggestion count and types
    let text = "";
    let colorClass = "";
    let description = "";

    if (hasHighPriority) {
      if (highPriorityCount === 1) {
        text = "Important tip";
        description = "1 important watering insight available";
      } else {
        text = `${highPriorityCount} important tips`;
        description = `${highPriorityCount} important watering insights available`;
      }
      colorClass =
        "bg-amber-500 hover:bg-amber-600 text-white border-amber-500";
    } else if (hasMediumPriority) {
      if (count === 1) {
        text = "Smart tip";
        description = "1 watering insight available";
      } else {
        text = `${count} smart tips`;
        description = `${count} watering insights available`;
      }
      colorClass = "bg-blue-500 hover:bg-blue-600 text-white border-blue-500";
    } else {
      if (count === 1) {
        text = "Good tip";
        description = "1 positive watering insight available";
      } else {
        text = `${count} good tips`;
        description = `${count} positive watering insights available`;
      }
      colorClass =
        "bg-green-500 hover:bg-green-600 text-white border-green-500";
    }

    return { text, colorClass, description };
  }, [getSuggestionMetadata]);

  const handleDeletePlant = useCallback(() => {
    setShowDeleteConfirmation(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (plant) {
      const success = await deletePlant(plant.id);
      if (success) {
        navigate("/my-plants");
      }
    }
    setShowDeleteConfirmation(false);
  }, [plant, deletePlant, navigate]);

  const getStatusInfo = useCallback(() => {
    if (!plant) return { color: "bg-gray-500", text: "Unknown" };

    const wateringCalc = calculateWateringSchedule(plant);
    const {
      daysUntilWatering,
      isOverdue,
      isPostponed,
      hasUnknownWateringDate,
    } = wateringCalc;

    if (hasUnknownWateringDate) {
      return { color: "bg-neutral-500 text-white", text: "Unknown schedule" };
    }

    if (isPostponed) {
      if (daysUntilWatering === 0) {
        return {
          color: "bg-sprout-water text-white",
          text: "Postponed until later today",
        };
      }
      if (daysUntilWatering === 1) {
        return {
          color: "bg-sprout-water text-white",
          text: "Postponed until tomorrow",
        };
      }
      return {
        color: "bg-sprout-water text-white",
        text: `Postponed for ${daysUntilWatering} days`,
      };
    }

    if (isOverdue) {
      return {
        color: "bg-red-500 text-white",
        text: `Overdue by ${Math.abs(daysUntilWatering)} days`,
      };
    }

    if (daysUntilWatering === 0) {
      return { color: "bg-orange-500 text-white", text: "Due today" };
    }
    if (daysUntilWatering <= 2) {
      return {
        color: "bg-orange-500 text-white",
        text: `Due in ${daysUntilWatering} days`,
      };
    }
    return {
      color: "bg-sprout-success text-white",
      text: `Due in ${daysUntilWatering} days`,
    };
  }, [plant]);

  // Show loading skeleton
  if (showLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="py-8">
          <PlantDetailsPageSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  // Plant not found
  if (!plant) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto py-12 text-center">
            <CascadingContainer delay={0}>
              <h1 className="text-2xl font-bold text-foreground mb-4">
                Plant Not Found
              </h1>
              <p className="text-muted-foreground mb-6">
                The plant you're looking for doesn't exist or you don't have
                access to it.
              </p>
              <Button onClick={() => navigate("/my-plants")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to My Plants
              </Button>
            </CascadingContainer>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const statusInfo = getStatusInfo();
  const wateringCalc = calculateWateringSchedule(plant);
  const { daysUntilWatering, isOverdue, isPostponed, hasUnknownWateringDate } =
    wateringCalc;

  const isDueToday = daysUntilWatering === 0 && !isPostponed;
  const canPostpone =
    (isOverdue || isDueToday) && !isPostponed && plant.latest_watering;

  // Check if we should show overwatering warning
  const { showWarning: showOverwateringWarning, daysSinceLastWatered } =
    shouldShowOverwateringWarning(
      plant.latest_watering,
      plant.suggested_watering_days || 7
    );

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 opacity-0">
            <div className="h-10 w-32 mb-6" />

            {/* Header placeholder */}
            <div className="mb-6">
              <div className="h-9 mb-2" />
              <div className="h-6 mb-3" />
              <div className="h-6" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="aspect-square max-w-md mx-auto lg:mx-0" />
              <div className="space-y-4">
                <div className="h-32" />
                <div className="h-32" />
                <div className="h-24" />
              </div>
            </div>

            {/* Care information placeholder */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20" />
                <div className="h-20" />
                <div className="h-20" />
                <div className="h-20" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64" />
              <div className="h-64" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <CascadingContainer delay={0}>
            <Button
              variant="outline"
              onClick={() => navigate("/my-plants")}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Plants
            </Button>
          </CascadingContainer>

          {/* Plant Header */}
          <CascadingContainer delay={100}>
            <div className="text-center lg:text-left mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {plant.nickname}
              </h1>
              <p className="text-lg text-muted-foreground mb-3">
                {plant.plant_type}
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {plant.room && (
                  <Badge variant="secondary">
                    <span className="mr-1">{getRoomIcon(plant.room)}</span>
                    {getRoomLabel(plant.room)}
                  </Badge>
                )}
                {plant.is_outdoor_plant && (
                  <Badge variant="secondary">Outdoor Plant</Badge>
                )}
              </div>
            </div>
          </CascadingContainer>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 lg:items-start">
            <div className="relative max-w-md mx-auto lg:mx-0 lg:max-w-none">
              <div
                className="cursor-pointer group"
                onClick={() => setShowFullscreenImage(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setShowFullscreenImage(true);
                  }
                }}
                aria-label={`View ${plant.nickname} image in fullscreen`}
              >
                <PlantImage
                  src={plant.image || ""}
                  alt={plant.nickname}
                  className="w-full h-[280px] lg:h-[320px] object-cover rounded-lg shadow-md"
                />
              </div>

              {/* Status Badge */}
              <Badge className={`absolute top-4 right-4 ${statusInfo.color}`}>
                {statusInfo.text}
              </Badge>

              {/* Overwatering Warning */}
              {overwatering && overwatering.level !== "none" && (
                <Badge
                  className={`absolute top-4 left-4 ${
                    overwatering.level === "high"
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-orange-500 text-white border-orange-500"
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {overwatering.level === "high"
                    ? "Overwatering Risk"
                    : "Watch Watering"}
                </Badge>
              )}

              {/* Smart Suggestions Badge */}
              {(() => {
                const badgeInfo = getBadgeInfo();
                if (!badgeInfo) return null;

                return (
                  <Badge
                    className={`absolute bottom-4 left-4 cursor-pointer transition-all duration-200 ${badgeInfo.colorClass}`}
                    onClick={handleSmartTipsClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSmartTipsClick();
                      }
                    }}
                    aria-label={badgeInfo.description}
                  >
                    <Lightbulb className="w-3 h-3 mr-1" />
                    {badgeInfo.text}
                  </Badge>
                );
              })()}
            </div>

            <div className="flex flex-col">
              <CascadingContainer delay={250}>
                <div className="space-y-3">
                  <Card>
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-sm font-semibold text-foreground">
                        Watering Schedule
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-3">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">
                            Last watered:
                          </span>
                          <span className="text-xs font-medium">
                            {plant.latest_watering
                              ? formatDistanceToNow(
                                  new Date(plant.latest_watering),
                                  { addSuffix: true }
                                )
                              : "Never"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">
                            Watering frequency:
                          </span>
                          <span className="text-xs font-medium">
                            Every {plant.suggested_watering_days || 7} days
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">
                            Days since watering:
                          </span>
                          <span className="text-xs font-medium">
                            {plant.days_since_watering || 0} days
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-sm font-semibold text-foreground">
                        Plant Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-3">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">
                            Added:
                          </span>
                          <span className="text-xs font-medium">
                            {formatDistanceToNow(new Date(plant.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">
                            Last updated:
                          </span>
                          <span className="text-xs font-medium">
                            {formatDistanceToNow(new Date(plant.updated_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CascadingContainer>

              <CascadingContainer delay={300}>
                <div className="space-y-2 mt-3">
                  {/* Primary Action Buttons */}
                  {canPostpone ? (
                    <div className="space-y-2">
                      <Button
                        onClick={handleWaterClick}
                        className="w-full bg-sprout-water hover:bg-sprout-water/90 text-sprout-white"
                      >
                        <Droplets className="w-4 h-4 mr-2" />
                        Water Now
                      </Button>
                      <Button
                        onClick={handlePostponeClick}
                        variant="outline"
                        className="w-full border-sprout-water/30 text-sprout-water hover:bg-sprout-water/10"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Push to Tomorrow
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handleWaterClick}
                      className="w-full bg-sprout-water hover:bg-sprout-water/90 text-sprout-white"
                    >
                      <Droplets className="w-4 h-4 mr-2" />
                      Water Now
                    </Button>
                  )}

                  {/* Secondary Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditClick}
                      className="flex-1 hover:bg-sprout-light/10 hover:border-sprout-light/30"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleViewHistory}
                      className="flex-2 hover:bg-sprout-water/10 hover:border-sprout-water/30"
                    >
                      <History className="w-3 h-3 mr-1" />
                      {getBadgeInfo() ? "History & Tips" : "History"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeletePlant}
                      className="flex-1 text-red-600 hover:text-white hover:bg-red-600"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CascadingContainer>
            </div>
          </div>

          {/* Plant Care Information */}
          <CascadingContainer delay={350}>
            <div className="mb-6">
              <PlantCareGrid
                wateringFrequency={catalogPlant?.wateringFrequency || "Weekly"}
                suggestedWateringDays={
                  plant.suggested_watering_days ||
                  catalogPlant?.suggestedWateringDays ||
                  7
                }
                lightRequirement={
                  catalogPlant?.lightRequirement || "Bright Indirect Light"
                }
                temperature={catalogPlant?.temperature || "65-75°F (18-24°C)"}
                humidity={catalogPlant?.humidity || "40-60%"}
              />
            </div>
          </CascadingContainer>

          <CascadingContainer delay={400}>
            <PlantCareCards
              careInstructions={
                catalogPlant?.careInstructions || [
                  "Water when top inch of soil feels dry",
                  "Place in appropriate light conditions",
                  "Maintain proper humidity levels",
                  "Remove dead or yellowing leaves",
                  "Fertilize during growing season",
                ]
              }
              commonProblems={
                catalogPlant?.commonProblems || [
                  "Overwatering: Yellow leaves and root rot",
                  "Underwatering: Wilting and dry soil",
                  "Poor lighting: Leggy growth or leaf drop",
                  "Low humidity: Brown leaf tips",
                ]
              }
            />
          </CascadingContainer>
        </div>
      </main>

      {/* Dialogs */}
      <WaterConfirmationDialog
        open={showWaterConfirmation}
        onOpenChange={setShowWaterConfirmation}
        onConfirm={handleConfirmWater}
        plantName={plant.nickname}
        showOverwateringWarning={showOverwateringWarning}
        daysSinceLastWatered={daysSinceLastWatered}
      />

      <EditPlantDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        plant={plant}
        onUpdate={() => {
          fetchPlants();
        }}
      />

      <WateringHistoryDialog
        isOpen={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        plant={plant}
        onPlantDataChange={() => {
          // Refresh plant data when postponements are deleted
          fetchPlants();
        }}
      />

      <FullscreenImageModal
        isOpen={showFullscreenImage}
        onClose={() => setShowFullscreenImage(false)}
        imageSrc={plant.image || ""}
        imageAlt={plant.nickname}
        plantName={plant.nickname}
      />

      <PatternSuggestionsDialog
        isOpen={showSuggestionsDialog}
        onClose={() => setShowSuggestionsDialog(false)}
        plantName={plant.nickname}
        analysis={analysis}
        insights={getActionableInsights()}
      />

      <PostponeConfirmationDialog
        open={showPostponeConfirmation}
        onOpenChange={setShowPostponeConfirmation}
        onConfirm={handleConfirmPostpone}
        plantName={plant.nickname}
        currentNextWatering={formatDate(
          plant.postponement_date ||
            plant.latest_watering ||
            new Date().toISOString()
        )}
        postponedNextWatering={getTomorrowDate()}
      />

      <AlertDialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{plant.nickname}"? This action
              cannot be undone and will remove all watering history for this
              plant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Plant
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export default MyPlantDetails;

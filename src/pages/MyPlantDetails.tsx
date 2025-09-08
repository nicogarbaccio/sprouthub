import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useUserPlants } from "@/hooks/useUserPlants";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { useGracefulLoading } from "@/hooks/useGracefulLoading";
import { Skeleton } from "@/components/ui/skeleton";
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
  MapPin,
  Calendar,
  AlertTriangle
} from "lucide-react";
import PlantImage from "@/components/ui/plant-image";
import WaterConfirmationDialog from "@/components/WaterConfirmationDialog";
import EditPlantDialog from "@/components/EditPlantDialog";
import WateringHistoryDialog from "@/components/WateringHistoryDialog";
import PlantCareGrid from "@/components/plant-details/PlantCareGrid";
import PlantCareCards from "@/components/plant-details/PlantCareCards";
import { formatDistanceToNow } from "date-fns";
import { shouldShowOverwateringWarning } from "@/utils/overwatering";
import { plants as catalogPlants } from "@/data/plantData";

const MyPlantDetails = () => {
  const { plantId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plants, loading, overwateringByPlantId, waterPlant, postponeWatering, deletePlant, fetchPlants } = useUserPlants();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showWaterConfirmation, setShowWaterConfirmation] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Find the specific plant
  const plant = plants.find(p => p.id === plantId);
  const overwatering = plant ? overwateringByPlantId[plant.id] : undefined;

  // Find matching plant data from catalog for care information
  const catalogPlant = plant ? catalogPlants.find(catalogP => 
    catalogP.name.toLowerCase() === plant.plant_type.toLowerCase() ||
    catalogP.botanicalName.toLowerCase() === plant.plant_type.toLowerCase()
  ) : undefined;

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
      navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
    }
  }, [user, loading, navigate]);

  const handleWaterClick = () => {
    setShowWaterConfirmation(true);
  };

  const handleConfirmWater = async () => {
    if (plant) {
      await waterPlant(plant.id);
      setShowWaterConfirmation(false);
    }
  };

  const handleEditClick = () => {
    setShowEditDialog(true);
  };

  const handlePostpone = async () => {
    if (plant) {
      await postponeWatering(plant.id);
    }
  };

  const handleViewHistory = () => {
    setShowHistoryDialog(true);
  };

  const handleDeletePlant = () => {
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    if (plant) {
      const success = await deletePlant(plant.id);
      if (success) {
        navigate('/my-plants');
      }
    }
    setShowDeleteConfirmation(false);
  };

  const getStatusInfo = () => {
    if (!plant) return { color: 'bg-gray-500', text: 'Unknown' };
    
    const daysUntilWatering = plant.days_since_watering 
      ? (plant.suggested_watering_days || 7) - plant.days_since_watering
      : 0;

    if (daysUntilWatering < 0) {
      return { 
        color: 'bg-red-500 text-white', 
        text: `Overdue by ${Math.abs(daysUntilWatering)} days` 
      };
    }
    if (daysUntilWatering === 0) {
      return { color: 'bg-orange-500 text-white', text: 'Due today' };
    }
    if (daysUntilWatering <= 2) {
      return { color: 'bg-orange-500 text-white', text: `Due in ${daysUntilWatering} days` };
    }
    return { color: 'bg-sprout-success text-white', text: `Due in ${daysUntilWatering} days` };
  };

  // Show loading skeleton
  if (showLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 min-h-[calc(100vh-4rem)] pb-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-10 w-32 mb-4" />
            
            {/* Header skeleton */}
            <div className="text-center lg:text-left mb-6">
              <Skeleton className="h-9 w-48 mx-auto lg:mx-0 mb-2" />
              <Skeleton className="h-6 w-32 mx-auto lg:mx-0 mb-3" />
              <div className="flex justify-center lg:justify-start gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Skeleton className="aspect-square max-w-md mx-auto lg:mx-0 w-full rounded-lg" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            </div>
            
            {/* Care information skeleton */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          </div>
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
                The plant you're looking for doesn't exist or you don't have access to it.
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
  const daysUntilWatering = plant.days_since_watering 
    ? (plant.suggested_watering_days || 7) - plant.days_since_watering
    : 0;
  
  const isOverdue = daysUntilWatering < 0;
  const isDueToday = daysUntilWatering === 0;
  const canPostpone = (isOverdue || isDueToday) && plant.latest_watering;

  // Check if we should show overwatering warning
  const { showWarning: showOverwateringWarning, daysSinceLastWatered } =
    shouldShowOverwateringWarning(plant.latest_watering, plant.suggested_watering_days || 7);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 min-h-[calc(100vh-4rem)] pb-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 opacity-0">
            <div className="h-10 w-32 mb-4" />
            
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
      <main className="pt-24 min-h-[calc(100vh-4rem)] pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <CascadingContainer delay={0}>
            <Button
              variant="ghost"
              onClick={() => navigate("/my-plants")}
              className="mb-4"
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
                    <MapPin className="w-3 h-3 mr-1" />
                    {plant.room}
                  </Badge>
                )}
                {plant.is_outdoor_plant && (
                  <Badge variant="secondary">Outdoor Plant</Badge>
                )}
              </div>
            </div>
          </CascadingContainer>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <CascadingContainer delay={200}>
              <div className="relative aspect-square max-w-md mx-auto lg:mx-0">
                <PlantImage
                  src={plant.image || ""}
                  alt={plant.nickname}
                  className="w-full h-full object-cover rounded-lg shadow-md"
                  fallbackClassName="w-full h-full flex items-center justify-center bg-muted rounded-lg shadow-md"
                />
                
                {/* Status Badge */}
                <Badge className={`absolute top-4 right-4 ${statusInfo.color}`}>
                  {statusInfo.text}
                </Badge>

                {/* Overwatering Warning */}
                {overwatering && overwatering.level !== "none" && (
                  <Badge className={`absolute top-4 left-4 ${
                    overwatering.level === "high"
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-orange-500 text-white border-orange-500"
                  }`}>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {overwatering.level === "high" ? "Overwatering Risk" : "Watch Watering"}
                  </Badge>
                )}
              </div>
            </CascadingContainer>

            <div className="space-y-6">

              <CascadingContainer delay={250}>
                <div className="grid grid-cols-1 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Watering Schedule
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Last watered:</span>
                          <span className="font-medium">
                            {plant.latest_watering 
                              ? formatDistanceToNow(new Date(plant.latest_watering), { addSuffix: true })
                              : "Never"
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Watering frequency:</span>
                          <span className="font-medium">
                            Every {plant.suggested_watering_days || 7} days
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Days since watering:</span>
                          <span className="font-medium">
                            {plant.days_since_watering || 0} days
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Plant Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Added:</span>
                          <span className="font-medium">
                            {formatDistanceToNow(new Date(plant.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Last updated:</span>
                          <span className="font-medium">
                            {formatDistanceToNow(new Date(plant.updated_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CascadingContainer>

              <CascadingContainer delay={300}>
                <div className="space-y-3">
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
                        onClick={handlePostpone}
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
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      onClick={handleEditClick}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleViewHistory}
                    >
                      <History className="w-4 h-4 mr-1" />
                      History
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDeletePlant}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
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
                suggestedWateringDays={plant.suggested_watering_days || catalogPlant?.suggestedWateringDays || 7}
                lightRequirement={catalogPlant?.lightRequirement || "Bright Indirect Light"}
                temperature={catalogPlant?.temperature || "65-75°F (18-24°C)"}
                humidity={catalogPlant?.humidity || "40-60%"}
              />
            </div>
          </CascadingContainer>

          <CascadingContainer delay={400}>
            <PlantCareCards
              careInstructions={catalogPlant?.careInstructions || [
                "Water when top inch of soil feels dry",
                "Place in appropriate light conditions",
                "Maintain proper humidity levels",
                "Remove dead or yellowing leaves",
                "Fertilize during growing season"
              ]}
              commonProblems={catalogPlant?.commonProblems || [
                "Overwatering: Yellow leaves and root rot",
                "Underwatering: Wilting and dry soil",
                "Poor lighting: Leggy growth or leaf drop",
                "Low humidity: Brown leaf tips"
              ]}
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
        onSuccess={() => {
          fetchPlants();
          setShowEditDialog(false);
        }}
      />

      <WateringHistoryDialog
        isOpen={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        plantId={plant.id}
        plantName={plant.nickname}
      />

      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{plant.nickname}"? This action cannot be undone and will remove all watering history for this plant.
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

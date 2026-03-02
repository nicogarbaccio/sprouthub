import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useUserPlants } from "@/hooks/useUserPlants";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { LoadingTransition } from "@/components/ui/loading-transition";
import { PlantDetailsPageSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PlantDetailHeader from "@/components/plant-details/PlantDetailHeader";
import PlantImageCard from "@/components/plant-details/PlantImageCard";
import WateringScheduleCard from "@/components/plant-details/WateringScheduleCard";
import PlantInfoCard from "@/components/plant-details/PlantInfoCard";
import PlantActionsMenu from "@/components/plant-details/PlantActionsMenu";
import RepottingGuideCard from "@/components/plant-details/RepottingGuideCard";
import PlantDetailDialogs from "@/components/plant-details/PlantDetailDialogs";
import PlantCareGrid from "@/components/plant-details/PlantCareGrid";
import PlantCareCards from "@/components/plant-details/PlantCareCards";
import {
  useStatusInfo,
  useBadgeInfo,
} from "@/components/plant-details/usePlantStatusInfo";
import { shouldShowOverwateringWarning } from "@/utils/plants/overwatering";
import { plants as catalogPlants } from "@/data/plantData";
import { calculateWateringSchedule } from "@/utils/watering/schedule";
import { useWateringPatternAnalysis } from "@/hooks/useWateringPatternAnalysis";
import { PLANT_FALLBACK_IMAGE } from "@/lib/constants";

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

  const [showWaterConfirmation, setShowWaterConfirmation] = useState(false);
  const [showPostponeConfirmation, setShowPostponeConfirmation] =
    useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [showSuggestionsDialog, setShowSuggestionsDialog] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showRepotting, setShowRepotting] = useState(false);

  const plant = useMemo(
    () => plants.find((p) => p.id === plantId),
    [plants, plantId],
  );
  const overwatering = plant ? overwateringByPlantId[plant.id] : undefined;

  const { insights: pendingInsights, analysis } = useWateringPatternAnalysis({
    plantId: plant?.id,
    autoRefresh: false,
  });


  const catalogPlant = plant
    ? catalogPlants.find(
        (catalogP) =>
          catalogP.name.toLowerCase() === plant.plant_type.toLowerCase() ||
          catalogP.botanicalName.toLowerCase() ===
            plant.plant_type.toLowerCase(),
      )
    : undefined;

  const getStatusInfo = useStatusInfo(plant);
  const { getActionableInsights, getBadgeInfo } = useBadgeInfo(pendingInsights);

  useEffect(() => {
    if (!loading && !user) {
      navigate(
        "/auth?redirect=" + encodeURIComponent(window.location.pathname),
      );
    }
  }, [user, loading, navigate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    let displayDate = new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
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

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow.toISOString());
  };

  const handleConfirmWater = useCallback(
    async (notes?: string) => {
      if (plant) {
        await waterPlant(plant.id, notes);
        setShowWaterConfirmation(false);
      }
    },
    [plant, waterPlant],
  );

  const handleAlreadyWatered = useCallback(
    async (_date: string, notes?: string) => {
      if (plant) {
        await waterPlant(plant.id, notes);
        setShowWaterConfirmation(false);
      }
    },
    [plant, waterPlant],
  );

  const handleConfirmPostpone = useCallback(async () => {
    if (plant) {
      await postponeWatering(plant.id);
    }
  }, [plant, postponeWatering]);

  const handleConfirmDelete = useCallback(async () => {
    if (plant) {
      const success = await deletePlant(plant.id);
      if (success) {
        navigate("/my-plants");
      }
    }
    setShowDeleteConfirmation(false);
  }, [plant, deletePlant, navigate]);

  const plantDetailsSkeleton = (
    <div className="min-h-dvh bg-background pb-20 lg:pb-0">
      <Navigation />
      <main className="py-4 sm:py-6">
        <PlantDetailsPageSkeleton />
      </main>
      <Footer />
    </div>
  );

  // Plant not found (after loading completes)
  if (!loading && !plant) {
    return (
      <div className="min-h-dvh bg-background pb-20 lg:pb-0">
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
  const { daysUntilWatering, isOverdue, isPostponed } = wateringCalc;
  const isDueToday = daysUntilWatering === 0 && !isPostponed;
  const canPostpone =
    (isOverdue || isDueToday) && !isPostponed && plant.latest_watering;

  const { showWarning: showOverwateringWarning, daysSinceLastWatered } =
    shouldShowOverwateringWarning(
      plant.latest_watering,
      plant.suggested_watering_days || 7,
    );

  const imageSrc = plant.image || catalogPlant?.image || PLANT_FALLBACK_IMAGE;

  return (
    <LoadingTransition loading={loading} skeleton={plantDetailsSkeleton}>
    <div className="min-h-dvh bg-background pb-20 lg:pb-0">
      <Navigation />
      <main className="py-4 sm:py-6">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
          <CascadingContainer delay={100}>
            <PlantDetailHeader
              plant={plant}
              catalogPlant={catalogPlant}
              statusInfo={statusInfo}
            />
          </CascadingContainer>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <CascadingContainer delay={200}>
              <PlantImageCard
                imageSrc={imageSrc}
                plantNickname={plant.nickname}
                overwatering={overwatering}
                badgeInfo={getBadgeInfo()}
                onImageClick={() => setShowFullscreenImage(true)}
                onSmartTipsClick={() => setShowSuggestionsDialog(true)}
              />
            </CascadingContainer>

            <div className="flex flex-col mt-6 mb-6 lg:mt-0 lg:mb-0">
              <CascadingContainer delay={250}>
                <div className="flex flex-col h-[240px] sm:h-[280px] md:h-[360px] lg:h-[320px] space-y-2">
                  <WateringScheduleCard plant={plant} />
                  <PlantInfoCard plant={plant} />
                  <PlantActionsMenu
                    canPostpone={!!canPostpone}
                    hasSmartTips={!!getBadgeInfo()}
                    onWaterClick={() => setShowWaterConfirmation(true)}
                    onPostponeClick={() => setShowPostponeConfirmation(true)}
                    onViewHistory={() => setShowHistoryDialog(true)}
                    onJournalClick={() => setShowJournal(true)}
                    onEditClick={() => setShowEditDialog(true)}
                    onDeleteClick={() => setShowDeleteConfirmation(true)}
                  />
                </div>
              </CascadingContainer>
            </div>
          </div>

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

          <CascadingContainer delay={375}>
            <RepottingGuideCard
              plantNickname={plant.nickname}
              onClick={() => setShowRepotting(true)}
            />
          </CascadingContainer>

          <CascadingContainer delay={425}>
            <div className="mb-6">
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
            </div>
          </CascadingContainer>
        </div>
      </main>

      <PlantDetailDialogs
        plant={plant}
        catalogPlant={catalogPlant}
        imageSrc={imageSrc}
        showWaterConfirmation={showWaterConfirmation}
        onWaterConfirmationChange={setShowWaterConfirmation}
        onConfirmWater={handleConfirmWater}
        onAlreadyWatered={handleAlreadyWatered}
        showOverwateringWarning={showOverwateringWarning}
        daysSinceLastWatered={daysSinceLastWatered}
        showEditDialog={showEditDialog}
        onEditClose={() => setShowEditDialog(false)}
        onPlantUpdate={() => fetchPlants()}
        showHistoryDialog={showHistoryDialog}
        onHistoryClose={() => setShowHistoryDialog(false)}
        onPlantDataChange={() => fetchPlants()}
        showFullscreenImage={showFullscreenImage}
        onFullscreenImageClose={() => setShowFullscreenImage(false)}
        showJournal={showJournal}
        onJournalClose={() => setShowJournal(false)}
        showRepotting={showRepotting}
        onRepottingClose={() => setShowRepotting(false)}
        showSuggestionsDialog={showSuggestionsDialog}
        onSuggestionsClose={() => setShowSuggestionsDialog(false)}
        analysis={analysis}
        actionableInsights={getActionableInsights()}
        showPostponeConfirmation={showPostponeConfirmation}
        onPostponeConfirmationChange={setShowPostponeConfirmation}
        onConfirmPostpone={handleConfirmPostpone}
        currentNextWatering={formatDate(
          plant.postponement_date ||
            plant.latest_watering ||
            new Date().toISOString(),
        )}
        postponedNextWatering={getTomorrowDate()}
        showDeleteConfirmation={showDeleteConfirmation}
        onDeleteConfirmationChange={setShowDeleteConfirmation}
        onConfirmDelete={handleConfirmDelete}
      />

      <Footer />
    </div>
    </LoadingTransition>
  );
};

export default MyPlantDetails;

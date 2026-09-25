import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useUserPlants } from "@/hooks/useUserPlants";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { DelayedSkeleton, LoadingTransition } from "@/components/ui/loading-transition";
import { PlantDetailsPageSkeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { PlantHero, PlantCareTiles } from "@/components/plant-details/PlantBento";
import PlantActionsMenu from "@/components/plant-details/PlantActionsMenu";
import RepottingGuideCard from "@/components/plant-details/RepottingGuideCard";
import FertilizationCard from "@/components/plant-details/FertilizationCard";
import PlantDetailDialogs from "@/components/plant-details/PlantDetailDialogs";
import PlantCareCards from "@/components/plant-details/PlantCareCards";
import BlogPostsSection from "@/components/blog/BlogPostsSection";
import { useBadgeInfo } from "@/components/plant-details/usePlantStatusInfo";
import { shouldShowOverwateringWarning } from "@/utils/plants/overwatering";
import { plants as catalogPlants } from "@/data/plantData";
import { useEnrichedPlant } from "@/hooks/useEnrichedPlant";
import { calculateWateringSchedule } from "@/utils/watering/schedule";
import { getWateringStatus } from "@/utils/watering/status";
import { getPlantFertilizationStatus } from "@/utils/plants/fertilizationAdvice";
import { useWateringPatternAnalysis } from "@/hooks/useWateringPatternAnalysis";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { useManualNotifications } from "@/hooks/usePlantNotifications";
import { useRainDelay } from "@/hooks/useRainDelay";
import { RainDelayNotification } from "@/components/RainDelayNotification";
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
    logFertilization,
  } = useUserPlants();

  const { notifyWateringSuccess } = useManualNotifications();

  // Rain delay advice for this plant, resolved through the same shared hook the Dashboard and
  // notification center use, so all three agree.
  const { rainDelayByPlantId } = useRainDelay(plants);

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

  const { addJournalEntry } = useJournalEntries();


  const staticCatalogPlant = plant
    ? catalogPlants.find(
        (catalogP) =>
          catalogP.name.toLowerCase() === plant.plant_type.toLowerCase() ||
          catalogP.botanicalName.toLowerCase() ===
            plant.plant_type.toLowerCase(),
      )
    : undefined;

  // Prefer enriched data when available (falls back to static catalog)
  const enrichedCatalogPlant = useEnrichedPlant(plant?.plant_type);
  const catalogPlant = enrichedCatalogPlant ?? staticCatalogPlant;

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
        notifyWateringSuccess(plant.nickname);
        setShowWaterConfirmation(false);
      }
    },
    [plant, waterPlant, notifyWateringSuccess],
  );

  const handleAlreadyWatered = useCallback(
    async (date: Date, notes?: string) => {
      if (plant) {
        await waterPlant(plant.id, notes, date);
        notifyWateringSuccess(plant.nickname);
        setShowWaterConfirmation(false);
      }
    },
    [plant, waterPlant, notifyWateringSuccess],
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
    <DelayedSkeleton>
      <div className="bg-background pb-32 lg:pb-10">
        <main className="md:pt-6">
          <PlantDetailsPageSkeleton />
        </main>
      </div>
    </DelayedSkeleton>
  );

  // Show skeleton while plant data is loading
  if (loading && !plant) {
    return plantDetailsSkeleton;
  }

  // Plant not found (after loading completes)
  if (!loading && !plant) {
    return (
      <div className="bg-background pb-32 lg:pb-10 px-4 pt-10">
        <CascadingContainer delay={0}>
          <div className="max-w-md mx-auto rounded-tile bg-card p-6 text-center">
            <h1 className="font-display text-2xl font-bold tracking-[-0.03em] text-foreground">Plant not found</h1>
            <p className="text-[15px] text-muted-foreground mt-1">
              The plant you're looking for doesn't exist or you don't have access to it.
            </p>
            <button
              type="button"
              onClick={() => navigate("/my-plants")}
              className="mt-5 h-12 px-5 rounded-[18px] bg-sprout-dark text-sprout-cream font-bold text-[15px] inline-flex items-center gap-2 shadow-[inset_0_0_0_2px_#dfc490]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Plants
            </button>
          </div>
        </CascadingContainer>
      </div>
    );
  }

  const rainDelay = rainDelayByPlantId[plant.id];
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
    <div className="bg-background pb-32 lg:pb-10">
      <main className="md:pt-6">
        <div className="max-w-4xl mx-auto md:px-6 lg:px-8">
          <CascadingContainer delay={0} duration={200}>
            <PlantHero
              plant={plant}
              catalogPlant={catalogPlant}
              imageSrc={imageSrc}
              overwatering={overwatering}
              onBack={() => (window.history.length > 1 ? navigate(-1) : navigate("/my-plants"))}
              onImageClick={() => setShowFullscreenImage(true)}
              actions={
                <PlantActionsMenu
                  canPostpone={!!canPostpone}
                  hasSmartTips={!!getBadgeInfo()}
                  onWaterClick={() => setShowWaterConfirmation(true)}
                  onPostponeClick={() => setShowPostponeConfirmation(true)}
                  onViewHistory={() => setShowHistoryDialog(true)}
                  onEditClick={() => setShowEditDialog(true)}
                  onDeleteClick={() => setShowDeleteConfirmation(true)}
                />
              }
            />
          </CascadingContainer>

          {/*
            Rain delay notice. This is where a watering notification lands, so it is the natural
            place to explain why the user might hold off and to offer the postponement. The
            plant remains due — rain probability carries no timing, so nothing here suppresses
            the reminder.
          */}
          {rainDelay && (
            <CascadingContainer delay={40} duration={200}>
              <div className="px-4 md:px-0 pt-4">
                <RainDelayNotification
                  advice={rainDelay}
                  plantName={plant.nickname}
                  onWaterAnyway={() => setShowWaterConfirmation(true)}
                  onPostpone={(days) =>
                    postponeWatering(plant.id, days, "Rain expected")
                  }
                />
              </div>
            </CascadingContainer>
          )}

          <CascadingContainer delay={50} duration={200}>
            <PlantCareTiles
              plant={plant}
              calc={wateringCalc}
              status={getWateringStatus(wateringCalc, plant.latest_watering)}
              lightRequirement={catalogPlant?.lightRequirement || "Bright, indirect"}
              humidity={catalogPlant?.humidity || "40-60%"}
              temperature={catalogPlant?.temperature || "65-75°F (18-24°C)"}
              fertilization={getPlantFertilizationStatus(plant)}
              analysis={analysis}
              smartTips={getBadgeInfo()}
              onWaterClick={() => setShowWaterConfirmation(true)}
              onFertilizeClick={() =>
                document
                  .getElementById("fertilization-card")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              onSmartTipsClick={() => setShowSuggestionsDialog(true)}
              onHistoryClick={() => setShowHistoryDialog(true)}
              onJournalClick={() => setShowJournal(true)}
            />
          </CascadingContainer>

          <div className="px-4 md:px-0 mt-2.5 md:mt-3.5 space-y-2.5 md:space-y-3.5">
          <CascadingContainer delay={125} duration={200}>
            <RepottingGuideCard
              plantNickname={plant.nickname}
              onClick={() => setShowRepotting(true)}
            />
          </CascadingContainer>

          <CascadingContainer delay={150} duration={200}>
            <div id="fertilization-card" className="scroll-mt-6" />
            <FertilizationCard
              plant={plant}
              catalogPlant={catalogPlant}
              onLogFertilization={async (date?: Date) => { await logFertilization(plant.id, date); }}
              onAddJournalEntry={async (title, content) => { await addJournalEntry(plant.id, title, content, null, []); }}
            />
          </CascadingContainer>

          <CascadingContainer delay={175} duration={200}>
            <div>
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

          <CascadingContainer delay={200} duration={200}>
            <BlogPostsSection plantName={catalogPlant?.name || plant.plant_type} />
          </CascadingContainer>
          </div>
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
    </div>
    </LoadingTransition>
  );
};

export default MyPlantDetails;

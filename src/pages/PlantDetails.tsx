import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import AddPlantDialog from "@/components/AddPlantDialog";
import PlantImageSection from "@/components/plant-details/PlantImageSection";
import PlantInfoSection from "@/components/plant-details/PlantInfoSection";
import PlantCareGrid from "@/components/plant-details/PlantCareGrid";
import PlantCareCards from "@/components/plant-details/PlantCareCards";
import BlogPostsSection from "@/components/blog/BlogPostsSection";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { plants } from "@/data/plantData";
import { useEnrichedPlant } from "@/hooks/useEnrichedPlant";

const PlantDetails = () => {
  const { plantName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Find the plant in the static catalog by matching the URL slug
  const staticPlant = plants.find(
    (p) =>
      p.name.toLowerCase().replace(/\s+/g, "-") === plantName?.toLowerCase()
  );

  // Load enriched data (falls back to static catalog)
  const enrichedPlant = useEnrichedPlant(staticPlant?.name);
  const plant = enrichedPlant ?? staticPlant;

  const handleAddToCollection = () => {
    if (plant) {
      setIsAddDialogOpen(true);
    }
  };

  const handleCloseAddDialog = () => {
    setIsAddDialogOpen(false);
  };

  const handleSignInToAdd = () => {
    const currentPath = encodeURIComponent(location.pathname);
    navigate(`/auth?redirect=${currentPath}`);
  };

  if (!plant) {
    return (
      <div className="bg-background pb-32 lg:pb-10 px-4 pt-10">
        <CascadingContainer delay={0}>
          <div className="max-w-md mx-auto rounded-tile bg-card p-6 text-center">
            <h1 className="font-display text-2xl font-bold tracking-[-0.03em] text-foreground">Plant not found</h1>
            <p className="text-[15px] text-muted-foreground mt-1">We couldn't find that plant in the catalog.</p>
            <button
              type="button"
              onClick={() => navigate("/plant-catalog")}
              className="mt-5 h-12 px-5 rounded-[18px] bg-sprout-dark text-sprout-cream font-bold text-[15px] shadow-[inset_0_0_0_2px_#dfc490]"
              data-testid="back-to-catalog-button"
            >
              Back to Catalog
            </button>
          </div>
        </CascadingContainer>
      </div>
    );
  }

  // Create default care instructions and common problems if not provided
  const careInstructions = plant.careInstructions || [
    "Water when top inch of soil feels dry",
    "Place in appropriate light conditions",
    "Maintain proper humidity levels",
    "Remove dead or yellowing leaves",
    "Fertilize during growing season",
  ];

  const commonProblems = plant.commonProblems || [
    "Overwatering: Yellow leaves and root rot",
    "Underwatering: Wilting and dry soil",
    "Poor lighting: Leggy growth or leaf drop",
    "Low humidity: Brown leaf tips",
  ];

  return (
    <div className="bg-background pb-32 lg:pb-10">
      <div className="max-w-6xl mx-auto md:px-6 lg:px-8 md:pt-7">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8">
          <CascadingContainer delay={0} className="h-full">
            <PlantImageSection image={plant.image} name={plant.name} onBack={() => navigate("/plant-catalog")} />
          </CascadingContainer>

          <CascadingContainer delay={75}>
            <PlantInfoSection
              name={plant.name}
              botanicalName={plant.botanicalName}
              otherNames={plant.otherNames}
              description={
                plant.description ||
                `The ${plant.name} is a beautiful plant that makes a great addition to any home. It's known for its unique characteristics and is perfect for plant enthusiasts.`
              }
              careLevel={plant.careLevel}
              toxicity={plant.toxicity || "Unknown - consult a veterinarian"}
              onAddToCollection={handleAddToCollection}
              isAuthenticated={!!user}
              onSignInToAdd={handleSignInToAdd}
            />
          </CascadingContainer>
        </div>

        <div className="pt-[18px] space-y-2.5 md:space-y-3.5">
          <CascadingContainer delay={150}>
            <PlantCareGrid
              wateringFrequency={plant.wateringFrequency}
              suggestedWateringDays={plant.suggestedWateringDays || 7}
              lightRequirement={plant.lightRequirement}
              temperature={plant.temperature || "65-75°F (18-24°C)"}
              humidity={plant.humidity || "40-60%"}
            />
          </CascadingContainer>

          <CascadingContainer delay={225}>
            <div className="px-4 md:px-0">
              <PlantCareCards careInstructions={careInstructions} commonProblems={commonProblems} />
            </div>
          </CascadingContainer>

          <CascadingContainer delay={300}>
            <div className="px-4 md:px-0">
              <BlogPostsSection plantName={plant.name} />
            </div>
          </CascadingContainer>
        </div>
      </div>

      {user && (
        <AddPlantDialog
          isOpen={isAddDialogOpen}
          onClose={handleCloseAddDialog}
          plantData={{
            name: plant.name,
            botanicalName: plant.botanicalName,
            image: plant.image,
            wateringFrequency: plant.wateringFrequency,
            suggestedWateringDays: plant.suggestedWateringDays,
            lightRequirement: plant.lightRequirement,
            careLevel: plant.careLevel,
          }}
        />
      )}
    </div>
  );
};

export default PlantDetails;

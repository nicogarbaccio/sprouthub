import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import Navigation from "@/components/Navigation";
import AddPlantDialog from "@/components/AddPlantDialog";
import PlantDetailsHeader from "@/components/plant-details/PlantDetailsHeader";
import PlantImageSection from "@/components/plant-details/PlantImageSection";
import PlantInfoSection from "@/components/plant-details/PlantInfoSection";
import PlantCareGrid from "@/components/plant-details/PlantCareGrid";
import PlantCareCards from "@/components/plant-details/PlantCareCards";
import BlogPostsSection from "@/components/blog/BlogPostsSection";
import Footer from "@/components/Footer";
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
      <div className="min-h-dvh bg-background pb-28 lg:pb-0 ">
        <Navigation />
        <div className="pt-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto py-12 text-center">
            <CascadingContainer delay={0}>
              <h1 className="text-2xl font-bold text-plant-text mb-4">
                Plant Not Found
              </h1>
              <PlantDetailsHeader
                onBackClick={() => navigate("/plant-catalog")}
              />
            </CascadingContainer>
          </div>
        </div>
        <Footer />
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
    <div className="min-h-dvh bg-background pb-28 lg:pb-0 ">
      <Navigation />
      <div className="pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CascadingContainer delay={0}>
            <PlantDetailsHeader
              onBackClick={() => navigate("/plant-catalog")}
            />
          </CascadingContainer>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <CascadingContainer delay={100} className="h-full">
              <PlantImageSection image={plant.image} name={plant.name} />
            </CascadingContainer>

            <div className="space-y-6">
              <CascadingContainer delay={200}>
                <PlantInfoSection
                  name={plant.name}
                  botanicalName={plant.botanicalName}
                  otherNames={plant.otherNames}
                  description={
                    plant.description ||
                    `The ${plant.name} is a beautiful plant that makes a great addition to any home. It's known for its unique characteristics and is perfect for plant enthusiasts.`
                  }
                  careLevel={plant.careLevel}
                  toxicity={
                    plant.toxicity || "Unknown - consult a veterinarian"
                  }
                  onAddToCollection={handleAddToCollection}
                  isAuthenticated={!!user}
                  onSignInToAdd={handleSignInToAdd}
                />
              </CascadingContainer>

              <CascadingContainer delay={300}>
                <PlantCareGrid
                  wateringFrequency={plant.wateringFrequency}
                  suggestedWateringDays={plant.suggestedWateringDays || 7}
                  lightRequirement={plant.lightRequirement}
                  temperature={plant.temperature || "65-75°F (18-24°C)"}
                  humidity={plant.humidity || "40-60%"}
                />
              </CascadingContainer>
            </div>
          </div>

          <CascadingContainer delay={400}>
            <PlantCareCards
              careInstructions={careInstructions}
              commonProblems={commonProblems}
            />
          </CascadingContainer>

          <CascadingContainer delay={500}>
            <BlogPostsSection plantName={plant.name} />
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
      <Footer />
    </div>
  );
};

export default PlantDetails;

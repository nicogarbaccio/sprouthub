import { Flower2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import PlantImage from "@/components/ui/plant-image";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { getPlantImageUrl } from "@/utils/plants/images";

interface DashboardPlantGalleryProps {
  favoritePlants: any[]; // UserPlant array
  onImageClick: (imageSrc: string, plantName: string, imageSource?: string) => void;
  onNavigate: (path: string) => void;
}

export function DashboardPlantGallery({
  favoritePlants,
  onImageClick,
  onNavigate,
}: DashboardPlantGalleryProps) {
  if (favoritePlants.length === 0) {
    return null;
  }

  return (
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
                    onImageClick(
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
                      onImageClick(
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
                  onClick={() => onNavigate(`/my-plants/${plant.id}`)}
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
  );
}

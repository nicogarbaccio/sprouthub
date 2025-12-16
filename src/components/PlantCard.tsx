import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Droplets, Sun, Clock, Plus, Eye, LogIn } from "lucide-react";
import PlantImage from "@/components/ui/plant-image";
import FullscreenImageModal from "@/components/ui/fullscreen-image-modal";

interface PlantCardProps {
  name: string;
  botanicalName: string;
  otherNames?: string[];
  image: string;
  wateringFrequency: string;
  suggestedWateringDays?: number;
  lightRequirement: string;
  careLevel: "Easy" | "Medium" | "Hard";
  onAddToCollection?: () => void;
  onViewDetails?: () => void;
  isAuthenticated?: boolean;
  onSignInToAdd?: () => void;
}

const PlantCard = ({
  name,
  botanicalName,
  otherNames,
  image,
  wateringFrequency,
  suggestedWateringDays,
  lightRequirement,
  careLevel,
  onAddToCollection,
  onViewDetails,
  isAuthenticated = false,
  onSignInToAdd,
}: PlantCardProps) => {
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const getCareColor = (level: string) => {
    switch (level) {
      case "Easy":
        return "bg-sprout-success text-sprout-white border-sprout-success";
      case "Medium":
        return "bg-sprout-warning text-sprout-white border-sprout-warning";
      case "Hard":
        return "bg-sprout-error text-sprout-white border-sprout-error";
      default:
        return "bg-neutral-light text-neutral-dark border-neutral-medium/30";
    }
  };

  return (
    <div
      className="bg-card rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border border-border"
      data-testid="plant-card"
    >
      <div className="relative">
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
          aria-label={`View ${name} image in fullscreen`}
        >
          <PlantImage
            src={image}
            alt={name}
            className="w-full h-48"
            imageClassName="object-contain"
          />
        </div>
        <div className="absolute top-3 right-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getCareColor(
              careLevel
            )}`}
          >
            {careLevel}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3
          className="text-lg font-semibold text-foreground mb-1 "
          data-testid="plant-name"
        >
          <button
            onClick={onViewDetails}
            className="text-left hover:text-primary transition-colors duration-200 cursor-pointer hover:underline w-full"
          >
            {name}
          </button>
        </h3>
        <p
          className="text-sm text-muted-foreground italic mb-1"
          data-testid="plant-botanical-name"
        >
          {botanicalName}
        </p>

        {otherNames && otherNames.length > 0 && (
          <p className="text-xs text-muted-foreground/80 mb-4 line-clamp-1">
            <span className="font-medium">aka:</span> {otherNames.join(", ")}
          </p>
        )}
        {!otherNames?.length && <div className="mb-4"></div>}

        <div className="space-y-3 mb-4">
          <div
            className="flex items-center space-x-2"
            data-testid="plant-watering-info"
          >
            <Droplets className="w-4 h-4 text-plant-primary dark:text-plant-secondary" />
            <div>
              <span className="text-sm text-foreground">
                {wateringFrequency}
              </span>
              {suggestedWateringDays && (
                <span className="text-xs text-muted-foreground ml-1">
                  (Every {suggestedWateringDays} days)
                </span>
              )}
            </div>
          </div>
          <div
            className="flex items-center space-x-2"
            data-testid="plant-light-info"
          >
            <Sun className="w-4 h-4 text-plant-primary dark:text-plant-secondary" />
            <span className="text-sm text-foreground">{lightRequirement}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            onClick={onViewDetails}
            className="w-full bg-sprout-primary hover:bg-sprout-primary/90 text-sprout-white rounded-xl font-medium border border-sprout-light/30 hover:border-sprout-light/50"
            data-testid="view-details-button"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>

          {isAuthenticated ? (
            <Button
              onClick={onAddToCollection}
              className="w-full bg-sprout-success hover:bg-sprout-success/90 text-sprout-white rounded-xl font-medium"
              data-testid="add-to-collection-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Collection
            </Button>
          ) : (
            <Button
              onClick={onSignInToAdd}
              className="w-full bg-sprout-light hover:bg-sprout-medium text-sprout-white rounded-xl font-medium"
              data-testid="sign-in-to-add-button"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign in to Add
            </Button>
          )}
        </div>
      </div>

      <FullscreenImageModal
        isOpen={showFullscreenImage}
        onClose={() => setShowFullscreenImage(false)}
        imageSrc={image}
        imageAlt={name}
        plantName={name}
      />
    </div>
  );
};

export default PlantCard;

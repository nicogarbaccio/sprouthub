import { useState } from "react";
import { Droplets, Sun, Plus, LogIn } from "lucide-react";
import PlantImage from "@/components/ui/plant-image";
import FullscreenImageModal from "@/components/ui/fullscreen-image-modal";
import { ImageExpandButton } from "@/components/ui/image-expand-button";

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

  // Bento status colours: green for easy, cream for medium, terracotta for hard (never red)
  const careClasses =
    careLevel === "Easy"
      ? "bg-sprout-success text-sprout-dark"
      : careLevel === "Medium"
        ? "bg-sprout-cream text-sprout-dark"
        : careLevel === "Hard"
          ? "bg-sprout-warning text-sprout-dark"
          : "bg-card text-foreground";

  return (
    <div className="bg-card rounded-card p-2 h-full flex flex-col" data-testid="plant-card">
      {/* Photo well */}
      <div className="relative group h-[148px] md:h-[180px] rounded-well overflow-hidden bg-field shrink-0">
        <div
          className="w-full h-full cursor-pointer"
          onClick={() => onViewDetails?.()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onViewDetails?.();
            }
          }}
          aria-label={`View ${name} details`}
        >
          <PlantImage src={image} alt={name} className="w-full h-full" imageClassName="object-cover" />
        </div>
        <span className={`absolute top-2 left-2 px-2.5 py-[5px] rounded-full text-xs font-bold pointer-events-none ${careClasses}`}>
          {careLevel}
        </span>
        <ImageExpandButton onExpand={() => setShowFullscreenImage(true)} />
      </div>

      <div className="flex flex-col flex-1 px-1.5 pt-2.5 pb-1.5">
        <h3 className="text-[17px] font-bold text-foreground leading-snug" data-testid="plant-name">
          <button onClick={onViewDetails} className="text-left w-full truncate block hover:underline underline-offset-4">
            {name}
          </button>
        </h3>
        <p className="text-[13px] text-muted-foreground italic truncate" data-testid="plant-botanical-name" title={botanicalName}>
          {botanicalName}
        </p>
        {otherNames && otherNames.length > 0 && (
          <p className="text-xs text-muted-foreground truncate mt-0.5" title={otherNames.join(", ")}>
            aka {otherNames.join(", ")}
          </p>
        )}

        <div className="space-y-1.5 mt-3 mb-3">
          <div className="flex items-center gap-2 rounded-xl bg-field px-2.5 py-1.5" data-testid="plant-watering-info">
            <Droplets className="w-3.5 h-3.5 shrink-0 text-sprout-water" />
            <span className="text-[13px] font-semibold text-foreground truncate">
              {suggestedWateringDays ? `Every ${suggestedWateringDays} days` : wateringFrequency}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-field px-2.5 py-1.5" data-testid="plant-light-info">
            <Sun className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
            <span className="text-[13px] font-semibold text-foreground truncate">{lightRequirement}</span>
          </div>
        </div>

        <div className="flex gap-1.5 mt-auto">
          <button
            type="button"
            onClick={onViewDetails}
            className="flex-1 h-10 rounded-[14px] bg-field text-foreground text-sm font-bold hover:bg-sprout-cream hover:text-sprout-dark transition-colors"
            data-testid="view-details-button"
          >
            Details
          </button>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={onAddToCollection}
              className="flex-1 h-10 rounded-[14px] bg-sprout-dark text-sprout-cream dark:bg-sprout-cream dark:text-sprout-dark text-sm font-bold inline-flex items-center justify-center gap-1"
              aria-label={`Add ${name} to your collection`}
              data-testid="add-to-collection-button"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Add
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignInToAdd}
              className="flex-1 h-10 rounded-[14px] bg-sprout-dark text-sprout-cream dark:bg-sprout-cream dark:text-sprout-dark text-sm font-bold inline-flex items-center justify-center gap-1"
              aria-label={`Sign in to add ${name}`}
              data-testid="sign-in-to-add-button"
            >
              <LogIn className="w-4 h-4" />
              Sign in
            </button>
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

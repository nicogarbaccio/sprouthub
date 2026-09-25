import { ChevronLeft } from "lucide-react";
import PlantImage from "@/components/ui/plant-image";

interface PlantImageSectionProps {
  image: string;
  name: string;
  onBack: () => void;
}

/** Catalog hero: the photo in a rounded well with a back button, like a plant's own page */
const PlantImageSection = ({ image, name, onBack }: PlantImageSectionProps) => {
  return (
    <div
      data-testid="plant-image-section"
      className="relative h-[340px] md:h-[400px] lg:h-full lg:min-h-[440px] rounded-b-[40px] md:rounded-[40px] overflow-hidden bg-field"
    >
      <PlantImage src={image} alt={name} className="w-full h-full" data-testid="plant-image" />
      <button
        type="button"
        onClick={onBack}
        className="absolute top-3.5 left-6 md:left-4 w-12 h-12 rounded-2xl bg-card text-foreground flex items-center justify-center shadow-sm"
        aria-label="Back to catalog"
        data-testid="back-to-catalog-button"
      >
        <ChevronLeft className="w-[22px] h-[22px]" strokeWidth={2.2} />
      </button>
    </div>
  );
};

export default PlantImageSection;

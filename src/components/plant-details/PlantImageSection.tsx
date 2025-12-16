import PlantImage from "@/components/ui/plant-image";

interface PlantImageSectionProps {
  image: string;
  name: string;
}

const PlantImageSection = ({ image, name }: PlantImageSectionProps) => {
  return (
    <div data-testid="plant-image-section" className="space-y-1">
      <PlantImage
        src={image}
        alt={name}
        className="w-full h-96 rounded-2xl shadow-lg"
        data-testid="plant-image"
      />
    </div>
  );
};

export default PlantImageSection;

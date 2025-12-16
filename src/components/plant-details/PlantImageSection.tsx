import PlantImage from "@/components/ui/plant-image";

interface PlantImageSectionProps {
  image: string;
  name: string;
}

const PlantImageSection = ({ image, name }: PlantImageSectionProps) => {
  return (
    <div data-testid="plant-image-section" className="h-full">
      <PlantImage
        src={image}
        alt={name}
        className="w-full h-96 lg:h-full rounded-2xl shadow-lg object-cover"
        data-testid="plant-image"
      />
    </div>
  );
};

export default PlantImageSection;

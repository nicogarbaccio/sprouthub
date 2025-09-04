import PlantImage from "@/components/ui/plant-image";

interface PlantImageSectionProps {
 image: string;
 name: string;
}

const PlantImageSection = ({ image, name }: PlantImageSectionProps) => {
 return (
  <div>
   <PlantImage
    src={image}
    alt={name}
    className="w-full h-96 rounded-2xl shadow-lg"
   />
  </div>
 );
};

export default PlantImageSection;

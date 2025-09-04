
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlantDetailsHeaderProps {
 onBackClick: () => void;
}

const PlantDetailsHeader = ({ onBackClick }: PlantDetailsHeaderProps) => {
 return (
  <Button 
   onClick={onBackClick} 
   variant="outline" 
   className="mb-6"
  >
   <ArrowLeft className="w-4 h-4 mr-2" />
   Back to Catalog
  </Button>
 );
};

export default PlantDetailsHeader;


import { Droplets, Sun, Thermometer, Clock } from 'lucide-react';

interface PlantCareGridProps {
 wateringFrequency: string;
 suggestedWateringDays: number;
 lightRequirement: string;
 temperature: string;
 humidity: string;
}

const PlantCareGrid = ({ 
 wateringFrequency, 
 suggestedWateringDays,
 lightRequirement, 
 temperature, 
 humidity 
}: PlantCareGridProps) => {
 return (
  <div className="grid grid-cols-2 gap-4">
   <div className="flex items-center space-x-3 p-3 bg-plant-neutral rounded-lg">
    <Droplets className="w-5 h-5 text-plant-primary" />
    <div>
     <p className="text-sm text-plant-text/60">Watering</p>
     <p className="text-sm font-medium text-plant-text">{wateringFrequency}</p>
     <p className="text-xs text-plant-text/50">Every {suggestedWateringDays} days</p>
    </div>
   </div>
   
   <div className="flex items-center space-x-3 p-3 bg-plant-neutral rounded-lg">
    <Sun className="w-5 h-5 text-plant-primary" />
    <div>
     <p className="text-sm text-plant-text/60">Light</p>
     <p className="text-sm font-medium text-plant-text">{lightRequirement}</p>
    </div>
   </div>
   
   <div className="flex items-center space-x-3 p-3 bg-plant-neutral rounded-lg">
    <Thermometer className="w-5 h-5 text-plant-primary" />
    <div>
     <p className="text-sm text-plant-text/60">Temperature</p>
     <p className="text-sm font-medium text-plant-text">{temperature}</p>
    </div>
   </div>
   
   <div className="flex items-center space-x-3 p-3 bg-plant-neutral rounded-lg">
    <Clock className="w-5 h-5 text-plant-primary" />
    <div>
     <p className="text-sm text-plant-text/60">Humidity</p>
     <p className="text-sm font-medium text-plant-text">{humidity}</p>
    </div>
   </div>
  </div>
 );
};

export default PlantCareGrid;

import { Droplets, Sun, Thermometer, Clock } from "lucide-react";

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
  humidity,
}: PlantCareGridProps) => {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-sprout-primary rounded-lg border-2 border-sprout-medium shadow-sm">
      <div className="flex items-center space-x-3 p-3 bg-white/20 backdrop-blur-sm rounded-lg">
        <Droplets className="w-5 h-5 text-white" />
        <div>
          <p className="text-sm text-white/80">Watering</p>
          <p className="text-sm font-medium text-white">{wateringFrequency}</p>
          <p className="text-xs text-white/70">
            Every {suggestedWateringDays} days
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3 p-3 bg-white/20 backdrop-blur-sm rounded-lg">
        <Sun className="w-5 h-5 text-white" />
        <div>
          <p className="text-sm text-white/80">Light</p>
          <p className="text-sm font-medium text-white">{lightRequirement}</p>
        </div>
      </div>

      <div className="flex items-center space-x-3 p-3 bg-white/20 backdrop-blur-sm rounded-lg">
        <Thermometer className="w-5 h-5 text-white" />
        <div>
          <p className="text-sm text-white/80">Temperature</p>
          <p className="text-sm font-medium text-white">{temperature}</p>
        </div>
      </div>

      <div className="flex items-center space-x-3 p-3 bg-white/20 backdrop-blur-sm rounded-lg">
        <Clock className="w-5 h-5 text-white" />
        <div>
          <p className="text-sm text-white/80">Humidity</p>
          <p className="text-sm font-medium text-white">{humidity}</p>
        </div>
      </div>
    </div>
  );
};

export default PlantCareGrid;

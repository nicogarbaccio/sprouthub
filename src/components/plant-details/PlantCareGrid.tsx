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
    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-100 dark:bg-sprout-primary rounded-lg border-2 border-gray-200 dark:border-sprout-medium shadow-sm">
      <div className="flex items-center space-x-3 p-3 bg-white dark:bg-white/20 backdrop-blur-sm rounded-lg">
        <Droplets className="w-5 h-5 text-sprout-primary dark:text-white" />
        <div>
          <p className="text-sm text-sprout-primary dark:text-white/80">Watering</p>
          <p className="text-sm font-medium text-sprout-dark dark:text-white">{wateringFrequency}</p>
          <p className="text-xs text-sprout-primary/70 dark:text-white/70">
            Every {suggestedWateringDays} days
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3 p-3 bg-white dark:bg-white/20 backdrop-blur-sm rounded-lg">
        <Sun className="w-5 h-5 text-sprout-primary dark:text-white" />
        <div>
          <p className="text-sm text-sprout-primary dark:text-white/80">Light</p>
          <p className="text-sm font-medium text-sprout-dark dark:text-white">{lightRequirement}</p>
        </div>
      </div>

      <div className="flex items-center space-x-3 p-3 bg-white dark:bg-white/20 backdrop-blur-sm rounded-lg">
        <Thermometer className="w-5 h-5 text-sprout-primary dark:text-white" />
        <div>
          <p className="text-sm text-sprout-primary dark:text-white/80">Temperature</p>
          <p className="text-sm font-medium text-sprout-dark dark:text-white">{temperature}</p>
        </div>
      </div>

      <div className="flex items-center space-x-3 p-3 bg-white dark:bg-white/20 backdrop-blur-sm rounded-lg">
        <Clock className="w-5 h-5 text-sprout-primary dark:text-white" />
        <div>
          <p className="text-sm text-sprout-primary dark:text-white/80">Humidity</p>
          <p className="text-sm font-medium text-sprout-dark dark:text-white">{humidity}</p>
        </div>
      </div>
    </div>
  );
};

export default PlantCareGrid;

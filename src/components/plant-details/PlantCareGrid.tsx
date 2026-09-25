import { Droplets, Sun } from "lucide-react";
import { humidityCopy, humidityHeadline } from "./PlantBento";

interface PlantCareGridProps {
  wateringFrequency: string;
  suggestedWateringDays: number;
  lightRequirement: string;
  temperature: string;
  humidity: string;
}

/** Care tiles for a catalog plant, in the same colours as a plant's own page */
const PlantCareGrid = ({
  wateringFrequency,
  suggestedWateringDays,
  lightRequirement,
  temperature,
  humidity,
}: PlantCareGridProps) => {
  const tile = "rounded-card p-4 min-h-[120px] flex flex-col justify-between gap-2 min-w-0";
  const headline = "font-display text-xl md:text-2xl font-extrabold leading-none tracking-[-0.03em]";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3.5 px-4 md:px-0">
      <div className={`${tile} bg-sprout-water text-sprout-dark`}>
        <Droplets className="w-6 h-6" />
        <div>
          <div className="text-[13px] font-semibold">Watering · every {suggestedWateringDays} days</div>
          <div className="text-[17px] font-bold leading-snug">{wateringFrequency}</div>
        </div>
      </div>
      <div className={`${tile} bg-sprout-cream text-sprout-dark`}>
        <Sun className="w-6 h-6" />
        <div>
          <div className="text-[13px] font-semibold">Light</div>
          <div className="text-[17px] font-bold leading-snug">{lightRequirement}</div>
        </div>
      </div>
      <div className={`${tile} bg-card text-foreground`}>
        <div className={`${headline} whitespace-nowrap`}>{temperature.split(" (")[0]}</div>
        <div>
          <div className="text-[13px] font-semibold text-muted-foreground">Temperature</div>
          <div className="text-[17px] font-bold leading-snug">Room temp</div>
        </div>
      </div>
      <div className={`${tile} bg-sprout-primary text-sprout-cream`}>
        <div className={`${headline} whitespace-nowrap`}>{humidityHeadline(humidity)}</div>
        <div>
          <div className="text-[13px] font-semibold">Humidity</div>
          <div className="text-[17px] font-bold leading-snug">{humidityCopy(humidity)}</div>
        </div>
      </div>
    </div>
  );
};

export default PlantCareGrid;

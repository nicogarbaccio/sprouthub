import { Lightbulb } from "lucide-react";
import { OptionCard } from "./OptionCard";
import type { WizardStepProps } from "./types";

export const StepPlantSize = ({ factors, updateFactor, labels, plantName }: WizardStepProps) => (
  <div className="space-y-4">
    <div className="text-center mb-6">
      <Lightbulb className="w-12 h-12 text-sprout-light mx-auto mb-2" />
      <h3 className="text-lg font-semibold text-sprout-white">
        How big is your {plantName}?
      </h3>
      <p className="text-sprout-light">
        Plant size affects how much water the soil can hold
      </p>
    </div>

    <div className="space-y-3">
      {(
        Object.keys(labels.plantSize) as Array<keyof typeof labels.plantSize>
      ).map((size) => (
        <div key={size}>
          <OptionCard
            value={size}
            currentValue={factors.plantSize}
            onClick={(value) => updateFactor("plantSize", value)}
            label={labels.plantSize[size]}
            testId={`plant-size-${size}`}
          />
        </div>
      ))}
    </div>
  </div>
);

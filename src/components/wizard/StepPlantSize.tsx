import { OptionCard, OptionGroup, WizardStepHeading } from "./OptionCard";
import type { WizardStepProps } from "./types";

export const StepPlantSize = ({ factors, updateFactor, labels, plantName }: WizardStepProps) => (
  <div className="space-y-4">
    <WizardStepHeading
      title={`How big is your ${plantName}?`}
      body="Plant size affects how much water the soil can hold"
    />
    <OptionGroup label="Plant size">
      {(Object.keys(labels.plantSize) as Array<keyof typeof labels.plantSize>).map((size) => (
        <OptionCard
          key={size}
          value={size}
          currentValue={factors.plantSize}
          onClick={(value) => updateFactor("plantSize", value)}
          label={labels.plantSize[size]}
          testId={`plant-size-${size}`}
        />
      ))}
    </OptionGroup>
  </div>
);

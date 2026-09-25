import { Calendar } from "lucide-react";
import { OptionCard, OptionGroup, WizardStepHeading } from "./OptionCard";
import type { WizardStepProps } from "./types";

export const StepPreferences = ({ factors, updateFactor, labels }: WizardStepProps) => (
  <div className="space-y-5">
    <WizardStepHeading title="Your care style" body="Let's personalize the schedule to how you look after plants" />

    <OptionGroup label="Care style">
      {(Object.keys(labels.careStyle) as Array<keyof typeof labels.careStyle>).map((style) => (
        <OptionCard
          key={style}
          value={style}
          currentValue={factors.careStyle}
          onClick={(value) => updateFactor("careStyle", value)}
          label={labels.careStyle[style]}
          testId={`care-style-${style}`}
        />
      ))}
    </OptionGroup>

    <OptionGroup label="Soil type">
      {(Object.keys(labels.soilType) as Array<keyof typeof labels.soilType>).map((soil) => (
        <OptionCard
          key={soil}
          value={soil}
          currentValue={factors.soilType}
          onClick={(value) => updateFactor("soilType", value)}
          label={labels.soilType[soil]}
          testId={`soil-type-${soil}`}
        />
      ))}
    </OptionGroup>

    <div className="rounded-[18px] bg-card px-4 py-3.5 flex items-start gap-3">
      <Calendar className="w-5 h-5 shrink-0 mt-0.5 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Season is set to{" "}
        <span className="font-bold text-foreground">
          {labels.season[factors.season as keyof typeof labels.season]}
        </span>{" "}
        based on today's date.
      </p>
    </div>
  </div>
);

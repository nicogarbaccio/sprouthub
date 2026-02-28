import { Label } from "@/components/ui/label";
import { Heart, Shovel, Calendar } from "lucide-react";
import { OptionCard } from "./OptionCard";
import type { WizardStepProps } from "./types";

export const StepPreferences = ({ factors, updateFactor, labels }: WizardStepProps) => (
  <div className="space-y-6">
    <div className="text-center mb-6">
      <Heart className="w-12 h-12 text-sprout-light mx-auto mb-2" />
      <h3 className="text-lg font-semibold text-sprout-white">
        Personal Preferences
      </h3>
      <p className="text-sprout-light">
        Let's personalize the schedule to your care style
      </p>
    </div>

    {/* Care Style */}
    <div className="space-y-3">
      <Label className="text-base font-medium flex items-center gap-2 text-sprout-white">
        <Heart className="w-4 h-4" />
        Care Style
      </Label>
      <div className="space-y-2">
        {(
          Object.keys(labels.careStyle) as Array<
            keyof typeof labels.careStyle
          >
        ).map((style) => (
          <div key={style}>
            <OptionCard
              value={style}
              currentValue={factors.careStyle}
              onClick={(value) => updateFactor("careStyle", value)}
              label={labels.careStyle[style]}
              testId={`care-style-${style}`}
            />
          </div>
        ))}
      </div>
    </div>

    {/* Soil Type */}
    <div className="space-y-3">
      <Label className="text-base font-medium flex items-center gap-2 text-sprout-white">
        <Shovel className="w-4 h-4" />
        Soil Type
      </Label>
      <div className="space-y-2">
        {(
          Object.keys(labels.soilType) as Array<keyof typeof labels.soilType>
        ).map((soil) => (
          <div key={soil}>
            <OptionCard
              value={soil}
              currentValue={factors.soilType}
              onClick={(value) => updateFactor("soilType", value)}
              label={labels.soilType[soil]}
              testId={`soil-type-${soil}`}
            />
          </div>
        ))}
      </div>
    </div>

    {/* Season Info */}
    <div className="p-4 bg-sprout-medium/20 rounded-lg border border-sprout-medium">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-4 h-4 text-sprout-light" />
        <span className="font-medium text-sprout-white">Current Season</span>
      </div>
      <p className="text-sm text-sprout-light">
        We've automatically set this to{" "}
        <span className="font-medium">
          {labels.season[factors.season as keyof typeof labels.season]}
        </span>{" "}
        based on the current date.
      </p>
    </div>
  </div>
);

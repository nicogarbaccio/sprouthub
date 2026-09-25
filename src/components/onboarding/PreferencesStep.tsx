import { useState } from "react";
import { z } from "zod";
import { StepHeading, StepNav, OptionRow } from "./OnboardingUI";
import { getFactorLabels } from "@/utils/watering/smartSchedule";
import { safeJsonParse } from "@/utils/safeJsonParse";

const weatherPrefsSchema = z.record(z.string(), z.unknown());

interface PreferencesStepProps {
  onNext: () => void;
  onBack: () => void;
}

export const PreferencesStep = ({ onNext, onBack }: PreferencesStepProps) => {
  const [careStyle, setCareStyle] = useState<
    "frequent" | "balanced" | "minimal"
  >("balanced");

  const labels = getFactorLabels();

  const handleContinue = () => {
    // Store preferences in sessionStorage to be saved later
    const existingWeatherPrefs = safeJsonParse(
      sessionStorage.getItem("onboarding_weather"),
      weatherPrefsSchema,
      {}
    );

    sessionStorage.setItem(
      "onboarding_preferences",
      JSON.stringify({
        ...existingWeatherPrefs,
        default_care_style: careStyle,
      })
    );

    onNext();
  };

  const careStyleOptions = [
    {
      value: "frequent" as const,
      label: labels.careStyle.frequent,
      description: "Check and water your plants regularly",
    },
    {
      value: "balanced" as const,
      label: labels.careStyle.balanced,
      description: "Moderate attention and watering schedule",
    },
    {
      value: "minimal" as const,
      label: labels.careStyle.minimal,
      description: "Low-maintenance, water less frequently",
    },
  ];

  return (
    <div className="space-y-4">
      <StepHeading
        title="Set Your Care Preferences"
        body="How often do you like to tend your plants? We'll shape watering suggestions around it."
      />

      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Care style">
        {careStyleOptions.map((option) => (
          <OptionRow
            key={option.value}
            selected={careStyle === option.value}
            onClick={() => setCareStyle(option.value)}
            label={option.label}
            description={option.description}
          />
        ))}
      </div>

      <p className="text-sm text-muted-foreground px-1.5">
        You can change this anytime in Settings, along with light, humidity, and soil.
      </p>

      <div className="pt-4">
        <StepNav onBack={onBack} onNext={handleContinue} label="Continue" />
      </div>
    </div>
  );
};

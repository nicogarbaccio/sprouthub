import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFactorLabels } from "@/utils/smartWateringSchedule";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-plant-primary/10 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-plant-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Set Your Care Preferences
        </h2>
        <p className="text-muted-foreground">
          Tell us about your plant care style to personalize recommendations
        </p>
      </div>

      {/* Care Style Selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium">
          How often do you prefer to care for your plants?
        </Label>
        <div className="space-y-3">
          {careStyleOptions.map((option) => (
            <Card
              key={option.value}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md border-2",
                careStyle === option.value
                  ? "border-plant-primary bg-plant-primary/5 dark:bg-plant-primary/10"
                  : "border-border hover:border-plant-primary/50"
              )}
              onClick={() => setCareStyle(option.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors",
                      careStyle === option.value
                        ? "border-plant-primary bg-plant-primary"
                        : "border-muted-foreground/40 bg-background"
                    )}
                  >
                    {careStyle === option.value && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {option.label}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        You can always adjust these preferences later in your settings, along
        with more advanced options like light levels, humidity, and soil types.
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <Button onClick={handleContinue} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
};

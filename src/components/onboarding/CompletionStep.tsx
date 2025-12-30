import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronLeft, Loader2, Sparkles } from "lucide-react";
import { useProfileData } from "@/contexts/ProfileDataContext";
import { useSmartWateringPreferences } from "@/hooks/useSmartWateringPreferences";
import { useEffect } from "react";

interface CompletionStepProps {
  onComplete: () => void;
  onBack: () => void;
  isCompleting: boolean;
}

export const CompletionStep = ({
  onComplete,
  onBack,
  isCompleting,
}: CompletionStepProps) => {
  const { profileData } = useProfileData();
  const { savePreferences } = useSmartWateringPreferences();

  // Save preferences from sessionStorage when reaching this step
  useEffect(() => {
    const saveOnboardingPreferences = async () => {
      const prefsData = sessionStorage.getItem("onboarding_preferences");
      if (prefsData) {
        try {
          const prefs = JSON.parse(prefsData);
          await savePreferences(prefs);
        } catch (error) {
          console.error("Error saving onboarding preferences:", error);
        }
      }
    };

    saveOnboardingPreferences();
  }, [savePreferences]);

  const handleFinish = async () => {
    // Clear onboarding data from sessionStorage
    sessionStorage.removeItem("onboarding_weather");
    sessionStorage.removeItem("onboarding_preferences");

    // Complete onboarding
    await onComplete();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-plant-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-plant-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          You're All Set
          {profileData?.first_name ? `, ${profileData.first_name}` : ""}!
        </h2>
        <p className="text-muted-foreground">
          Your sprouthub account is ready to help you grow
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-plant-primary/5 to-plant-primary/10 dark:from-plant-primary/10 dark:to-plant-primary/5 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 text-plant-primary">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-semibold">What's Next?</h3>
        </div>

        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-plant-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">Add Your Plants</p>
              <p className="text-sm text-muted-foreground">
                Browse our catalog or add custom plants to start tracking
              </p>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-plant-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">
                Set Watering Schedules
              </p>
              <p className="text-sm text-muted-foreground">
                Use our Smart Watering Wizard for personalized recommendations
              </p>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-plant-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">
                Enable Notifications
              </p>
              <p className="text-sm text-muted-foreground">
                Get reminders when it's time to water your plants
              </p>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-plant-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">Track Your Progress</p>
              <p className="text-sm text-muted-foreground">
                View analytics and insights about your plant care habits
              </p>
            </div>
          </li>
        </ul>
      </div>

      {/* Navigation Buttons */}
      <div className="space-y-3 pt-4">
        <Button
          onClick={handleFinish}
          disabled={isCompleting}
          size="lg"
          className="w-full"
        >
          {isCompleting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Setting up...
            </>
          ) : (
            "Go to Dashboard"
          )}
        </Button>
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={onBack}
            disabled={isCompleting}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </div>
    </div>
  );
};

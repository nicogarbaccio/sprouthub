import { CheckCircle2 } from "lucide-react";
import { StepHeading, StepNav } from "./OnboardingUI";
import { useProfileData } from "@/contexts/ProfileDataContext";
import { useSmartWateringPreferences } from "@/hooks/useSmartWateringPreferences";
import { useEffect } from "react";
import { z } from "zod";
import { safeJsonParse } from "@/utils/safeJsonParse";

const onboardingPrefsSchema = z.record(z.string(), z.unknown());

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
          const prefs = safeJsonParse(prefsData, onboardingPrefsSchema, null);
          if (!prefs) return;
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

  const nextSteps = [
    { title: "Add Your Plants", body: "Browse the catalog or add custom plants" },
    { title: "Set Watering Schedules", body: "The Smart Watering Wizard can suggest one" },
    { title: "Enable Notifications", body: "Get a nudge when something is due" },
    { title: "Track Your Progress", body: "Analytics and insights on your care habits" },
  ];

  return (
    <div className="space-y-4">
      <StepHeading
        title={`You're All Set${profileData?.first_name ? `, ${profileData.first_name}` : ""}!`}
        body="Your sprouthub account is ready to help you grow."
      />

      <ul className="rounded-3xl bg-card p-2 space-y-1">
        {nextSteps.map((item) => (
          <li key={item.title} className="flex items-start gap-3 rounded-[18px] p-2.5">
            <CheckCircle2 className="w-5 h-5 text-sprout-success mt-0.5 flex-shrink-0" />
            <span>
              <span className="block font-bold text-[15px] text-foreground">{item.title}</span>
              <span className="block text-sm text-muted-foreground">{item.body}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="pt-4">
        <StepNav
          onBack={onBack}
          onNext={handleFinish}
          label={isCompleting ? "Setting up..." : "Go to Dashboard"}
          loading={isCompleting}
        />
      </div>
    </div>
  );
};

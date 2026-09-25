import { Sprout, Plus } from "lucide-react";
import { openAddPlant } from "@/utils/appEvents";
import { StepHeading, StepNav } from "./OnboardingUI";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { z } from "zod";
import { safeJsonParse } from "@/utils/safeJsonParse";

const onboardingPrefsSchema = z.record(z.string(), z.unknown());

interface AddPlantStepProps {
  onNext: () => void;
  onBack: () => void;
}

export const AddPlantStep = ({ onNext, onBack }: AddPlantStepProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);

  const handleAddPlantLater = () => {
    onNext();
  };

  const completeOnboarding = async () => {
    if (!user || isCompleting) return false;

    setIsCompleting(true);
    try {
      // Save any pending preferences from previous steps
      const prefsData = sessionStorage.getItem("onboarding_preferences");
      if (prefsData) {
        const preferences = safeJsonParse(prefsData, onboardingPrefsSchema, null);
        if (preferences) {
          await supabase.from("profiles").update(preferences).eq("id", user.id);
        }
      }

      // Mark onboarding as completed
      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);

      if (error) throw error;

      // Clear onboarding data from session storage
      sessionStorage.removeItem("onboarding_preferences");
      sessionStorage.removeItem("onboarding_weather");

      toast.success("Welcome to sprouthub!", {
        description: "Now let's add your first plant!",
      });

      return true;
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Something went wrong", {
        description: "Please try again.",
      });
      setIsCompleting(false);
      return false;
    }
  };

  const handleBrowseCatalog = async () => {
    const success = await completeOnboarding();
    if (success) {
      navigate("/plant-catalog");
    }
  };

  const handleCustomPlant = async () => {
    const success = await completeOnboarding();
    if (success) {
      navigate("/my-plants");
      openAddPlant();
    }
  };

  return (
    <div className="space-y-4">
      <StepHeading
        title="Add Your First Plant"
        body="Pick one from our catalog and we'll fill in its light, water and humidity needs, or add your own."
      />

      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={handleBrowseCatalog}
          disabled={isCompleting}
          className="rounded-card bg-sprout-cream text-sprout-dark p-4 min-h-[140px] flex flex-col justify-between text-left disabled:opacity-50"
        >
          <Sprout className="w-7 h-7" />
          <span>
            <span className="block font-bold text-[17px]">Browse Catalog</span>
            <span className="block text-[13px] font-semibold opacity-80 mt-0.5">
              Hundreds of plants with care info
            </span>
          </span>
        </button>
        <button
          onClick={handleCustomPlant}
          disabled={isCompleting}
          className="rounded-card bg-card text-foreground p-4 min-h-[140px] flex flex-col justify-between text-left disabled:opacity-50"
        >
          <Plus className="w-7 h-7" />
          <span>
            <span className="block font-bold text-[17px]">Custom Plants</span>
            <span className="block text-[13px] font-semibold text-muted-foreground mt-0.5">
              Your own notes and schedule
            </span>
          </span>
        </button>
      </div>

      <div className="pt-4">
        <StepNav
          onBack={onBack}
          onNext={handleAddPlantLater}
          label="I'll Add Plants Later"
          loading={isCompleting}
        />
      </div>
    </div>
  );
};

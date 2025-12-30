import { Button } from "@/components/ui/button";
import { Sprout, ChevronLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

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
        const preferences = JSON.parse(prefsData);
        await supabase.from("profiles").update(preferences).eq("id", user.id);
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
      navigate("/plants");
    }
  };

  const handleCustomPlant = async () => {
    const success = await completeOnboarding();
    if (success) {
      navigate("/my-plants/add");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-plant-primary/10 rounded-full flex items-center justify-center">
            <Plus className="w-8 h-8 text-plant-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Add Your First Plant
        </h2>
        <p className="text-muted-foreground">
          Choose from our catalog or create a custom entry
        </p>
      </div>

      {/* Action Cards */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleBrowseCatalog}
            disabled={isCompleting}
            className="bg-card border-2 rounded-xl p-6 flex flex-col items-center text-center space-y-3 hover:shadow-lg hover:border-plant-primary/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
          >
            <div className="w-12 h-12 bg-plant-primary/10 border-2 border-plant-primary/20 rounded-xl flex items-center justify-center">
              <Sprout className="w-6 h-6 text-plant-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                Browse Catalog
              </h4>
              <p className="text-sm text-muted-foreground">
                Choose from hundreds of plants with detailed care information
              </p>
            </div>
          </button>

          <button
            onClick={handleCustomPlant}
            disabled={isCompleting}
            className="bg-card border-2 rounded-xl p-6 flex flex-col items-center text-center space-y-3 hover:shadow-lg hover:border-plant-primary/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
          >
            <div className="w-12 h-12 bg-plant-primary/10 border-2 border-plant-primary/20 rounded-xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-plant-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                Custom Plants
              </h4>
              <p className="text-sm text-muted-foreground">
                Add any plant with your own care notes and schedules
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="space-y-3 pt-4">
        <Button onClick={handleAddPlantLater} className="w-full" size="lg">
          I'll Add Plants Later
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="gap-2 flex-1">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </div>

      {/* Note */}
      <p className="text-xs text-center text-muted-foreground">
        You can always add plants from your dashboard after completing
        onboarding
      </p>
    </div>
  );
};

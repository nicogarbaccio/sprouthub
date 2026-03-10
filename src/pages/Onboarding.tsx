import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { WeatherStep } from "@/components/onboarding/WeatherStep";
import { PreferencesStep } from "@/components/onboarding/PreferencesStep";
import { AddPlantStep } from "@/components/onboarding/AddPlantStep";
import { CompletionStep } from "@/components/onboarding/CompletionStep";
import { NotificationPermissionPrompt } from "@/components/onboarding/NotificationPermissionPrompt";
import { pushNotificationService } from "@/services/pushNotificationService";
import { toast } from "sonner";

const TOTAL_STEPS = 5;

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user has already completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        // Not logged in, redirect to auth
        navigate("/auth");
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error checking onboarding status:", error);
          setIsCheckingAccess(false);
          return;
        }

        // If user has already completed onboarding, redirect to dashboard
        if (profile?.onboarding_completed) {
          navigate("/");
          return;
        }

        setIsCheckingAccess(false);
      } catch (error) {
        console.error("Unexpected error:", error);
        setIsCheckingAccess(false);
      }
    };

    checkOnboardingStatus();
  }, [user, navigate]);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsCompleting(true);
    try {
      // Mark onboarding as completed in the database
      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Welcome to sprouthub!", {
        description:
          "You're all set! Let's start growing your plant collection.",
      });

      setIsCompleting(false);

      // Check if we should show notification prompt
      const isSupported = pushNotificationService.isSupported();
      if (isSupported) {
        const permissionStatus =
          await pushNotificationService.getPermissionStatus();
        // Only show prompt if permission hasn't been decided yet
        if (permissionStatus === "prompt") {
          setShowNotificationPrompt(true);
          return; // Don't navigate yet, will navigate after prompt
        }
      }

      // Navigate to dashboard if notifications aren't supported or already decided
      // Add refresh parameter to trigger data reload on dashboard
      navigate("/?refresh=true");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Something went wrong", {
        description: "Please try again or contact support.",
      });
      setIsCompleting(false);
    }
  };

  const handleNotificationPromptComplete = () => {
    setShowNotificationPrompt(false);
    // Add refresh parameter to trigger data reload on dashboard
    navigate("/?refresh=true");
  };

  const handleSkip = async () => {
    await handleComplete();
  };

  // Show loading state while checking access
  if (isCheckingAccess) {
    return (
      <div className="min-h-dvh bg-background pb-28 lg:pb-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-plant-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-dvh bg-background pb-28 lg:pb-0">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Step {currentStep} of {TOTAL_STEPS}
              </span>
              <button
                onClick={handleSkip}
                disabled={isCompleting}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip onboarding
              </button>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-plant-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-card border rounded-lg shadow-lg p-6 md:p-8">
            {currentStep === 1 && <WelcomeStep onNext={handleNext} />}
            {currentStep === 2 && (
              <WeatherStep onNext={handleNext} onBack={handleBack} />
            )}
            {currentStep === 3 && (
              <PreferencesStep onNext={handleNext} onBack={handleBack} />
            )}
            {currentStep === 4 && (
              <AddPlantStep onNext={handleNext} onBack={handleBack} />
            )}
            {currentStep === 5 && (
              <CompletionStep
                onComplete={handleComplete}
                onBack={handleBack}
                isCompleting={isCompleting}
              />
            )}
          </div>
        </div>
      </div>

      {/* Notification Permission Prompt */}
      <NotificationPermissionPrompt
        open={showNotificationPrompt}
        onOpenChange={setShowNotificationPrompt}
        onComplete={handleNotificationPromptComplete}
      />
    </>
  );
}

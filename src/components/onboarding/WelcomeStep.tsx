import { useProfileData } from "@/contexts/ProfileDataContext";
import { StepHeading, StepNav } from "./OnboardingUI";

interface WelcomeStepProps {
  onNext: () => void;
}

export const WelcomeStep = ({ onNext }: WelcomeStepProps) => {
  const { profileData } = useProfileData();

  return (
    <div className="space-y-8">
      <StepHeading
        as="h1"
        title={`Welcome to sprouthub${profileData?.first_name ? `, ${profileData.first_name}` : ""}!`}
        body={
          <>
            Your personal plant care companion. Track your plants, stay on watering schedules,
            and get care tips that learn from how you actually water.
          </>
        }
      />
      <StepNav onNext={onNext} label="Get Started" />
    </div>
  );
};

import { Button } from "@/components/ui/button";
import { Droplets, Calendar, LineChart } from "lucide-react";
import { useProfileData } from "@/contexts/ProfileDataContext";
import { ThemeAwareLogo } from "@/components/ui/theme-aware-logo";

interface WelcomeStepProps {
  onNext: () => void;
}

export const WelcomeStep = ({ onNext }: WelcomeStepProps) => {
  const { profileData } = useProfileData();

  return (
    <div className="space-y-6 text-center">
      {/* Logo */}
      <div className="flex justify-center">
        <ThemeAwareLogo className="h-16 w-auto" />
      </div>

      {/* Welcome Message */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Welcome to sprouthub
          {profileData?.first_name ? `, ${profileData.first_name}` : ""}!
        </h1>
        <p className="text-lg text-muted-foreground">
          Your personal plant care companion
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
        <div className="group">
          <div className="bg-card border rounded-2xl p-6 h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-plant-primary/50 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-plant-primary/10 border-2 border-plant-primary/20 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300">
              <Droplets className="w-6 h-6 text-plant-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              Smart Watering
            </h3>
            <p className="text-sm text-muted-foreground">
              Get personalized watering schedules for each plant
            </p>
          </div>
        </div>

        <div className="group">
          <div className="bg-card border rounded-2xl p-6 h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-plant-primary/50 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-plant-primary/10 border-2 border-plant-primary/20 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300">
              <Calendar className="w-6 h-6 text-plant-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Track Care</h3>
            <p className="text-sm text-muted-foreground">
              Never forget to water with timely reminders
            </p>
          </div>
        </div>

        <div className="group">
          <div className="bg-card border rounded-2xl p-6 h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-plant-primary/50 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-plant-primary/10 border-2 border-plant-primary/20 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300">
              <LineChart className="w-6 h-6 text-plant-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              Growth Insights
            </h3>
            <p className="text-sm text-muted-foreground">
              Monitor plant health and care patterns
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-4 pt-4">
        <p className="text-muted-foreground">
          Let's get you set up in just a few steps
        </p>
        <Button onClick={onNext} size="lg">
          Get Started
        </Button>
      </div>
    </div>
  );
};

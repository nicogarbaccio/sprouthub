import { Droplets, BookOpen, Camera, Bell, BarChart, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: BookOpen,
    title: "Plant Encyclopedia",
    description: "Browse hundreds of plants with detailed care instructions, botanical names, and growing tips.",
    iconClasses: "bg-sprout-success text-sprout-dark",
  },
  {
    icon: Droplets,
    title: "Smart Watering",
    description: "Get personalized watering schedules based on your plants specific needs and environment.",
    iconClasses: "bg-sprout-water text-sprout-dark",
  },
  {
    icon: Camera,
    title: "Photo Collections",
    description: "Track your plants growth with photos and create beautiful visual journals of your garden.",
    iconClasses: "bg-sprout-cream text-sprout-dark",
  },
  {
    icon: Bell,
    title: "Care Reminders",
    description: "Never miss watering, fertilizing, or repotting with intelligent notifications.",
    iconClasses: "bg-sprout-warning text-sprout-dark",
  },
  {
    icon: BarChart,
    title: "Growth Tracking",
    description: "Monitor your plant's health and growth patterns with detailed care logs and analytics.",
    iconClasses: "bg-sprout-primary text-sprout-cream",
  },
  {
    icon: Users,
    title: "Households",
    description: "Share your plant collection with family or roommates and delegate care responsibilities together.",
    iconClasses: "bg-field text-foreground",
  },
];

const FeaturesSection = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 lg:px-8 pt-8 md:pt-10">
      <div className="px-1.5 lg:px-0">
        <h2 className="font-display text-2xl md:text-[32px] font-bold tracking-[-0.03em] text-foreground">
          Everything you need to grow
        </h2>
        <p className="text-[15px] md:text-base font-medium text-muted-foreground mt-1 max-w-2xl">
          From beginners to expert gardeners, sprouthub provides all the tools and knowledge you need to keep your
          plants thriving.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-3.5 mt-4">
        {FEATURES.map(({ icon: Icon, title, description, iconClasses }) => (
          <div key={title} className="rounded-card bg-card p-5 md:p-6 h-full">
            <div className={cn("w-11 h-11 rounded-[14px] flex items-center justify-center", iconClasses)}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-[17px] font-bold text-foreground mt-3">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mt-1">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;

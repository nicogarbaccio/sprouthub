import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Droplets,
  Brain,
  CloudRain,
  Smartphone,
  Shield,
  Calendar,
  Search,
  Home,
  Sun,
  Users,
  LogIn,
} from "lucide-react";

const About = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <Droplets className="w-5 h-5" />,
      title: "Smart Watering",
      description:
        "AI-powered watering schedules that adapt to weather, season, and your plant's unique needs. Never overwater or underwater again.",
      iconClasses: "bg-sprout-water text-sprout-dark",
    },
    {
      icon: <CloudRain className="w-5 h-5" />,
      title: "Weather Integration",
      description:
        "Real-time weather data automatically adjusts watering schedules. Rain delay feature for outdoor plants when precipitation is expected.",
      iconClasses: "bg-sprout-water text-sprout-dark",
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: "Seasonal Intelligence",
      description:
        "Automatic seasonal detection with smart schedule suggestions. Track performance across seasons and years.",
      iconClasses: "bg-sprout-cream text-sprout-dark",
    },
    {
      icon: <Search className="w-5 h-5" />,
      title: "Plant Catalog",
      description:
        "Browse a curated library of plants with detailed care guides, botanical info, and beautiful images.",
      iconClasses: "bg-sprout-success text-sprout-dark",
    },
    {
      icon: <Home className="w-5 h-5" />,
      title: "Room Management",
      description:
        "Organize plants by rooms with visual themes, health indicators, and care statistics for each space.",
      iconClasses: "bg-sprout-primary text-sprout-cream",
    },
    {
      icon: <Smartphone className="w-5 h-5" />,
      title: "Mobile-First",
      description:
        "Progressive Web App that works perfectly on any device. Install like a native app with offline support.",
      iconClasses: "bg-sprout-cream text-sprout-dark",
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: "Pattern Analysis",
      description:
        "Learn from your watering history with smart insights and recommendations to improve plant care.",
      iconClasses: "bg-sprout-primary text-sprout-cream",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Secure & Private",
      description:
        "Your data is protected with industry-standard authentication and row-level security. You own your plant data.",
      iconClasses: "bg-field text-foreground",
    },
  ];

  const reasons = [
    {
      icon: Droplets,
      title: "Truly Intelligent Watering",
      body: "Not just static reminders—our algorithm considers weather, season, your watering history, and plant-specific needs to give you the most accurate recommendations possible.",
    },
    {
      icon: Users,
      title: "Built for Real Plant Parents",
      body: "Every feature was designed based on real needs—from managing households with shared plants to organizing by rooms to tracking seasonal changes.",
    },
    {
      icon: Shield,
      title: "Privacy-First Design",
      body: "Your plant data is yours. Row-level security ensures you only see your own plants, and we never sell or share your information.",
    },
  ];

  const primaryButton =
    "h-14 px-6 rounded-[20px] bg-sprout-dark text-sprout-cream font-bold text-[15px] inline-flex items-center justify-center gap-2 shadow-[inset_0_0_0_2px_#dfc490]";

  return (
    <div className="bg-background pb-32 lg:pb-10">
      <main className="max-w-5xl mx-auto px-4 lg:px-8 pt-3.5 lg:pt-7 space-y-2.5 md:space-y-3.5">
        {/* Hero */}
        <CascadingContainer delay={0}>
          <section className="rounded-tile bg-sprout-primary text-sprout-cream p-6 md:p-10 relative overflow-clip">
            <div aria-hidden="true" className="absolute -right-16 -bottom-24 w-72 h-72 rounded-full bg-sprout-cream opacity-[0.08]" />
            <Logo className="relative h-14 w-auto" alt="sprouthub logo" />
            <h1 className="relative font-display text-[34px] md:text-5xl font-extrabold tracking-[-0.04em] mt-5">
              About sprouthub
            </h1>
            <p className="relative text-base md:text-lg font-medium mt-2 max-w-2xl">
              A comprehensive plant care tracker designed for plant lovers who want intelligent, data-driven insights
              to keep their indoor gardens thriving.
            </p>
          </section>
        </CascadingContainer>

        {/* Mission */}
        <CascadingContainer delay={75}>
          <section className="rounded-tile bg-card p-6 md:p-8">
            <h2 className="flex items-center gap-2.5 font-display text-2xl font-bold tracking-[-0.03em] text-foreground">
              <Sun className="w-6 h-6" />
              Our Mission
            </h2>
            <div className="space-y-3 mt-3 text-[15px] leading-relaxed text-muted-foreground max-w-3xl">
              <p>
                We've all been there: plants dying from overwatering, underwatering, or simply losing track of when we
                last cared for them. sprouthub eliminates the guesswork.
              </p>
              <p>
                By combining real-time weather data, seasonal intelligence, and your personal care history, sprouthub
                tells you exactly when and how to care for each plant. And because plant care is often a shared
                responsibility, sprouthub lets you collaborate with your household—everyone stays in sync on what's
                been watered and what needs attention.
              </p>
              <p>No more "I thought you watered it!" No more wondering if it's too soon or too late.</p>
              <p>
                Whether you're managing one succulent or dozens of plants across multiple rooms, sprouthub adapts to
                your experience level and helps you give your plants their best shot at thriving.
              </p>
            </div>
          </section>
        </CascadingContainer>

        {/* Why use it */}
        <CascadingContainer delay={125}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 md:gap-3.5">
            {reasons.map(({ icon: Icon, title, body }) => (
              <section key={title} className="rounded-card bg-card p-5">
                <div className="w-11 h-11 rounded-[14px] bg-sprout-cream text-sprout-dark flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-[17px] font-bold text-foreground mt-3">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">{body}</p>
              </section>
            ))}
          </div>
        </CascadingContainer>

        {/* Features */}
        <CascadingContainer delay={175}>
          <div className="px-1.5 pt-5">
            <h2 className="font-display text-2xl md:text-[28px] font-bold tracking-[-0.03em] text-foreground">
              Powerful Features
            </h2>
            <p className="text-[15px] font-medium text-muted-foreground mt-0.5">
              Everything you need to care for your plants, all in one beautiful app
            </p>
          </div>
        </CascadingContainer>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3.5">
          {features.map((feature, index) => (
            <CascadingContainer key={feature.title} delay={200 + index * 40}>
              <section className="rounded-card bg-card p-5 h-full">
                <div className={cn("w-11 h-11 rounded-[14px] flex items-center justify-center", feature.iconClasses)}>
                  {feature.icon}
                </div>
                <h3 className="text-[17px] font-bold text-foreground mt-3">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">{feature.description}</p>
              </section>
            </CascadingContainer>
          ))}
        </div>

        {/* Call to action */}
        <CascadingContainer delay={500}>
          <section className="rounded-tile bg-sprout-cream text-sprout-dark p-6 md:p-10 text-center mt-5">
            <h2 className="font-display text-2xl md:text-[32px] font-bold tracking-[-0.03em]">
              Ready to Grow Your Green Space?
            </h2>
            <p className="text-base font-medium mt-2 max-w-xl mx-auto">
              Join plant parents who are keeping their plants thriving with smart, data-driven care.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
              {user ? (
                <button type="button" onClick={() => navigate("/")} className={primaryButton}>
                  <Home className="w-5 h-5" />
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => navigate("/auth")} className={primaryButton}>
                    <LogIn className="w-5 h-5" />
                    Log In / Sign Up
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/plant-catalog")}
                    className="h-14 px-6 rounded-[20px] border-[1.5px] border-sprout-dark font-bold text-[15px] inline-flex items-center justify-center gap-2"
                  >
                    <Search className="w-5 h-5" />
                    Browse Plant Catalog
                  </button>
                </>
              )}
            </div>
          </section>
        </CascadingContainer>
      </main>
    </div>
  );
};

export default About;

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { ThemeAwareLogo } from "@/components/ui/theme-aware-logo";
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
  Zap,
  Heart,
  Users,
  LogIn,
} from "lucide-react";

const About = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <Droplets className="w-6 h-6" />,
      title: "Smart Watering",
      description:
        "AI-powered watering schedules that adapt to weather, season, and your plant's unique needs. Never overwater or underwater again.",
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: <CloudRain className="w-6 h-6" />,
      title: "Weather Integration",
      description:
        "Real-time weather data automatically adjusts watering schedules. Rain delay feature for outdoor plants when precipitation is expected.",
      color: "text-cyan-600 dark:text-cyan-400",
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Seasonal Intelligence",
      description:
        "Automatic seasonal detection with smart schedule suggestions. Track performance across seasons and years.",
      color: "text-orange-600 dark:text-orange-400",
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "Plant Catalog",
      description:
        "Browse a curated library of plants with detailed care guides, botanical info, and beautiful images.",
      color: "text-green-600 dark:text-green-400",
    },
    {
      icon: <Home className="w-6 h-6" />,
      title: "Room Management",
      description:
        "Organize plants by rooms with visual themes, health indicators, and care statistics for each space.",
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Mobile-First",
      description:
        "Progressive Web App that works perfectly on any device. Install like a native app with offline support.",
      color: "text-pink-600 dark:text-pink-400",
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Pattern Analysis",
      description:
        "Learn from your watering history with smart insights and recommendations to improve plant care.",
      color: "text-indigo-600 dark:text-indigo-400",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Private",
      description:
        "Your data is protected with industry-standard authentication and row-level security. You own your plant data.",
      color: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-sprout-primary/5 to-background pt-16 sm:pt-20 pb-4">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <CascadingContainer delay={0}>
              <div className="flex justify-center mb-6">
                <img
                  src="/LogoDark.svg"
                  alt="sprouthub logo"
                  className="h-16 w-auto"
                />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
                About{" "}
                <span className="text-sprout-primary dark:text-sprout-cream">
                  sprouthub
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
                A comprehensive plant care tracker designed for plant lovers who
                want intelligent, data-driven insights to keep their indoor
                gardens thriving.
              </p>
            </CascadingContainer>
          </div>
        </section>

        {/* Mission & Why Choose Section */}
        <section className="pb-8 sm:pb-12 pt-2">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <CascadingContainer delay={100}>
              <Card>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4">
                    <h2 className="flex items-center gap-2 text-xl font-semibold">
                      <Sun className="w-5 h-5 text-sprout-primary dark:text-sprout-cream" />
                      Our Mission
                    </h2>
                    <p className="text-muted-foreground">
                      We've all been there: plants dying from overwatering,
                      underwatering, or simply losing track of when we last
                      cared for them. sprouthub eliminates the guesswork.
                    </p>
                    <p className="text-muted-foreground">
                      By combining real-time weather data, seasonal
                      intelligence, and your personal care history, sprouthub
                      tells you exactly when and how to care for each plant. And
                      because plant care is often a shared responsibility,
                      sprouthub lets you collaborate with your
                      household—everyone stays in sync on what's been watered
                      and what needs attention.
                    </p>
                    <p className="text-muted-foreground">
                      No more "I thought you watered it!" No more wondering if
                      it's too soon or too late.
                    </p>
                    <p className="text-muted-foreground">
                      Whether you're managing one succulent or dozens of plants
                      across multiple rooms, sprouthub adapts to your experience
                      level and helps you give your plants their best shot at
                      thriving.
                    </p>
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <h2 className="flex items-center gap-2 text-xl font-semibold">
                      <Zap className="w-5 h-5 text-sprout-primary dark:text-sprout-cream" />
                      Why Use sprouthub?
                    </h2>

                    <div className="flex gap-3">
                      <div className="text-sprout-primary dark:text-sprout-cream mt-1">
                        <Droplets className="w-5 h-5" />
                      </div>
                      <p className="text-muted-foreground">
                        <strong>Truly Intelligent Watering:</strong> Not just
                        static reminders—our algorithm considers weather,
                        season, your watering history, and plant-specific needs
                        to give you the most accurate recommendations possible.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <div className="text-sprout-primary dark:text-sprout-cream mt-1">
                        <Users className="w-5 h-5" />
                      </div>
                      <p className="text-muted-foreground">
                        <strong>Built for Real Plant Parents:</strong> Every
                        feature was designed based on real needs—from managing
                        households with shared plants to organizing by rooms to
                        tracking seasonal changes.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <div className="text-sprout-primary dark:text-sprout-cream mt-1">
                        <Shield className="w-5 h-5" />
                      </div>
                      <p className="text-muted-foreground">
                        <strong>Privacy-First Design:</strong> Your plant data
                        is yours. Row-level security ensures you only see your
                        own plants, and we never sell or share your information.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CascadingContainer>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-12 sm:py-16 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <CascadingContainer delay={150}>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Powerful Features
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Everything you need to care for your plants, all in one
                  beautiful app
                </p>
              </div>
            </CascadingContainer>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <CascadingContainer
                  key={feature.title}
                  delay={200 + index * 50}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className={`${feature.color} mb-3`}>
                        {feature.icon}
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </CascadingContainer>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <CascadingContainer delay={500}>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Ready to Grow Your Green Space?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join plant parents who are keeping their plants thriving with
                smart, data-driven care.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Button
                    size="lg"
                    onClick={() => navigate("/")}
                    className="bg-sprout-primary hover:bg-sprout-primary/90 text-white"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      onClick={() => navigate("/auth")}
                      className="bg-sprout-primary hover:bg-sprout-primary/90 text-white dark:text-gray-900"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Log In / Sign Up
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => navigate("/plant-catalog")}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Browse Plant Catalog
                    </Button>
                  </>
                )}
              </div>
            </CascadingContainer>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;

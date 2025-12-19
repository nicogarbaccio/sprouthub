import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="min-h-screen bg-background">
      <Navigation />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-sprout-primary/5 to-background py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <CascadingContainer delay={0}>
              <div className="flex justify-center mb-6">
                <div className="bg-sprout-primary/10 dark:bg-sprout-primary/20 p-4 rounded-2xl">
                  <ThemeAwareLogo className="h-16 w-auto" />
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
                About sprouthub
              </h1>
              <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
                A comprehensive plant care tracker designed for plant lovers who want intelligent,
                data-driven insights to keep their indoor gardens thriving.
              </p>
              <Badge variant="secondary" className="text-sm">
                <Heart className="w-3 h-3 mr-1" />
                Built with love for plant parents everywhere
              </Badge>
            </CascadingContainer>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-12 sm:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <CascadingContainer delay={100}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sun className="w-5 h-5 text-sprout-primary" />
                    Our Mission
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    We believe that everyone deserves to experience the joy of a thriving indoor
                    garden, regardless of their experience level. sprouthub removes the guesswork
                    from plant care by combining real-time weather data, seasonal intelligence, and
                    your personal care history to provide truly smart recommendations.
                  </p>
                  <p className="text-muted-foreground">
                    Whether you're a seasoned plant parent managing dozens of plants across multiple
                    rooms, or just starting with your first succulent, sprouthub adapts to your needs
                    and helps you build the green space of your dreams.
                  </p>
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
                  Everything you need to care for your plants, all in one beautiful app
                </p>
              </div>
            </CascadingContainer>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <CascadingContainer key={feature.title} delay={200 + index * 50}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className={`${feature.color} mb-3`}>{feature.icon}</div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </CascadingContainer>
              ))}
            </div>
          </div>
        </section>

        {/* Why sprouthub Section */}
        <section className="py-12 sm:py-16 bg-gradient-to-b from-muted/30 to-sprout-primary/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <CascadingContainer delay={400}>
              <Card className="border-sprout-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-sprout-primary" />
                    Why Choose sprouthub?
                  </CardTitle>
                  <CardDescription>
                    What makes us different from other plant care apps
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="text-sprout-primary mt-1">
                        <Droplets className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Truly Intelligent Watering</h4>
                        <p className="text-sm text-muted-foreground">
                          Not just static reminders—our algorithm considers weather, season, your
                          watering history, and plant-specific needs to give you the most accurate
                          recommendations possible.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="text-sprout-primary mt-1">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Built for Real Plant Parents</h4>
                        <p className="text-sm text-muted-foreground">
                          Every feature was designed based on real needs—from managing households
                          with shared plants to organizing by rooms to tracking seasonal changes.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="text-sprout-primary mt-1">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Privacy-First Design</h4>
                        <p className="text-sm text-muted-foreground">
                          Your plant data is yours. Row-level security ensures you only see your own
                          plants, and we never sell or share your information.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CascadingContainer>
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
                Join plant parents who are keeping their plants thriving with smart, data-driven care.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Button
                    size="lg"
                    onClick={() => navigate("/")}
                    className="bg-sprout-primary hover:bg-sprout-primary/90"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      onClick={() => navigate("/auth")}
                      className="bg-sprout-primary hover:bg-sprout-primary/90"
                    >
                      <Droplets className="w-4 h-4 mr-2" />
                      Get Started Free
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

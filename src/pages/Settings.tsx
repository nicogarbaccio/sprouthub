import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Sliders, CloudSun, Bell, Palette } from "lucide-react";
import { AccountTab } from "@/components/settings/AccountTab";
import { PreferencesTab } from "@/components/settings/PreferencesTab";
import { WeatherTab } from "@/components/settings/WeatherTab";
import { NotificationsTab } from "@/components/settings/NotificationsTab";
import { AppearanceTab } from "@/components/settings/AppearanceTab";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { LoadingTransition } from "@/components/ui/loading-transition";
import { FeatureErrorBoundary } from "@/components/ui/feature-error-boundary";

const SettingsContent = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (!loading && !user) {
    return null;
  }

  const settingsSkeleton = (
    <div className="max-w-5xl mx-auto">
      <Skeleton className="h-12 w-48 mb-8" />
      <Skeleton className="h-96 w-full" />
    </div>
  );

  return (
    <div className="min-h-dvh bg-background pb-20 lg:pb-0">
      <Navigation />
      <main className="pt-20 min-h-[calc(100vh-4rem)] bg-plant-neutral dark:bg-background py-8 px-4">
        <LoadingTransition loading={loading} skeleton={settingsSkeleton}>
        <div className="max-w-5xl mx-auto">
          <CascadingContainer delay={0}>
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
              <p className="text-muted-foreground">
                Manage your account, preferences, and application settings
              </p>
            </div>
          </CascadingContainer>

          <CascadingContainer delay={100}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-8">
                <TabsTrigger value="account" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Account</span>
                </TabsTrigger>
                <TabsTrigger value="preferences" className="flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  <span className="hidden sm:inline">Preferences</span>
                </TabsTrigger>
                <TabsTrigger value="weather" className="flex items-center gap-2">
                  <CloudSun className="w-4 h-4" />
                  <span className="hidden sm:inline">Weather</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">Notifications</span>
                </TabsTrigger>
                <TabsTrigger value="appearance" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  <span className="hidden sm:inline">Appearance</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="account">
                <AccountTab />
              </TabsContent>

              <TabsContent value="preferences">
                <PreferencesTab />
              </TabsContent>

              <TabsContent value="weather">
                <WeatherTab />
              </TabsContent>

              <TabsContent value="notifications">
                <NotificationsTab />
              </TabsContent>

              <TabsContent value="appearance">
                <AppearanceTab />
              </TabsContent>
            </Tabs>
          </CascadingContainer>
        </div>
        </LoadingTransition>
      </main>
      <Footer />
    </div>
  );
};

const Settings = () => {
  return (
    <FeatureErrorBoundary featureName="Settings">
      <SettingsContent />
    </FeatureErrorBoundary>
  );
};

export default Settings;

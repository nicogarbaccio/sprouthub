import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Sliders, CloudSun, Bell, Palette } from "lucide-react";
import { AccountTab } from "@/components/settings/AccountTab";
import { PreferencesTab } from "@/components/settings/PreferencesTab";
import { WeatherTab } from "@/components/settings/WeatherTab";
import { NotificationsTab } from "@/components/settings/NotificationsTab";
import { AppearanceTab } from "@/components/settings/AppearanceTab";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { LoadingTransition } from "@/components/ui/loading-transition";
import { FeatureErrorBoundary } from "@/components/ui/feature-error-boundary";
import { pillTabsListClasses } from "@/components/settings/SettingsUI";
import { cn } from "@/lib/utils";

const SettingsContent = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // `?tab=weather` lets other screens (e.g. the Home weather tile) link straight to a tab
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") ?? "account");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (!loading && !user) {
    return null;
  }

  const settingsSkeleton = (
    <div className="max-w-3xl mx-auto space-y-3">
      <Skeleton className="h-10 w-48 rounded-2xl" />
      <Skeleton className="h-11 w-full rounded-full" />
      <Skeleton className="h-96 w-full rounded-card" />
    </div>
  );

  const tabs = [
    { value: "account", label: "Account", icon: User },
    { value: "preferences", label: "Preferences", icon: Sliders },
    { value: "weather", label: "Weather", icon: CloudSun },
    { value: "notifications", label: "Notifications", icon: Bell },
    { value: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <div className="bg-background pb-32 lg:pb-10">
      <main className="px-4 lg:px-8 pt-3.5 lg:pt-7">
        <LoadingTransition loading={loading} skeleton={settingsSkeleton}>
        <div className="max-w-3xl mx-auto">
          <CascadingContainer delay={0}>
            <div className="px-1.5 lg:px-0">
              <h1 className="font-display text-[28px] lg:text-[34px] font-bold tracking-[-0.04em] text-foreground">
                Settings
              </h1>
              <p className="text-sm lg:text-[15px] font-medium text-muted-foreground mt-0.5">
                Your account, care defaults, weather, notifications and look
              </p>
            </div>
          </CascadingContainer>

          <CascadingContainer delay={50}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-[18px]">
              <TabsList className={cn(pillTabsListClasses, "-mx-4 px-4 sm:mx-0 sm:px-0")}>
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                   
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="account" className="mt-5">
                <AccountTab />
              </TabsContent>

              <TabsContent value="preferences" className="mt-5">
                <PreferencesTab />
              </TabsContent>

              <TabsContent value="weather" className="mt-5">
                <WeatherTab />
              </TabsContent>

              <TabsContent value="notifications" className="mt-5">
                <NotificationsTab />
              </TabsContent>

              <TabsContent value="appearance" className="mt-5">
                <AppearanceTab />
              </TabsContent>
            </Tabs>
          </CascadingContainer>
        </div>
        </LoadingTransition>
      </main>
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

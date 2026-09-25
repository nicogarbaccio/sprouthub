import { Switch } from "@/components/ui/switch";
import { Bell, Droplets, TrendingUp, CheckCircle, RotateCcw } from "lucide-react";
import { useNotificationPreferences } from "@/contexts/NotificationPreferencesContext";
import { cn } from "@/lib/utils";
import { SettingsCard, SettingsGroup, SettingRow } from "./SettingsUI";
import { toast } from "sonner";
import { PushNotificationSettings } from "./PushNotificationSettings";

export const NotificationsTab = () => {
  const { preferences, updatePreferences, resetToDefaults } = useNotificationPreferences();

  const handleReset = () => {
    resetToDefaults();
    toast.success("Notification preferences reset to defaults");
  };

  const toggle = (
    id: keyof typeof preferences,
    label: string,
    description: string,
    requiresMaster = true
  ) => (
    <SettingRow
      htmlFor={id}
      label={label}
      description={description}
      className={cn(requiresMaster && !preferences.enabled && "opacity-60")}
      control={
        <Switch
          id={id}
          checked={Boolean(preferences[id])}
          disabled={requiresMaster && !preferences.enabled}
          onCheckedChange={(checked) => updatePreferences({ [id]: checked })}
        />
      }
    />
  );

  return (
    <div className="space-y-3">
      {/* Push Notifications Card */}
      <PushNotificationSettings />

      <SettingsCard
        title="Notification Preferences"
        description="Choose which in-app alerts you get"
        icon={Bell}
        iconClasses="bg-sprout-cream text-sprout-dark"
        action={
          <button
            type="button"
            onClick={handleReset}
            className="h-10 px-3.5 rounded-[14px] bg-field text-foreground text-sm font-bold inline-flex items-center gap-1.5"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reset to Defaults</span>
            <span className="sm:hidden">Reset</span>
          </button>
        }
      >
        {toggle("enabled", "Enable Notifications", "Master switch for all in-app notifications", false)}

        <SettingsGroup title="Plant Care Alerts" description="Your plants' watering needs" icon={Droplets}>
          {toggle("overdueWatering", "Overdue Watering", "When a plant is overdue for water")}
          {toggle("dueTodayWatering", "Due Today", "When a plant needs water today")}
        </SettingsGroup>

        <SettingsGroup title="Success Notifications" description="Confirmation when you finish something" icon={CheckCircle}>
          {toggle("wateringSuccess", "Watering Success", "After watering a single plant")}
          {toggle("bulkActions", "Bulk Actions", "After watering or editing several plants at once")}
        </SettingsGroup>

        <SettingsGroup title="Pattern Insights" description="Suggestions based on how you water" icon={TrendingUp}>
          {toggle("patternInsights", "Pattern Analysis", "Insights about your plant care patterns")}
        </SettingsGroup>
      </SettingsCard>
    </div>
  );
};

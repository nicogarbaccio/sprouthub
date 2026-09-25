import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useSmartWateringPreferences } from "@/hooks/useSmartWateringPreferences";
import { UserWateringPreferences } from "@/types/smartWateringTypes";
import { getFactorLabels } from "@/utils/watering/smartSchedule";
import { cn } from "@/lib/utils";
import {
  Lightbulb,
  Thermometer,
  Droplets,
  Heart,
  Shovel,
  MapPin,
  Loader2,
  Sprout,
  CheckCircle2,
} from "lucide-react";
import {
  SettingsCard,
  ChoiceChips,
  settingsInputClasses,
  settingsPrimaryButtonClasses,
  settingsSecondaryButtonClasses,
} from "./SettingsUI";
import HiddenArticlesCard from "./HiddenArticlesCard";

export const PreferencesTab = () => {
  const { preferences, savePreferences, isLoading, clearPreferences } =
    useSmartWateringPreferences();
  const labels = getFactorLabels();

  const [formData, setFormData] = useState<Partial<UserWateringPreferences>>({
    default_light_level: preferences?.default_light_level || "medium",
    default_temperature: preferences?.default_temperature || "normal",
    default_humidity: preferences?.default_humidity || "normal",
    default_care_style: preferences?.default_care_style || "balanced",
    default_soil_type: preferences?.default_soil_type || "regular",
    location: preferences?.location || "",
  });

  const [hasChanges, setHasChanges] = useState(false);
  const userEditedRef = useRef(false);

  useEffect(() => {
    if (preferences && !userEditedRef.current) {
      setFormData({
        default_light_level: preferences.default_light_level,
        default_temperature: preferences.default_temperature,
        default_humidity: preferences.default_humidity,
        default_care_style: preferences.default_care_style,
        default_soil_type: preferences.default_soil_type,
        location: preferences.location || "",
      });
    }
  }, [preferences]);

  // Check if there are unsaved changes
  useEffect(() => {
    if (preferences) {
      const changed =
        formData.default_light_level !== preferences.default_light_level ||
        formData.default_temperature !== preferences.default_temperature ||
        formData.default_humidity !== preferences.default_humidity ||
        formData.default_care_style !== preferences.default_care_style ||
        formData.default_soil_type !== preferences.default_soil_type ||
        formData.location !== (preferences.location || "");
      setHasChanges(changed);
      if (changed) userEditedRef.current = true;
    }
  }, [formData, preferences]);

  const handleSave = async () => {
    await savePreferences(formData);
    setHasChanges(false);
    userEditedRef.current = false;
  };

  const handleClear = async () => {
    const success = await clearPreferences();
    if (success) {
      setFormData({
        default_light_level: "medium",
        default_temperature: "normal",
        default_humidity: "normal",
        default_care_style: "balanced",
        default_soil_type: "regular",
        location: "",
      });
      setHasChanges(false);
      userEditedRef.current = false;
    }
  };

  const field = <T extends string>(
    title: string,
    icon: React.ElementType,
    options: readonly T[],
    value: T | undefined,
    key: keyof UserWateringPreferences,
    labelMap: Record<string, string>
  ) => {
    const Icon = icon;
    return (
      <div>
        <div className="flex items-center gap-2 px-1 mb-2 text-[15px] font-bold text-foreground">
          <Icon className="w-4 h-4 text-muted-foreground" />
          {title}
        </div>
        <ChoiceChips
          ariaLabel={title}
          options={options}
          value={value}
          onChange={(next) => setFormData((prev) => ({ ...prev, [key]: next }))}
          getLabel={(option) => labelMap[option]}
        />
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <SettingsCard
        title="Smart Watering Preferences"
        description="Your usual home conditions. The Smart Watering Wizard starts from these."
        icon={Sprout}
      >
        <div className="space-y-5">
          {field("Default Light Level", Lightbulb, ["low", "medium", "high"] as const, formData.default_light_level, "default_light_level", labels.lightLevel)}
          {field("Default Temperature", Thermometer, ["cool", "normal", "warm"] as const, formData.default_temperature, "default_temperature", labels.temperature)}
          {field("Default Humidity Level", Droplets, ["dry", "normal", "humid"] as const, formData.default_humidity, "default_humidity", labels.humidity)}
          {field("Default Care Style", Heart, ["frequent", "balanced", "minimal"] as const, formData.default_care_style, "default_care_style", labels.careStyle)}
          {field("Default Soil Type", Shovel, ["regular", "draining", "retaining"] as const, formData.default_soil_type, "default_soil_type", labels.soilType)}

          <div>
            <label
              htmlFor="location"
              className="flex items-center gap-2 px-1 mb-2 text-[15px] font-bold text-foreground"
            >
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Location (Optional)
            </label>
            <Input
              id="location"
              placeholder="e.g., San Francisco, CA"
              value={formData.location || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
              className={settingsInputClasses}
            />
            <p className="text-[13px] text-muted-foreground px-1 mt-1.5">
              Helps with more accurate seasonal adjustments
            </p>
          </div>
        </div>

        {preferences && !hasChanges && (
          <div className="flex items-center gap-2.5 rounded-[18px] bg-sprout-success/15 px-4 py-3 text-sm font-semibold text-foreground">
            <CheckCircle2 className="w-5 h-5 text-sprout-success shrink-0" />
            Saved. The Smart Watering Wizard will use these as defaults.
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
            className={settingsPrimaryButtonClasses}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? "Saving..." : "Save Preferences"}
          </button>

          {preferences && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className={cn(settingsSecondaryButtonClasses, "shrink-0")}
            >
              Reset to Defaults
            </button>
          )}
        </div>
      </SettingsCard>

      <HiddenArticlesCard />
    </div>
  );
};

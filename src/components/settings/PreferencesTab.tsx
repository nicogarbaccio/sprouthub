import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { CascadingContainer } from "@/components/ui/cascading-container";

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

  const renderOptionCards = <T extends string>(
    options: readonly T[],
    currentValue: T | undefined,
    onSelect: (value: T) => void,
    getLabel: (value: T) => string
  ) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {options.map((option) => (
        <Card
          key={option}
          className={cn(
            "cursor-pointer transition-all hover:shadow-md border-2",
            currentValue === option
              ? "border-plant-primary bg-plant-primary/5 dark:bg-plant-primary/10"
              : "border-border hover:border-plant-primary/50"
          )}
          onClick={() => onSelect(option)}
        >
          <CardContent className="p-3">
            <div className="text-center">
              <p className="font-medium text-foreground">{getLabel(option)}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Smart Watering Preferences</CardTitle>
          <CardDescription>
            Set your default environmental conditions and care preferences to
            personalize watering recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Light Level */}
          <CascadingContainer delay={0}>
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-medium">
                <Lightbulb className="w-4 h-4" />
                Default Light Level
              </Label>
              {renderOptionCards(
                ["low", "medium", "high"] as const,
                formData.default_light_level,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    default_light_level: value,
                  })),
                (value) =>
                  labels.lightLevel[value as keyof typeof labels.lightLevel]
              )}
            </div>
          </CascadingContainer>

          {/* Temperature */}
          <CascadingContainer delay={50}>
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-medium">
                <Thermometer className="w-4 h-4" />
                Default Temperature
              </Label>
              {renderOptionCards(
                ["cool", "normal", "warm"] as const,
                formData.default_temperature,
                (value) =>
                  setFormData((prev) => ({
                    ...prev,
                    default_temperature: value,
                  })),
                (value) =>
                  labels.temperature[value as keyof typeof labels.temperature]
              )}
            </div>
          </CascadingContainer>

          {/* Humidity */}
          <CascadingContainer delay={100}>
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-medium">
                <Droplets className="w-4 h-4" />
                Default Humidity Level
              </Label>
              {renderOptionCards(
                ["dry", "normal", "humid"] as const,
                formData.default_humidity,
                (value) =>
                  setFormData((prev) => ({ ...prev, default_humidity: value })),
                (value) => labels.humidity[value as keyof typeof labels.humidity]
              )}
            </div>
          </CascadingContainer>

          {/* Care Style */}
          <CascadingContainer delay={150}>
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-medium">
                <Heart className="w-4 h-4" />
                Default Care Style
              </Label>
              {renderOptionCards(
                ["frequent", "balanced", "minimal"] as const,
                formData.default_care_style,
                (value) =>
                  setFormData((prev) => ({ ...prev, default_care_style: value })),
                (value) =>
                  labels.careStyle[value as keyof typeof labels.careStyle]
              )}
            </div>
          </CascadingContainer>

          {/* Soil Type */}
          <CascadingContainer delay={200}>
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-medium">
                <Shovel className="w-4 h-4" />
                Default Soil Type
              </Label>
              {renderOptionCards(
                ["regular", "draining", "retaining"] as const,
                formData.default_soil_type,
                (value) =>
                  setFormData((prev) => ({ ...prev, default_soil_type: value })),
                (value) => labels.soilType[value as keyof typeof labels.soilType]
              )}
            </div>
          </CascadingContainer>

          {/* Location (Optional) */}
          <CascadingContainer delay={250}>
            <div className="space-y-3">
              <Label
                htmlFor="location"
                className="flex items-center gap-2 text-base font-medium"
              >
                <MapPin className="w-4 h-4" />
                Location (Optional)
              </Label>
              <Input
                id="location"
                placeholder="e.g., San Francisco, CA"
                value={formData.location || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Help us provide more accurate seasonal adjustments
              </p>
            </div>
          </CascadingContainer>

          {/* Status */}
          {preferences && !hasChanges && (
            <div className="bg-plant-primary/10 dark:bg-plant-primary/5 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="secondary"
                  className="bg-plant-primary text-white"
                >
                  Preferences Saved
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Your preferences will be used as defaults in the Smart Watering
                Wizard
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={isLoading || !hasChanges}
              className={cn(
                "flex-1",
                hasChanges
                  ? "bg-sprout-success hover:bg-sprout-success/90 text-white"
                  : ""
              )}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isLoading ? "Saving..." : "Save Preferences"}
            </Button>

            {preferences && (
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={isLoading}
              >
                Reset to Defaults
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

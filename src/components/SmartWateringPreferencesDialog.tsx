import React, { useState } from "react";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSmartWateringPreferences } from "@/hooks/useSmartWateringPreferences";
import { UserWateringPreferences } from "@/types/smartWateringTypes";
import { getFactorLabels } from "@/utils/smartWateringSchedule";
import { cn } from "@/lib/utils";
import {
 Settings,
 Lightbulb,
 Thermometer,
 Droplets,
 Heart,
 Shovel,
 MapPin,
} from "lucide-react";

interface SmartWateringPreferencesDialogProps {
 isOpen: boolean;
 onClose: () => void;
}

export const SmartWateringPreferencesDialog: React.FC<
 SmartWateringPreferencesDialogProps
> = ({ isOpen, onClose }) => {
 const { preferences, savePreferences, isLoading, clearPreferences } =
  useSmartWateringPreferences();
 const { toast } = useToast();
 const labels = getFactorLabels();

 const [formData, setFormData] = useState<Partial<UserWateringPreferences>>({
  default_light_level: preferences?.default_light_level || "medium",
  default_temperature: preferences?.default_temperature || "normal",
  default_humidity: preferences?.default_humidity || "normal",
  default_care_style: preferences?.default_care_style || "balanced",
  default_soil_type: preferences?.default_soil_type || "regular",
  location: preferences?.location || "",
 });

 React.useEffect(() => {
  if (preferences) {
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

 const handleSave = async () => {
  const success = await savePreferences(formData);
  if (success) {
   onClose();
  }
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
       ? "border-plant-primary bg-plant-primary/5"
       : "border-gray-200 hover:border-plant-primary/50"
     )}
     onClick={() => onSelect(option)}
    >
     <CardContent className="p-3">
      <div className="text-center">
       <p className="font-medium text-plant-text">{getLabel(option)}</p>
      </div>
     </CardContent>
    </Card>
   ))}
  </div>
 );

 return (
  <Dialog open={isOpen} onOpenChange={onClose}>
   <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
     <DialogTitle className="flex items-center gap-2">
      <Settings className="w-5 h-5 text-plant-primary" />
      Smart Watering Preferences
     </DialogTitle>
     <DialogDescription>
      Set your default environmental conditions and care preferences to
      personalize your watering recommendations.
     </DialogDescription>
    </DialogHeader>

    <div className="space-y-6">
     {/* Light Level */}
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

     {/* Temperature */}
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

     {/* Humidity */}
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

     {/* Care Style */}
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

     {/* Soil Type */}
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

     {/* Location (Optional) */}
     <div className="space-y-3">
      <Label className="flex items-center gap-2 text-base font-medium">
       <MapPin className="w-4 h-4" />
       Location (Optional)
      </Label>
      <Input
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

     {/* Status */}
     {preferences && (
      <div className="bg-plant-primary/10 p-4 rounded-lg">
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
    </div>

    {/* Actions */}
    <div className="flex gap-3 pt-4 border-t">
     <Button onClick={handleSave} disabled={isLoading} className="flex-1">
      {isLoading ? "Saving..." : "Save Preferences"}
     </Button>

     {preferences && (
      <Button
       variant="outline"
       onClick={handleClear}
       disabled={isLoading}
      >
       Clear
      </Button>
     )}

     <Button variant="outline" onClick={onClose} disabled={isLoading}>
      Cancel
     </Button>
    </div>
   </DialogContent>
  </Dialog>
 );
};

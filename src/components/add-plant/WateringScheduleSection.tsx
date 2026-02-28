import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Brain } from "lucide-react";

const wateringOptions = [
  { value: 3, label: "Every 3 days" },
  { value: 7, label: "Weekly (7 days)" },
  { value: 10, label: "Every 10 days" },
  { value: 14, label: "Bi-weekly (14 days)" },
  { value: 21, label: "Every 3 weeks" },
  { value: 30, label: "Monthly (30 days)" },
];

interface WateringScheduleSectionProps {
  wateringScheduleDays: number;
  isCustomSelected: boolean;
  customDays: string;
  onScheduleChange: (value: string) => void;
  onCustomDaysChange: (value: string) => void;
  onOpenSmartWizard: () => void;
}

export const WateringScheduleSection = ({
  wateringScheduleDays,
  isCustomSelected,
  customDays,
  onScheduleChange,
  onCustomDaysChange,
  onOpenSmartWizard,
}: WateringScheduleSectionProps) => {
  const getCurrentSelectValue = () => {
    if (isCustomSelected) return "custom";
    return wateringScheduleDays.toString();
  };

  return (
    <div className="space-y-2">
      <Label
        htmlFor="watering_schedule"
        className="text-plant-text dark:text-zinc-200"
      >
        Watering Schedule
      </Label>
      <Select
        value={getCurrentSelectValue()}
        onValueChange={onScheduleChange}
      >
        <SelectTrigger
          className="border-plant-secondary/30 focus:border-plant-primary"
          data-testid="watering-schedule-trigger"
        >
          <SelectValue placeholder="Select watering frequency" />
        </SelectTrigger>
        <SelectContent>
          {wateringOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value.toString()}
            >
              {option.label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="outline"
        className="w-full mt-2 text-sm border-plant-primary/30 hover:bg-plant-primary/5 hover:border-plant-primary dark:bg-sprout-success dark:hover:bg-sprout-success/90 dark:border-sprout-success dark:text-white"
        onClick={onOpenSmartWizard}
        data-testid="smart-watering-button"
      >
        <Brain className="w-4 h-4 mr-2" />
        Find optimal schedule for this plant
      </Button>

      {isCustomSelected && (
        <div className="space-y-1">
          <Label
            htmlFor="custom_days"
            className="text-plant-text dark:text-zinc-200 text-sm"
          >
            Custom days
          </Label>
          <Input
            id="custom_days"
            type="number"
            min="1"
            max="365"
            value={customDays}
            onChange={(e) => onCustomDaysChange(e.target.value)}
            placeholder="Enter days between watering"
            className="border-plant-secondary/30 focus:border-plant-primary"
            data-testid="custom-days-input"
          />
          <p className="text-xs text-muted-foreground">
            Enter a number between 1 and 365 days
          </p>
        </div>
      )}
    </div>
  );
};

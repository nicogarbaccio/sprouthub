import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { TreePine } from "lucide-react";

interface PlantNotesAndOptionsProps {
  notes: string;
  isOutdoorPlant: boolean;
  onNotesChange: (value: string) => void;
  onOutdoorChange: (value: boolean) => void;
}

export const PlantNotesAndOptions = ({
  notes,
  isOutdoorPlant,
  onNotesChange,
  onOutdoorChange,
}: PlantNotesAndOptionsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label
          htmlFor="notes"
          className="text-plant-text dark:text-zinc-200"
        >
          Notes
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Care instructions, botanical name, etc."
          className="border-plant-secondary/30 focus:border-plant-primary min-h-20"
          data-testid="plant-notes-textarea"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is-outdoor-plant"
            checked={isOutdoorPlant}
            onCheckedChange={(checked) => onOutdoorChange(checked === true)}
            data-testid="outdoor-plant-checkbox"
          />
          <Label
            htmlFor="is-outdoor-plant"
            className="text-plant-text dark:text-zinc-200 flex items-center gap-2"
          >
            <TreePine className="w-4 h-4" />
            This is an outdoor plant
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Outdoor plants will get smart rain delay recommendations when
          weather data is available
        </p>
      </div>
    </>
  );
};

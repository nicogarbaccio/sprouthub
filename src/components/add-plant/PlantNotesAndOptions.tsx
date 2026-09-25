import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FieldLabel, SettingRow } from "@/components/settings/SettingsUI";

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
      <div>
        <FieldLabel htmlFor="notes">Notes</FieldLabel>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Care instructions, botanical name, etc."
          className="min-h-20 resize-none rounded-2xl border-0 bg-field px-4 py-3 text-[15px] font-medium focus-visible:ring-2 focus-visible:ring-offset-0"
          data-testid="plant-notes-textarea"
        />
      </div>

      <SettingRow
        htmlFor="is-outdoor-plant"
        label="Outdoor plant"
        description="Gets rain delay suggestions when weather is on"
        control={
          <Switch
            id="is-outdoor-plant"
            checked={isOutdoorPlant}
            onCheckedChange={onOutdoorChange}
            data-testid="outdoor-plant-checkbox"
          />
        }
      />
    </>
  );
};

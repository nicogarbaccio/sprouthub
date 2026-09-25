import { FieldLabel, settingsInputClasses } from "@/components/settings/SettingsUI";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Household {
  id: string;
  name: string;
  member_count: number;
}

interface HouseholdSelectorProps {
  households: Household[];
  householdId: string;
  onHouseholdChange: (value: string) => void;
}

export const HouseholdSelector = ({
  households,
  householdId,
  onHouseholdChange,
}: HouseholdSelectorProps) => {
  if (households.length === 0) return null;

  return (
    <div>
      <FieldLabel htmlFor="household_assignment">Assignment</FieldLabel>
      <Select
        value={householdId || "personal"}
        onValueChange={(value) =>
          onHouseholdChange(value === "personal" ? "" : value)
        }
      >
        <SelectTrigger
          id="household_assignment"
          className={`${settingsInputClasses} [&>span]:line-clamp-none`}
          data-testid="household-select-trigger"
        >
          <SelectValue placeholder="Personal plant or assign to household" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="personal">
            <span className="flex items-center gap-2 min-w-0">
              <span className="shrink-0">👤</span>
              <span className="truncate">Personal Plant</span>
            </span>
          </SelectItem>
          {households.map((household) => (
            <SelectItem key={household.id} value={household.id}>
              <span className="flex items-center gap-2 min-w-0">
                <span className="shrink-0">🏠</span>
                <span className="truncate">{household.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  ({household.member_count} members)
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-[13px] text-muted-foreground px-1 mt-1.5">
        {householdId
          ? "Everyone in the household can see and care for this plant"
          : "Only you can see this plant"}
      </p>
    </div>
  );
};

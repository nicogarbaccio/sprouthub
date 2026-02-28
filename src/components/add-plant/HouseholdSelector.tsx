import { Label } from "@/components/ui/label";
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
    <div className="space-y-2">
      <Label
        htmlFor="household_assignment"
        className="text-plant-text dark:text-zinc-200"
      >
        Assignment
      </Label>
      <Select
        value={householdId || "personal"}
        onValueChange={(value) =>
          onHouseholdChange(value === "personal" ? "" : value)
        }
      >
        <SelectTrigger
          className="border-plant-secondary/30 focus:border-plant-primary [&>span]:line-clamp-none"
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
      {householdId && (
        <p className="text-xs text-muted-foreground">
          This plant will be visible and manageable by all household members
        </p>
      )}
    </div>
  );
};

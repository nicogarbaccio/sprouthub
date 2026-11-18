import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Droplets,
  Edit,
  Trash2,
  History,
  Clock,
  MoreHorizontal,
  Moon,
  Bell,
} from "lucide-react";

interface PlantActionsMenuProps {
  canPostpone: boolean;
  hasSmartTips: boolean;
  onWaterClick: () => void;
  onPostponeClick: () => void;
  onViewHistory: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
  /** True while watering reminders are paused for a rest period */
  isResting: boolean;
  onPauseClick: () => void;
  onResumeClick: () => void;
}

const PlantActionsMenu = ({
  canPostpone,
  hasSmartTips,
  onWaterClick,
  onPostponeClick,
  onViewHistory,
  onEditClick,
  onDeleteClick,
  isResting,
  onPauseClick,
  onResumeClick,
}: PlantActionsMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="w-12 h-12 rounded-2xl bg-card text-foreground flex items-center justify-center shadow-sm"
          aria-label="Plant actions menu"
        >
          <MoreHorizontal className="w-[22px] h-[22px]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onWaterClick}>
          <Droplets className="text-sprout-water" />
          Water Now
        </DropdownMenuItem>

        {canPostpone && (
          <DropdownMenuItem onClick={onPostponeClick}>
            <Clock />
            Push to Tomorrow
          </DropdownMenuItem>
        )}

        {isResting ? (
          <DropdownMenuItem onClick={onResumeClick}>
            <Bell />
            Resume watering reminders
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onPauseClick}>
            <Moon />
            Pause watering reminders
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onViewHistory}>
          <History />
          {hasSmartTips ? "History & Tips" : "History"}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onEditClick}>
          <Edit />
          Edit
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onDeleteClick}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PlantActionsMenu;

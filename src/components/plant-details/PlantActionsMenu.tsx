import { Button } from "@/components/ui/button";
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
  ChevronDown,
} from "lucide-react";

interface PlantActionsMenuProps {
  canPostpone: boolean;
  hasSmartTips: boolean;
  onWaterClick: () => void;
  onPostponeClick: () => void;
  onViewHistory: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

const PlantActionsMenu = ({
  canPostpone,
  hasSmartTips,
  onWaterClick,
  onPostponeClick,
  onViewHistory,
  onEditClick,
  onDeleteClick,
}: PlantActionsMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="flex-1 bg-sprout-water hover:bg-sprout-water/90 text-sprout-white rounded-xl font-medium"
          aria-label="Plant actions menu"
        >
          Actions
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onWaterClick} className="cursor-pointer">
          <Droplets className="w-4 h-4 mr-2 text-sprout-water" />
          Water Now
        </DropdownMenuItem>

        {canPostpone && (
          <DropdownMenuItem
            onClick={onPostponeClick}
            className="cursor-pointer"
          >
            <Clock className="w-4 h-4 mr-2" />
            Push to Tomorrow
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onViewHistory} className="cursor-pointer">
          <History className="w-4 h-4 mr-2" />
          {hasSmartTips ? "History & Tips" : "History"}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onEditClick} className="cursor-pointer">
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onDeleteClick}
          className="cursor-pointer text-red-400 focus:text-red-400"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PlantActionsMenu;

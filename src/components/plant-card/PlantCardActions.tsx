import { Button } from "@/components/ui/button";
import {
  Droplets,
  Edit,
  Clock,
  History,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PlantCardActionsProps {
  daysUntilWatering: number;
  isPostponed?: boolean;
  hasUnknownWateringDate: boolean;
  lastWateredDate?: string;
  hasPendingSuggestions: boolean;
  onWaterClick: () => void;
  onPostponeClick: () => void;
  onEdit: () => void;
  onViewHistory?: () => void;
  onPostpone?: () => void;
  onJournalClick: () => void;
  onJournalHover: () => void;
}

export function PlantCardActions({
  daysUntilWatering,
  isPostponed,
  hasUnknownWateringDate,
  lastWateredDate,
  hasPendingSuggestions,
  onWaterClick,
  onPostponeClick,
  onEdit,
  onViewHistory,
  onPostpone,
  onJournalClick,
  onJournalHover,
}: PlantCardActionsProps) {
  return (
    <div>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            className="w-full bg-sprout-water hover:bg-sprout-water/90 text-sprout-white rounded-xl font-medium"
            aria-label="Plant actions menu"
          >
            Actions
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={onWaterClick}
            className="cursor-pointer"
          >
            <Droplets className="w-4 h-4 mr-2 text-sprout-water" />
            Water Now
          </DropdownMenuItem>

          {daysUntilWatering <= 0 &&
            !isPostponed &&
            !hasUnknownWateringDate &&
            lastWateredDate &&
            onPostpone && (
              <DropdownMenuItem
                onClick={onPostponeClick}
                className="cursor-pointer"
              >
                <Clock className="w-4 h-4 mr-2" />
                Push to Tomorrow
              </DropdownMenuItem>
            )}

          {(daysUntilWatering <= 0 &&
            !isPostponed &&
            !hasUnknownWateringDate &&
            lastWateredDate &&
            onPostpone) ||
          onViewHistory ? (
            <DropdownMenuSeparator />
          ) : null}

          {onViewHistory && (
            <DropdownMenuItem
              onClick={onViewHistory}
              className="cursor-pointer"
            >
              <History className="w-4 h-4 mr-2" />
              {hasPendingSuggestions
                ? "History & Insights"
                : "View Watering History"}
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={onJournalClick}
            onMouseEnter={onJournalHover}
            onFocus={onJournalHover}
            className="cursor-pointer"
          >
            <BookOpen className="w-4 h-4 mr-2 text-emerald-600" />
            Plant Journal
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
            <Edit className="w-4 h-4 mr-2" />
            Edit Plant
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

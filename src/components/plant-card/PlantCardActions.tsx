import {
  Droplets,
  Edit,
  Clock,
  History,
  MoreHorizontal,
  BookOpen,
  FlaskConical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PlantCardActionsProps {
  /** `null` when the plant has no watering history; always gated by `hasUnknownWateringDate`. */
  daysUntilWatering: number | null;
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
  isFertilizationDue?: boolean;
  onFertilizeClick?: () => void;
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
  isFertilizationDue,
  onFertilizeClick,
}: PlantCardActionsProps) {
  return (
    <div className="shrink-0">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="w-10 h-10 rounded-[14px] bg-field text-foreground flex items-center justify-center hover:bg-sprout-cream hover:text-sprout-dark transition-colors"
            aria-label="Plant actions menu"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={onWaterClick}
            className="cursor-pointer"
          >
            <Droplets className="w-4 h-4 mr-2 text-sprout-water" />
            Water Now
          </DropdownMenuItem>

          {isFertilizationDue && onFertilizeClick && (
            <DropdownMenuItem
              onClick={onFertilizeClick}
              className="cursor-pointer"
            >
              <FlaskConical className="w-4 h-4 mr-2 text-sprout-success" />
              Log Fertilization
            </DropdownMenuItem>
          )}

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
            <BookOpen className="w-4 h-4 mr-2" />
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

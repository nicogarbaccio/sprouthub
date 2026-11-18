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
            className="w-8 h-8 rounded-xl bg-field text-foreground flex items-center justify-center hover:bg-sprout-cream hover:text-sprout-dark transition-colors"
            aria-label="Plant actions menu"
          >
            <MoreHorizontal className="w-[18px] h-[18px]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onWaterClick}>
            <Droplets className="text-sprout-water" />
            Water Now
          </DropdownMenuItem>

          {isFertilizationDue && onFertilizeClick && (
            <DropdownMenuItem onClick={onFertilizeClick}>
              <FlaskConical className="text-sprout-success" />
              Log Fertilization
            </DropdownMenuItem>
          )}

          {daysUntilWatering <= 0 &&
            !isPostponed &&
            !hasUnknownWateringDate &&
            lastWateredDate &&
            onPostpone && (
              <DropdownMenuItem onClick={onPostponeClick}>
                <Clock />
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
            <DropdownMenuItem onClick={onViewHistory}>
              <History />
              {hasPendingSuggestions
                ? "History & Insights"
                : "View Watering History"}
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={onJournalClick}
            onMouseEnter={onJournalHover}
            onFocus={onJournalHover}
          >
            <BookOpen />
            Plant Journal
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={onEdit}>
            <Edit />
            Edit Plant
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

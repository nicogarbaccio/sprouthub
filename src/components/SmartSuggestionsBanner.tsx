import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Eye,
  X,
  Clock,
  Target,
} from "lucide-react";

export interface PlantWithSuggestions {
  id: string;
  name: string;
  suggestionsCount: number;
  highPrioritySuggestions: number;
}

interface SmartSuggestionsBannerProps {
  plantsWithSuggestions: PlantWithSuggestions[];
  totalSuggestions: number;
  onReviewClick: () => void;
  onDismiss: () => void;
  onSnooze: (weeks: number) => void;
}

export function SmartSuggestionsBanner({
  plantsWithSuggestions,
  totalSuggestions,
  onReviewClick,
  onDismiss,
  onSnooze,
}: SmartSuggestionsBannerProps) {
  const plantsCount = plantsWithSuggestions.length;
  const highPriorityCount = plantsWithSuggestions.reduce(
    (sum, plant) => sum + plant.highPrioritySuggestions,
    0
  );

  const getMessage = () => {
    if (plantsCount === 1) {
      return `💡 Smart watering insights available for ${plantsWithSuggestions[0].name}`;
    }
    return `💡 Smart watering insights available for ${plantsCount} plants`;
  };

  return (
    <Alert data-testid="smart-suggestions-banner-alert" className="mb-6 text-blue-700 bg-blue-50 border-blue-200 border-l-4 dark:text-blue-100 dark:bg-blue-950/60 dark:border-blue-600">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <Brain className="h-6 w-6 mt-0.5 flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 data-testid="smart-banner-title" className="font-semibold text-lg">{getMessage()}</h3>
              {highPriorityCount > 0 && (
                <Badge
                  data-testid="high-priority-badge"
                  variant="outline"
                  className="text-xs bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/70 dark:text-orange-100 dark:border-orange-600"
                >
                  {highPriorityCount} high priority
                </Badge>
              )}
            </div>

            <AlertDescription data-testid="smart-banner-description" className="text-sm mb-3">
              <div className="flex items-center space-x-1 mb-2">
                <Target className="h-4 w-4" />
                <span>
                  <strong>{totalSuggestions}</strong> suggestion
                  {totalSuggestions !== 1 ? "s" : ""} available to help optimize
                  your watering patterns and plant care
                </span>
              </div>

              {plantsCount > 1 && (
                <div className="text-xs opacity-75 mt-1">
                  <strong>Plants:</strong>{" "}
                  {plantsWithSuggestions
                    .slice(0, 3)
                    .map((p) => p.name)
                    .join(", ")}
                  {plantsCount > 3 && ` and ${plantsCount - 3} more`}
                </div>
              )}
            </AlertDescription>

            <div className="flex flex-wrap gap-2">
              <Button
                data-testid="review-suggestions-button"
                onClick={onReviewClick}
                size="sm"
                className="bg-white/80 hover:bg-white text-current border border-current/20 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 dark:border-blue-400/30"
              >
                <Eye className="h-4 w-4 mr-1" />
                Review Suggestions
              </Button>

              <div className="flex items-center space-x-1">
                <Button
                  data-testid="snooze-suggestions-1-week-button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onSnooze(1)}
                  className="text-xs opacity-75 hover:opacity-100"
                >
                  <Clock className="h-3 w-3 mr-1" />1 week
                </Button>

                <Button
                  data-testid="snooze-suggestions-2-weeks-button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onSnooze(2)}
                  className="text-xs opacity-75 hover:opacity-100"
                >
                  2 weeks
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Button
          data-testid="dismiss-smart-banner-button"
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="opacity-50 hover:opacity-100 flex-shrink-0 ml-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SmartScheduleResult } from "@/utils/watering/smartSchedule";

interface StepResultsProps {
  result: SmartScheduleResult;
  onStartOver: () => void;
  onApplySchedule: () => void;
}

export const StepResults = ({ result, onStartOver, onApplySchedule }: StepResultsProps) => {
  const isIncrease = result.totalAdjustment > 0;
  const isDecrease = result.totalAdjustment < 0;
  const noChange = result.totalAdjustment === 0;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <CheckCircle className="w-12 h-12 text-sprout-light mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-sprout-white">
          Your Personalized Schedule
        </h3>
        <p className="text-sprout-light">
          Based on your inputs, here's the optimal watering schedule
        </p>
      </div>

      {/* Main Result */}
      <Card className="border-sprout-success bg-sprout-primary/50">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-sprout-light mb-1">
                Recommended Schedule
              </p>
              <p
                className="text-3xl font-bold text-sprout-success"
                data-testid="recommended-days"
              >
                Every {result.recommendedDays} days
              </p>
            </div>

            <div className="flex justify-center items-center gap-4 text-sm">
              <div className="text-sprout-light">
                Base: {result.baseDays} days
              </div>
              <div
                className={cn(
                  "font-medium",
                  isIncrease && "text-sprout-warning",
                  isDecrease && "text-sprout-water",
                  noChange && "text-sprout-success"
                )}
              >
                {noChange
                  ? "No adjustment needed"
                  : `${isIncrease ? "+" : ""}${result.totalAdjustment} days`}
              </div>
            </div>

            <Badge
              variant={
                result.confidence === "high"
                  ? "default"
                  : result.confidence === "medium"
                  ? "secondary"
                  : "destructive"
              }
              className="mx-auto"
              data-testid="confidence-level"
            >
              {result.confidence} confidence
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Explanation */}
      {result.adjustmentReasons.length > 0 && (
        <Card className="bg-sprout-primary/30 border-sprout-medium">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-sprout-water" />
              <h4 className="font-medium text-sprout-white">
                Why this schedule?
              </h4>
            </div>
            <ul className="space-y-2" data-testid="adjustment-reasons">
              {result.adjustmentReasons.map((reason, index) => (
                <li key={index} className="text-sm text-sprout-light">
                  • {reason}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onStartOver}
          className="flex-1 border-sprout-light text-sprout-light hover:bg-sprout-light hover:text-sprout-dark"
        >
          Adjust Settings
        </Button>
        <Button
          onClick={onApplySchedule}
          className="flex-1 bg-sprout-success hover:bg-sprout-success/90 text-sprout-white"
          data-testid="apply-button"
        >
          Use This Schedule
        </Button>
      </div>
    </div>
  );
};

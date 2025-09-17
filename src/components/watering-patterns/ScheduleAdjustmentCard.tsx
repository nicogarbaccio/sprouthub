/**
 * Component for one-click schedule adjustments
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  Clock,
  Info,
  Undo2
} from 'lucide-react';
import { ScheduleAdjustmentSuggestion } from '@/types/wateringPatternTypes';
import { cn } from '@/lib/utils';

interface ScheduleAdjustmentCardProps {
  suggestion: ScheduleAdjustmentSuggestion;
  plantName?: string;
  isApplying?: boolean;
  onApply?: (newSchedule: number) => Promise<void>;
  onRevert?: () => Promise<void>;
  wasApplied?: boolean;
  className?: string;
}

const ScheduleAdjustmentCard = ({
  suggestion,
  plantName = 'this plant',
  isApplying = false,
  onApply,
  onRevert,
  wasApplied = false,
  className,
}: ScheduleAdjustmentCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  const handleApply = async () => {
    if (onApply) {
      await onApply(suggestion.suggestedSchedule);
    }
  };

  const handleRevert = async () => {
    if (onRevert) {
      setIsReverting(true);
      try {
        await onRevert();
      } finally {
        setIsReverting(false);
      }
    }
  };

  const getAdjustmentIcon = () => {
    return suggestion.adjustmentType === 'increase' ? TrendingUp : TrendingDown;
  };

  const getAdjustmentColor = () => {
    return suggestion.adjustmentType === 'increase' 
      ? 'text-green-600 dark:text-green-400'
      : 'text-blue-600 dark:text-blue-400';
  };

  const getConfidenceBadgeVariant = () => {
    switch (suggestion.confidence) {
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const AdjustmentIcon = getAdjustmentIcon();
  const scheduleDifference = suggestion.suggestedSchedule - suggestion.currentSchedule;
  const adjustmentText = suggestion.adjustmentType === 'increase' ? 'extension' : 'shortening';

  return (
    <Card className={cn('transition-all duration-200', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className={cn(
              'p-2 rounded-full',
              suggestion.adjustmentType === 'increase' 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : 'bg-blue-100 dark:bg-blue-900/30'
            )}>
              <AdjustmentIcon className={cn('w-4 h-4', getAdjustmentColor())} />
            </div>
            Schedule {adjustmentText.charAt(0).toUpperCase() + adjustmentText.slice(1)} Suggested
          </CardTitle>
          
          <Badge variant={getConfidenceBadgeVariant()}>
            {suggestion.confidence}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Schedule Change Preview */}
        <div className="p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Proposed Change</h4>
            <span className={cn(
              'text-sm font-medium',
              scheduleDifference > 0 ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
            )}>
              {scheduleDifference > 0 ? '+' : ''}{scheduleDifference} day{Math.abs(scheduleDifference) !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Every</span>
            </div>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <span className="text-muted-foreground line-through">
                {suggestion.currentSchedule}
              </span>
              <span>→</span>
              <span className="text-sprout-primary">
                {suggestion.suggestedSchedule}
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                day{suggestion.suggestedSchedule !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Success message */}
        {wasApplied && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Schedule updated! {plantName} will now be watered every {suggestion.suggestedSchedule} days.
            </AlertDescription>
          </Alert>
        )}

        {/* Reasoning (collapsible) */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="h-auto p-0 text-sm font-medium"
          >
            <Info className="w-3 h-3 mr-1" />
            {showDetails ? 'Hide' : 'Show'} reasoning
          </Button>
          
          {showDetails && (
            <div className="mt-3 space-y-3">
              {/* Main reasoning */}
              <div>
                <h5 className="text-sm font-medium mb-2">Why this change?</h5>
                <ul className="space-y-1">
                  {suggestion.reasoning.map((reason, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Benefits */}
              {suggestion.potentialBenefits.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2">Potential benefits</h5>
                  <ul className="space-y-1">
                    {suggestion.potentialBenefits.map((benefit, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          {!wasApplied ? (
            <>
              <Button
                onClick={handleApply}
                disabled={isApplying}
                className="flex-1"
                size="sm"
              >
                {isApplying ? (
                  <>
                    <Clock className="w-3 h-3 mr-1 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    Apply {adjustmentText.charAt(0).toUpperCase() + adjustmentText.slice(1)}
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" className="px-3">
                Not Now
              </Button>
            </>
          ) : (
            <>
              {onRevert && (
                <Button
                  variant="outline"
                  onClick={handleRevert}
                  disabled={isReverting}
                  size="sm"
                  className="flex-1"
                >
                  {isReverting ? (
                    <>
                      <Clock className="w-3 h-3 mr-1 animate-spin" />
                      Reverting...
                    </>
                  ) : (
                    <>
                      <Undo2 className="w-3 h-3 mr-1" />
                      Revert Change
                    </>
                  )}
                </Button>
              )}
              <Button variant="ghost" size="sm" className="px-3">
                Dismiss
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduleAdjustmentCard;
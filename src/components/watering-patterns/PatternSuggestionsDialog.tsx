/**
 * Dialog for showing proactive pattern suggestions after watering
 */

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  X,
  Calendar,
  Lightbulb,
  Target
} from 'lucide-react';
import {
  PatternInsight,
  WateringPatternAnalysis
} from '@/types/wateringPatternTypes';
import { cn } from '@/lib/utils';
import WateringInsightLearnMore from './WateringInsightLearnMore';
import { useDismissedInsights } from '@/hooks/useDismissedInsights';

interface PatternSuggestionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: WateringPatternAnalysis | null;
  insights: PatternInsight[];
  plantName?: string;
  plantId?: string;
  onAcceptSuggestion?: (insight: PatternInsight) => void;
  onDismissAll?: () => void;
}

const PatternSuggestionsDialog = ({
  isOpen,
  onClose,
  analysis,
  insights,
  plantName = 'your plant',
  plantId,
  onAcceptSuggestion,
  onDismissAll,
}: PatternSuggestionsDialogProps) => {
  const [learnMoreInsight, setLearnMoreInsight] = useState<PatternInsight | null>(null);
  const { filterDismissed, dismissInsight } = useDismissedInsights(plantId);

  if (!analysis) return null;

  const activeInsights = useMemo(
    () => filterDismissed(insights),
    [filterDismissed, insights]
  );

  const handleDismissInsight = async (insight: PatternInsight) => {
    await dismissInsight(insight);
  };

  const handleAcceptSuggestion = (insight: PatternInsight) => {
    onAcceptSuggestion?.(insight);
    onClose();
  };

  const getPatternIcon = () => {
    switch (analysis.pattern) {
      case 'consistent':
        return CheckCircle;
      case 'early':
        return TrendingUp;
      case 'late':
        return Clock;
      case 'irregular':
        return Target;
      default:
        return Brain;
    }
  };

  const getPatternColor = () => {
    switch (analysis.pattern) {
      case 'consistent':
        return 'text-green-600 dark:text-green-400';
      case 'early':
        return 'text-blue-600 dark:text-blue-400';
      case 'late':
        return 'text-orange-600 dark:text-orange-400';
      case 'irregular':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getPatternMessage = () => {
    switch (analysis.pattern) {
      case 'consistent':
        return `Great job! You're watering ${plantName} consistently.`;
      case 'early':
        return `You tend to water ${plantName} earlier than scheduled.`;
      case 'late':
        return `You tend to water ${plantName} later than scheduled.`;
      case 'irregular':
        return `Your watering pattern for ${plantName} varies quite a bit.`;
      default:
        return `I've analyzed your watering pattern for ${plantName}.`;
    }
  };

  const PatternIcon = getPatternIcon();
  const hasActionableInsights = activeInsights.some(insight => insight.actionable);

  // Detect insufficient data scenarios
  const isInsufficientData = analysis.actualAverageInterval === 0 &&
    analysis.confidence === 'low' &&
    analysis.reasoning.some(r => r.includes('Need at least'));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sprout-pale dark:bg-sprout-dark/30 rounded-full">
              <Brain className="w-5 h-5 text-sprout-primary" />
            </div>
            <div>
              <DialogTitle>Smart Watering Insights</DialogTitle>
              <DialogDescription>
                Based on your watering pattern for {plantName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pattern Summary */}
          <div className="p-4 bg-gradient-to-r from-sprout-pale/50 to-sprout-cream/50 dark:from-sprout-dark/20 dark:to-sprout-dark/10 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <PatternIcon className={cn('w-5 h-5', getPatternColor())} />
              <div>
                <h3 className="font-medium">{getPatternMessage()}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {analysis.confidence} confidence
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Avg: {analysis.actualAverageInterval.toFixed(1)} days
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          {activeInsights.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                Suggestions for you
              </h4>

              {activeInsights.map((insight, index) => (
                <div key={`${insight.type}-${index}`} className="space-y-4">
                  <div className={cn(
                    'p-4 rounded-lg border',
                    insight.severity === 'high' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' :
                    insight.severity === 'medium' ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800' :
                    'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                  )}>
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-sm">{insight.title}</h5>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismissInsight(insight)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {insight.description}
                    </p>

                    {/* Schedule Adjustment Details */}
                    {insight.suggestion && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 bg-background/80 rounded border">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">Schedule Change</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <span className="text-muted-foreground">
                              {insight.suggestion.currentSchedule}d
                            </span>
                            {insight.suggestion.adjustmentType === 'increase' ? (
                              <TrendingUp className="w-3 h-3 text-green-600" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-blue-600" />
                            )}
                            <span className="font-medium">
                              {insight.suggestion.suggestedSchedule}d
                            </span>
                          </div>
                        </div>

                        {/* Top reasoning point */}
                        {insight.suggestion.reasoning[0] && (
                          <p className="text-xs text-muted-foreground bg-background/60 p-2 rounded border-l-2 border-sprout-primary">
                            {insight.suggestion.reasoning[0]}
                          </p>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptSuggestion(insight)}
                            className="flex-1"
                          >
                            Apply Change
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDismissInsight(insight)}
                            className="px-3"
                          >
                            Not Now
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Non-schedule actionable insights */}
                    {!insight.suggestion && insight.actionable && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setLearnMoreInsight(insight)}
                        >
                          Learn More
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDismissInsight(insight)}
                          className="px-3"
                        >
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>

                  {index < activeInsights.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          ) : isInsufficientData ? (
            <div className="text-center py-6">
              <Calendar className="w-12 h-12 text-sprout-primary mx-auto mb-3" />
              <h3 className="font-medium mb-2">Keep watering to unlock insights</h3>
              <p className="text-sm text-muted-foreground">
                Water {plantName} a few more times to see personalized pattern analysis.
                We need at least 3 watering records to provide meaningful insights.
              </p>
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-medium mb-2">You're doing great!</h3>
              <p className="text-sm text-muted-foreground">
                Your watering pattern looks good. Keep up the consistent care!
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {hasActionableInsights && onDismissAll && (
              <Button variant="outline" onClick={onDismissAll} className="flex-1">
                Dismiss All
              </Button>
            )}
            <Button onClick={onClose} className="flex-1">
              {hasActionableInsights ? 'Review Later' : 'Got It'}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Learn More Dialog */}
      <WateringInsightLearnMore
        isOpen={!!learnMoreInsight}
        onClose={() => setLearnMoreInsight(null)}
        insight={learnMoreInsight}
        plantName={plantName}
      />
    </Dialog>
  );
};

export default PatternSuggestionsDialog;
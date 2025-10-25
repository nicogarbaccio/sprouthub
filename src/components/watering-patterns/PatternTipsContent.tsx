/**
 * Shared content component for pattern insights
 * Used in both drawer (mobile) and dialog (desktop) contexts
 */

import { useState } from 'react';
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

interface PatternTipsContentProps {
  analysis: WateringPatternAnalysis | null;
  insights: PatternInsight[];
  plantName?: string;
  onAcceptSuggestion?: (insight: PatternInsight) => void;
  onDismissInsight?: (insight: PatternInsight, index: number) => void;
  onDismissAll?: () => void;
  onClose?: () => void;
  showPatternSummary?: boolean;
}

const PatternTipsContent = ({
  analysis,
  insights,
  plantName = 'your plant',
  onAcceptSuggestion,
  onDismissInsight,
  onDismissAll,
  onClose,
  showPatternSummary = true,
}: PatternTipsContentProps) => {
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());

  const activeInsights = insights.filter((insight, index) =>
    !dismissedInsights.has(`${insight.type}-${index}`)
  );

  const handleDismissInsight = (insight: PatternInsight, index: number) => {
    setDismissedInsights(prev => new Set([...prev, `${insight.type}-${index}`]));
    onDismissInsight?.(insight, index);
  };

  const handleAcceptSuggestion = (insight: PatternInsight) => {
    onAcceptSuggestion?.(insight);
  };

  const getPatternIcon = () => {
    if (!analysis) return Brain;
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
    if (!analysis) return 'text-muted-foreground';
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
    if (!analysis) return `Care tips for ${plantName}`;
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
  const isInsufficientData = analysis &&
    analysis.actualAverageInterval === 0 &&
    analysis.confidence === 'low' &&
    analysis.reasoning.some(r => r.includes('Need at least'));

  return (
    <div className="space-y-6">
      {/* Pattern Summary - only show if analysis exists and showPatternSummary is true */}
      {showPatternSummary && analysis && (
        <div className="p-4 bg-gradient-to-r from-sprout-pale/50 to-sprout-cream/50 dark:from-sprout-dark/20 dark:to-sprout-dark/10 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <PatternIcon className={cn('w-5 h-5', getPatternColor())} />
            <div className="flex-1">
              <h3 className="font-medium text-sm sm:text-base">{getPatternMessage()}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
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
      )}

      {/* Insights */}
      {activeInsights.length > 0 ? (
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
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
                  <h5 className="font-medium text-sm flex-1">{insight.title}</h5>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismissInsight(insight, index)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground ml-2 flex-shrink-0"
                    aria-label="Dismiss this tip"
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
                    <div className="flex flex-col sm:flex-row gap-2">
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
                        onClick={() => handleDismissInsight(insight, index)}
                        className="sm:px-3"
                      >
                        Not Now
                      </Button>
                    </div>
                  </div>
                )}

                {/* Non-schedule actionable insights */}
                {!insight.suggestion && insight.actionable && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Learn More
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismissInsight(insight, index)}
                      className="sm:px-3"
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
          <p className="text-sm text-muted-foreground px-4">
            Water {plantName} a few more times to see personalized pattern analysis.
            We need at least 3 watering records to provide meaningful insights.
          </p>
        </div>
      ) : (
        <div className="text-center py-6">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="font-medium mb-2">You're doing great!</h3>
          <p className="text-sm text-muted-foreground px-4">
            Your watering pattern looks good. Keep up the consistent care!
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
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
  );
};

export default PatternTipsContent;

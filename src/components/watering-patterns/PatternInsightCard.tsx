/**
 * Component for displaying individual pattern insights
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { PatternInsight } from '@/types/wateringPatternTypes';
import { cn } from '@/lib/utils';

interface PatternInsightCardProps {
  insight: PatternInsight;
  onAcceptSuggestion?: (insight: PatternInsight) => void;
  onDismiss?: (insight: PatternInsight) => void;
  className?: string;
}

const PatternInsightCard = ({
  insight,
  onAcceptSuggestion,
  onDismiss,
  className,
}: PatternInsightCardProps) => {
  const getInsightIcon = () => {
    switch (insight.type) {
      case 'schedule_adjustment':
        return insight.suggestion?.adjustmentType === 'increase' ? TrendingUp : TrendingDown;
      case 'consistency_improvement':
        return Target;
      case 'overwatering_risk':
        return AlertTriangle;
      case 'underwatering_risk':
        return AlertCircle;
      default:
        return Info;
    }
  };

  const getInsightColor = () => {
    switch (insight.severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getBorderColor = () => {
    switch (insight.severity) {
      case 'high':
        return 'border-red-200 dark:border-red-800';
      case 'medium':
        return 'border-orange-200 dark:border-orange-800';
      case 'low':
        return 'border-blue-200 dark:border-blue-800';
      default:
        return 'border-border';
    }
  };

  const getBackgroundColor = () => {
    switch (insight.severity) {
      case 'high':
        return 'bg-red-50 dark:bg-red-950/20';
      case 'medium':
        return 'bg-orange-50 dark:bg-orange-950/20';
      case 'low':
        return 'bg-blue-50 dark:bg-blue-950/20';
      default:
        return 'bg-background';
    }
  };

  const IconComponent = getInsightIcon();

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      getBorderColor(),
      getBackgroundColor(),
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-full',
              insight.severity === 'high' ? 'bg-red-100 dark:bg-red-900/30' :
              insight.severity === 'medium' ? 'bg-orange-100 dark:bg-orange-900/30' :
              'bg-blue-100 dark:bg-blue-900/30'
            )}>
              <IconComponent className={cn(
                'w-4 h-4',
                insight.severity === 'high' ? 'text-red-600 dark:text-red-400' :
                insight.severity === 'medium' ? 'text-orange-600 dark:text-orange-400' :
                'text-blue-600 dark:text-blue-400'
              )} />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
              <Badge variant={getInsightColor()} className="mt-1 text-xs">
                {insight.type.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(insight)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              ×
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-4">
          {insight.description}
        </p>

        {/* Schedule adjustment details */}
        {insight.suggestion && (
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Schedule Change</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">
                  {insight.suggestion.currentSchedule} days
                </span>
                <span className="mx-2">→</span>
                <span className="font-medium text-sprout-primary">
                  {insight.suggestion.suggestedSchedule} days
                </span>
              </div>
            </div>

            {/* Reasoning */}
            {insight.suggestion.reasoning.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Why this change?</h4>
                <ul className="space-y-1">
                  {insight.suggestion.reasoning.map((reason, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="w-1 h-1 bg-current rounded-full mt-1.5 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Potential benefits */}
            {insight.suggestion.potentialBenefits.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Potential benefits</h4>
                <ul className="space-y-1">
                  {insight.suggestion.potentialBenefits.map((benefit, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Confidence indicator */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Confidence:</span>
              <Badge 
                variant={
                  insight.suggestion.confidence === 'high' ? 'default' :
                  insight.suggestion.confidence === 'medium' ? 'secondary' :
                  'outline'
                }
                className="text-xs"
              >
                {insight.suggestion.confidence}
              </Badge>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {insight.actionable && (
          <div className="flex gap-2">
            {insight.suggestion && onAcceptSuggestion && (
              <Button
                size="sm"
                onClick={() => onAcceptSuggestion(insight)}
                className="flex-1"
              >
                Apply {insight.suggestion.adjustmentType === 'increase' ? 'Extension' : 'Shortening'}
              </Button>
            )}
            
            {!insight.suggestion && insight.type === 'consistency_improvement' && (
              <Button size="sm" variant="outline" className="flex-1">
                Set Reminder
              </Button>
            )}
            
            {onDismiss && (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => onDismiss(insight)}
                className="px-3"
              >
                Dismiss
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatternInsightCard;
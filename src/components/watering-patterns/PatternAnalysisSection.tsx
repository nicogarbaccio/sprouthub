/**
 * Component for displaying comprehensive pattern analysis in watering history
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  BarChart3, 
  Clock, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Brain,
  Lightbulb
} from 'lucide-react';
import { 
  WateringPatternAnalysis, 
  PatternInsight, 
  PatternAnalysisStats 
} from '@/types/wateringPatternTypes';
import PatternInsightCard from './PatternInsightCard';
import { cn } from '@/lib/utils';

interface PatternAnalysisSectionProps {
  analysis: WateringPatternAnalysis;
  insights: PatternInsight[];
  stats: PatternAnalysisStats | null;
  isLoading?: boolean;
  onAcceptSuggestion?: (insight: PatternInsight) => void;
  onDismissInsight?: (insight: PatternInsight) => void;
  onRefreshAnalysis?: () => void;
  className?: string;
}

const PatternAnalysisSection = ({
  analysis,
  insights,
  stats,
  isLoading = false,
  onAcceptSuggestion,
  onDismissInsight,
  onRefreshAnalysis,
  className,
}: PatternAnalysisSectionProps) => {
  const getPatternIcon = () => {
    switch (analysis.pattern) {
      case 'consistent':
        return CheckCircle;
      case 'early':
        return TrendingUp;
      case 'late':
        return Clock;
      case 'irregular':
        return AlertTriangle;
      default:
        return Target;
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

  const getPatternLabel = () => {
    switch (analysis.pattern) {
      case 'consistent':
        return 'Consistent';
      case 'early':
        return 'Early Watering';
      case 'late':
        return 'Late Watering';
      case 'irregular':
        return 'Irregular';
      default:
        return 'Unknown';
    }
  };

  const getConfidenceBadgeVariant = () => {
    switch (analysis.confidence) {
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

  const PatternIcon = getPatternIcon();
  const hasInsights = insights.length > 0;
  const hasInsufficientData = analysis.reasoning.some(r => r.includes('Need at least'));

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Analysis Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-sprout-primary" />
              Watering Pattern Analysis
            </CardTitle>
            {onRefreshAnalysis && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onRefreshAnalysis}
                disabled={isLoading}
              >
                {isLoading ? 'Analyzing...' : 'Refresh'}
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Pattern Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pattern Type */}
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <PatternIcon className={cn('w-5 h-5', getPatternColor())} />
              <div>
                <p className="text-sm font-medium">{getPatternLabel()}</p>
                <p className="text-xs text-muted-foreground">Pattern Type</p>
              </div>
            </div>

            {/* Average Interval */}
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium">
                  {analysis.actualAverageInterval.toFixed(1)} days
                </p>
                <p className="text-xs text-muted-foreground">Actual Average</p>
              </div>
            </div>

            {/* Confidence */}
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div>
                <Badge variant={getConfidenceBadgeVariant()}>
                  {analysis.confidence}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Confidence</p>
              </div>
            </div>
          </div>

          {/* Schedule Comparison */}
          {!hasInsufficientData && (
            <div className="p-4 bg-gradient-to-r from-sprout-pale/50 to-sprout-cream/50 dark:from-sprout-dark/30 dark:to-sprout-dark/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Schedule Comparison</h4>
                {analysis.suggestedAdjustment && analysis.suggestedAdjustment !== analysis.currentSchedule && (
                  <Badge variant="secondary" className="text-xs">
                    Adjustment Available
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Current Schedule</p>
                  <p className="text-lg font-semibold">{analysis.currentSchedule} days</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Your Average</p>
                  <p className="text-lg font-semibold">{analysis.actualAverageInterval.toFixed(1)} days</p>
                </div>
              </div>

              {analysis.suggestedAdjustment && analysis.suggestedAdjustment !== analysis.currentSchedule && (
                <div className="mt-3 pt-3 border-t border-white/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Suggested Schedule</p>
                      <p className="text-lg font-semibold text-sprout-primary">
                        {analysis.suggestedAdjustment} days
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {analysis.suggestedAdjustment > analysis.currentSchedule ? '+' : ''}
                      {analysis.suggestedAdjustment - analysis.currentSchedule} days
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reasoning */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Analysis Insights
            </h4>
            <ul className="space-y-2">
              {analysis.reasoning.map((reason, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-sprout-primary rounded-full mt-2 flex-shrink-0" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {/* Detailed Statistics */}
          {stats && stats.recordsUsed > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Analysis Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Records Used</p>
                  <p className="font-medium">{stats.recordsUsed}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Time Span</p>
                  <p className="font-medium">{stats.timeSpanDays} days</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Std Deviation</p>
                  <p className="font-medium">{stats.standardDeviation.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Range</p>
                  <p className="font-medium">{stats.minInterval.toFixed(1)} - {stats.maxInterval.toFixed(1)}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights Section */}
      {hasInsights && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Smart Suggestions
          </h3>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <PatternInsightCard
                key={`${insight.type}-${index}`}
                insight={insight}
                onAcceptSuggestion={onAcceptSuggestion}
                onDismiss={onDismissInsight}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Insights Message */}
      {!hasInsights && !hasInsufficientData && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Great watering habits!</h3>
            <p className="text-muted-foreground">
              Your watering pattern looks good. Keep up the consistent care!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Insufficient Data Message */}
      {hasInsufficientData && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <BarChart3 className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Building your pattern...</h3>
            <p className="text-muted-foreground mb-4">
              Keep tracking your watering to unlock personalized insights and schedule suggestions.
            </p>
            <div className="text-sm text-muted-foreground">
              {analysis.reasoning.map((reason, index) => (
                <p key={index}>{reason}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PatternAnalysisSection;
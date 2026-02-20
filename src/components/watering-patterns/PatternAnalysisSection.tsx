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
        return 'text-emerald-600 dark:text-emerald-400';
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

  const getPatternBg = () => {
    switch (analysis.pattern) {
      case 'consistent':
        return 'bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-300/30 dark:border-emerald-500/20';
      case 'early':
        return 'bg-gradient-to-br from-blue-500/15 to-blue-500/5 border border-blue-300/30 dark:border-blue-500/20';
      case 'late':
        return 'bg-gradient-to-br from-orange-500/15 to-orange-500/5 border border-orange-300/30 dark:border-orange-500/20';
      case 'irregular':
        return 'bg-gradient-to-br from-red-500/15 to-red-500/5 border border-red-300/30 dark:border-red-500/20';
      default:
        return 'bg-gradient-to-br from-gray-500/10 to-gray-500/5 border border-gray-300/30';
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
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-sprout-pale/30 to-transparent dark:from-sprout-dark/20 dark:to-transparent border-b border-sprout-cream/10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-500/40 flex items-center justify-center">
                <Brain className="w-4 h-4 text-violet-500 dark:text-violet-400" />
              </div>
              Watering Pattern Analysis
            </CardTitle>
            {onRefreshAnalysis && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefreshAnalysis}
                disabled={isLoading}
                className="text-xs"
              >
                {isLoading ? 'Analyzing...' : 'Refresh'}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Pattern Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pattern Type */}
            <div className={cn('flex items-center gap-3 p-4 rounded-xl shadow-sm', getPatternBg())}>
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center',
                analysis.pattern === 'consistent' ? 'bg-emerald-500/20' :
                analysis.pattern === 'early' ? 'bg-blue-500/20' :
                analysis.pattern === 'late' ? 'bg-orange-500/20' :
                analysis.pattern === 'irregular' ? 'bg-red-500/20' : 'bg-gray-500/20'
              )}>
                <PatternIcon className={cn('w-5 h-5', getPatternColor())} />
              </div>
              <div>
                <p className={cn('text-sm font-semibold', getPatternColor())}>{getPatternLabel()}</p>
                <p className="text-xs text-muted-foreground">Pattern Type</p>
              </div>
            </div>

            {/* Average Interval */}
            <div className="flex items-center gap-3 p-4 rounded-xl shadow-sm bg-gradient-to-br from-blue-500/15 to-blue-500/5 border border-blue-300/30 dark:border-blue-500/20">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {analysis.actualAverageInterval.toFixed(1)} days
                </p>
                <p className="text-xs text-muted-foreground">Actual Average</p>
              </div>
            </div>

            {/* Confidence */}
            <div className="flex items-center gap-3 p-4 rounded-xl shadow-sm bg-gradient-to-br from-violet-500/15 to-violet-500/5 border border-violet-300/30 dark:border-violet-500/20">
              <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <Badge variant={getConfidenceBadgeVariant()} className="font-semibold">
                  {analysis.confidence}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Confidence</p>
              </div>
            </div>
          </div>

          {/* Schedule Comparison */}
          {!hasInsufficientData && (
            <div className="p-5 bg-gradient-to-r from-sprout-pale/50 to-sprout-cream/30 dark:from-sprout-dark/30 dark:to-sprout-dark/10 rounded-xl border border-sprout-cream/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sprout-primary" />
                  Schedule Comparison
                </h4>
                {analysis.suggestedAdjustment && analysis.suggestedAdjustment !== analysis.currentSchedule && (
                  <Badge variant="secondary" className="text-xs bg-sprout-water/10 text-sprout-water border-sprout-water/20">
                    Adjustment Available
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-white/40 dark:bg-white/5">
                  <p className="text-xs text-muted-foreground mb-1">Current Schedule</p>
                  <p className="text-2xl font-bold">{analysis.currentSchedule} <span className="text-sm font-normal text-muted-foreground">days</span></p>
                </div>
                <div className="p-3 rounded-lg bg-white/40 dark:bg-white/5">
                  <p className="text-xs text-muted-foreground mb-1">Your Average</p>
                  <p className="text-2xl font-bold">{analysis.actualAverageInterval.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">days</span></p>
                </div>
              </div>

              {analysis.suggestedAdjustment && analysis.suggestedAdjustment !== analysis.currentSchedule && (
                <div className="mt-4 pt-4 border-t border-sprout-cream/20">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-sprout-water/10 border border-sprout-water/20">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Suggested Schedule</p>
                      <p className="text-lg font-bold text-sprout-water">
                        {analysis.suggestedAdjustment} days
                      </p>
                    </div>
                    <Badge className="bg-sprout-water/20 text-sprout-water border-sprout-water/30">
                      {analysis.suggestedAdjustment > analysis.currentSchedule ? '+' : ''}
                      {analysis.suggestedAdjustment - analysis.currentSchedule} days
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reasoning */}
          <div className="p-5 rounded-xl bg-gradient-to-b from-amber-500/5 to-transparent border border-amber-300/20 dark:border-amber-500/10">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-500/20 flex items-center justify-center">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              </div>
              Analysis Insights
            </h4>
            <ul className="space-y-2.5">
              {analysis.reasoning.map((reason, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-3">
                  <span className="w-2 h-2 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {/* Detailed Statistics */}
          {stats && stats.recordsUsed > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                Analysis Statistics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/30 border border-muted/50">
                  <p className="text-xs text-muted-foreground mb-0.5">Records Used</p>
                  <p className="font-semibold text-base">{stats.recordsUsed}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-muted/50">
                  <p className="text-xs text-muted-foreground mb-0.5">Time Span</p>
                  <p className="font-semibold text-base">{stats.timeSpanDays} days</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-muted/50">
                  <p className="text-xs text-muted-foreground mb-0.5">Std Deviation</p>
                  <p className="font-semibold text-base">{stats.standardDeviation.toFixed(1)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-muted/50">
                  <p className="text-xs text-muted-foreground mb-0.5">Range</p>
                  <p className="font-semibold text-base">{stats.minInterval.toFixed(1)} - {stats.maxInterval.toFixed(1)}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights Section */}
      {hasInsights && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-500/40 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-orange-500" />
            </div>
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
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center bg-gradient-to-b from-emerald-500/5 to-transparent">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Great watering habits!</h3>
            <p className="text-muted-foreground max-w-sm">
              Your watering pattern looks good. Keep up the consistent care!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Insufficient Data Message */}
      {hasInsufficientData && (
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center bg-gradient-to-b from-blue-500/5 to-transparent">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Building your pattern...</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Keep tracking your watering to unlock personalized insights and schedule suggestions.
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
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
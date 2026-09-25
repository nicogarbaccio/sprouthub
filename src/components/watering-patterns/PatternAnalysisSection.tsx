/**
 * Component for displaying comprehensive pattern analysis in watering history
 */

import {
  TrendingUp,
  BarChart3,
  Clock,
  Target,
  CheckCircle,
  Brain,
  RefreshCw,
} from 'lucide-react';
import { 
  WateringPatternAnalysis, 
  PatternInsight, 
  PatternAnalysisStats 
} from '@/types/wateringPatternTypes';
import PatternInsightCard from './PatternInsightCard';
import { capitalize, cn } from '@/lib/utils';

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
  const pattern = PATTERN_TILE[analysis.pattern] ?? PATTERN_TILE.unknown;
  const PatternIcon = pattern.icon;
  const hasInsights = insights.length > 0;
  const hasInsufficientData = analysis.reasoning.some(r => r.includes('Need at least'));
  const adjustment =
    analysis.suggestedAdjustment && analysis.suggestedAdjustment !== analysis.currentSchedule
      ? analysis.suggestedAdjustment
      : null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2 px-1.5">
        <h3 className="flex items-center gap-2 text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground">
          <Brain className="w-4 h-4" />
          Watering pattern
        </h3>
        {onRefreshAnalysis && (
          <button
            type="button"
            onClick={onRefreshAnalysis}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-card text-foreground text-[13px] font-bold disabled:opacity-60"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            {isLoading ? 'Analyzing...' : 'Refresh'}
          </button>
        )}
      </div>

      {hasInsufficientData ? (
        <div className="rounded-3xl bg-card p-5 flex items-start gap-3.5">
          <div className="w-11 h-11 shrink-0 rounded-[14px] bg-field text-foreground flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-foreground">Building your pattern...</p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-1">
              Keep tracking your watering to unlock personalized insights and schedule suggestions.
            </p>
            {analysis.reasoning.map((reason, index) => (
              <p key={index} className="text-[13px] text-muted-foreground mt-1">{reason}</p>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Pattern overview */}
          <div className="grid grid-cols-2 gap-2">
            <div className={cn('col-span-2 rounded-3xl p-4 flex items-center gap-3', pattern.classes)}>
              <div className="w-11 h-11 shrink-0 rounded-[14px] bg-sprout-dark/10 flex items-center justify-center">
                <PatternIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-lg font-bold tracking-[-0.02em]">{pattern.label}</p>
                <p className="text-[13px] font-semibold">{capitalize(analysis.confidence)} confidence</p>
              </div>
            </div>
            <div className="rounded-[22px] bg-card p-3.5">
              <div className="text-xs font-bold uppercase tracking-[0.8px] text-muted-foreground">Schedule</div>
              <div className="font-display text-lg font-bold text-foreground mt-1">{analysis.currentSchedule} days</div>
            </div>
            <div className="rounded-[22px] bg-card p-3.5">
              <div className="text-xs font-bold uppercase tracking-[0.8px] text-muted-foreground">Your average</div>
              <div className="font-display text-lg font-bold text-foreground mt-1">
                {analysis.actualAverageInterval.toFixed(1)} days
              </div>
            </div>
            {adjustment && (
              <div className="col-span-2 rounded-[22px] bg-sprout-water text-sprout-dark p-3.5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.8px]">Suggested schedule</div>
                  <div className="font-display text-lg font-bold mt-1">{adjustment} days</div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sprout-dark text-sprout-cream">
                  {adjustment > analysis.currentSchedule ? '+' : ''}
                  {adjustment - analysis.currentSchedule} days
                </span>
              </div>
            )}
          </div>

          {/* Reasoning and statistics */}
          <div className="rounded-3xl bg-card p-4">
            <h4 className="text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground">What we noticed</h4>
            <ul className="space-y-2 mt-2.5">
              {analysis.reasoning.map((reason, index) => (
                <li key={index} className="text-sm text-foreground leading-snug flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sprout-light mt-1.5 shrink-0" aria-hidden="true" />
                  {reason}
                </li>
              ))}
            </ul>

            {stats && stats.recordsUsed > 0 && (
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                {[
                  ['Records used', stats.recordsUsed],
                  ['Time span', `${stats.timeSpanDays} days`],
                  ['Std deviation', stats.standardDeviation.toFixed(1)],
                  ['Range', `${stats.minInterval.toFixed(1)}–${stats.maxInterval.toFixed(1)}`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[16px] bg-field px-3 py-2.5">
                    <dt className="text-[11px] font-bold uppercase tracking-[0.6px] text-muted-foreground">{label}</dt>
                    <dd className="text-[15px] font-bold text-foreground mt-0.5">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {hasInsights ? (
            <>
              <h4 className="text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground px-1.5 pt-2">
                Smart suggestions
              </h4>
              {insights.map((insight, index) => (
                <PatternInsightCard
                  key={`${insight.type}-${index}`}
                  insight={insight}
                  onAcceptSuggestion={onAcceptSuggestion}
                  onDismiss={onDismissInsight}
                />
              ))}
            </>
          ) : (
            <div className="rounded-3xl bg-card p-5 flex items-start gap-3.5">
              <div className="w-11 h-11 shrink-0 rounded-[14px] bg-sprout-success text-sprout-dark flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-foreground">Great watering habits!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your watering pattern looks good. Keep up the consistent care!
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const PATTERN_TILE: Record<string, { label: string; icon: React.ElementType; classes: string }> = {
  consistent: { label: 'Consistent', icon: CheckCircle, classes: 'bg-sprout-success text-sprout-dark' },
  early: { label: 'Watering early', icon: TrendingUp, classes: 'bg-sprout-water text-sprout-dark' },
  late: { label: 'Watering late', icon: Clock, classes: 'bg-sprout-warning text-sprout-dark' },
  irregular: { label: 'Irregular', icon: Target, classes: 'bg-sprout-cream text-sprout-dark' },
  unknown: { label: 'Unknown', icon: Target, classes: 'bg-card text-foreground' },
};

export default PatternAnalysisSection;

/**
 * Shared content component for pattern insights
 * Rendered inside PatternTipsModal, which PatternSuggestionsDialog also wraps
 */

import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  TrendingUp,
  Clock,
  CheckCircle,
  X,
  Calendar,
  Lightbulb,
  Target
} from 'lucide-react';
import { sheetPrimaryButtonClasses, sheetSecondaryButtonClasses } from '@/components/ui/bento-sheet';
import {
  PatternInsight,
  WateringPatternAnalysis
} from '@/types/wateringPatternTypes';
import { capitalize, cn } from '@/lib/utils';
import WateringInsightLearnMore from './WateringInsightLearnMore';
import { useDismissedInsights } from '@/hooks/useDismissedInsights';

interface PatternTipsContentProps {
  analysis: WateringPatternAnalysis | null;
  insights: PatternInsight[];
  plantName?: string;
  plantId?: string;
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
  plantId,
  onAcceptSuggestion,
  onDismissInsight,
  onDismissAll,
  onClose,
  showPatternSummary = true,
}: PatternTipsContentProps) => {
  const [learnMoreInsight, setLearnMoreInsight] = useState<PatternInsight | null>(null);
  const { filterDismissed, dismissInsight } = useDismissedInsights(plantId);

  const activeInsights = useMemo(
    () => filterDismissed(insights),
    [filterDismissed, insights]
  );

  const handleDismissInsight = async (insight: PatternInsight, index: number) => {
    await dismissInsight(insight);
    onDismissInsight?.(insight, index);
  };

  const handleAcceptSuggestion = (insight: PatternInsight) => {
    onAcceptSuggestion?.(insight);
  };

  // Detect insufficient data scenarios. A plant without enough watering history
  // is stamped pattern: 'irregular' by the analyzer, so the pattern-based helpers
  // below must special-case it to avoid the alarming "varies quite a bit" label.
  const isInsufficientData = analysis &&
    analysis.actualAverageInterval === 0 &&
    analysis.confidence === 'low' &&
    analysis.reasoning.some(r => r.includes('Need at least'));

  const summary = patternSummary(analysis, !!isInsufficientData, plantName);
  const SummaryIcon = summary.icon;
  const hasActionableInsights = activeInsights.some(insight => insight.actionable);
  const empty = emptyState(analysis, !!isInsufficientData, plantName);
  const EmptyIcon = empty.icon;

  return (
    <div className="space-y-2">
      {/* Pattern summary - only show if analysis exists and showPatternSummary is true */}
      {showPatternSummary && analysis && (
        <div className={cn('rounded-3xl p-4 flex items-start gap-3', summary.classes)}>
          <div className="w-11 h-11 shrink-0 rounded-[14px] bg-sprout-dark/10 flex items-center justify-center">
            <SummaryIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-bold leading-snug">{summary.message}</h3>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full border-[1.5px] border-current">
                {capitalize(analysis.confidence)} confidence
              </span>
              {analysis.actualAverageInterval > 0 && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full border-[1.5px] border-current">
                  Every ~{analysis.actualAverageInterval.toFixed(1)} days
                </span>
              )}
            </div>
            {analysis.analysisWindowNote && (
              <p className="text-[13px] font-medium opacity-80 mt-2">{analysis.analysisWindowNote}</p>
            )}
          </div>
        </div>
      )}

      {/* Insights */}
      {activeInsights.length > 0 ? (
        <>
          <h4 className="text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground px-1.5 pt-2">
            Suggestions for you
          </h4>

          {activeInsights.map((insight, index) => {
            const tone = SEVERITY_TONE[insight.severity] ?? SEVERITY_TONE.low;
            const ToneIcon = tone.icon;
            return (
              <div key={`${insight.type}-${index}`} className="rounded-3xl bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className={cn('w-10 h-10 shrink-0 rounded-[14px] flex items-center justify-center text-sprout-dark', tone.classes)}>
                    <ToneIcon className="w-5 h-5" />
                  </div>
                  <h5 className="flex-1 min-w-0 text-[15px] font-bold text-foreground leading-snug pt-2">{insight.title}</h5>
                  <button
                    type="button"
                    onClick={() => handleDismissInsight(insight, index)}
                    className="w-9 h-9 shrink-0 rounded-xl bg-field text-muted-foreground hover:text-foreground flex items-center justify-center"
                    aria-label="Dismiss this tip"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mt-2.5">{insight.description}</p>

                {/* Schedule adjustment details */}
                {insight.suggestion && (
                  <>
                    <div className="flex items-center justify-between gap-3 mt-3 rounded-[18px] bg-field px-4 py-3">
                      <span className="text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground">Schedule</span>
                      <span className="flex items-center gap-2 font-display font-bold text-foreground">
                        <span className="text-muted-foreground">{insight.suggestion.currentSchedule}d</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <span className="text-lg">{insight.suggestion.suggestedSchedule}d</span>
                      </span>
                    </div>

                    {insight.suggestion.reasoning[0] && (
                      <p className="text-[13px] text-muted-foreground leading-relaxed mt-2 px-1">
                        {insight.suggestion.reasoning[0]}
                      </p>
                    )}

                    <div className="flex gap-2 mt-3">
                      <button type="button" onClick={() => handleDismissInsight(insight, index)} className={cn(smallSecondary, 'flex-1')}>
                        Not Now
                      </button>
                      <button type="button" onClick={() => handleAcceptSuggestion(insight)} className={cn(smallPrimary, 'flex-[1.4]')}>
                        Apply Change
                      </button>
                    </div>
                  </>
                )}

                {/* Non-schedule actionable insights */}
                {!insight.suggestion && insight.actionable && (
                  <div className="flex gap-2 mt-3">
                    <button type="button" onClick={() => handleDismissInsight(insight, index)} className={cn(smallSecondary, 'flex-1')}>
                      Dismiss
                    </button>
                    <button type="button" onClick={() => setLearnMoreInsight(insight)} className={cn(smallPrimary, 'flex-[1.4]')}>
                      Learn More
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </>
      ) : (
        <div className="rounded-3xl bg-card p-5 flex items-start gap-3.5">
          <div className={cn('w-11 h-11 shrink-0 rounded-[14px] flex items-center justify-center', empty.iconClasses)}>
            <EmptyIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-bold text-foreground">{empty.title}</h3>
            {empty.body.map((line, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed mt-1">{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        {hasActionableInsights && onDismissAll && (
          <button type="button" onClick={onDismissAll} className={cn(sheetSecondaryButtonClasses, 'flex-1')}>
            Dismiss All
          </button>
        )}
        <button type="button" onClick={onClose} className={cn(sheetPrimaryButtonClasses, 'flex-[1.3]')}>
          {hasActionableInsights ? 'Review Later' : 'Got It'}
        </button>
      </div>

      {/* Learn More Dialog */}
      <WateringInsightLearnMore
        isOpen={!!learnMoreInsight}
        onClose={() => setLearnMoreInsight(null)}
        insight={learnMoreInsight}
        plantName={plantName}
      />
    </div>
  );
};

const smallPrimary =
  'h-12 rounded-[18px] bg-sprout-dark text-sprout-cream font-bold text-sm shadow-[inset_0_0_0_2px_#dfc490] hover:bg-sprout-dark/90';
const smallSecondary = 'h-12 rounded-[18px] bg-field text-foreground font-bold text-sm hover:bg-field/70';

/** Icon square colour for an insight, by how much it matters */
const SEVERITY_TONE: Record<string, { classes: string; icon: React.ElementType }> = {
  high: { classes: 'bg-sprout-warning', icon: AlertTriangle },
  medium: { classes: 'bg-sprout-cream', icon: Lightbulb },
  low: { classes: 'bg-sprout-water', icon: Lightbulb },
};

function patternSummary(analysis: WateringPatternAnalysis | null, insufficient: boolean, plantName: string) {
  if (!analysis) return { icon: Brain, classes: 'bg-card text-foreground', message: `Care tips for ${plantName}` };
  if (insufficient) {
    return { icon: Calendar, classes: 'bg-card text-foreground', message: `Still learning ${plantName}'s watering pattern.` };
  }
  switch (analysis.pattern) {
    case 'consistent':
      return { icon: CheckCircle, classes: 'bg-sprout-success text-sprout-dark', message: `Great job! You're watering ${plantName} consistently.` };
    case 'early':
      return { icon: TrendingUp, classes: 'bg-sprout-water text-sprout-dark', message: `You tend to water ${plantName} earlier than scheduled.` };
    case 'late':
      return { icon: Clock, classes: 'bg-sprout-warning text-sprout-dark', message: `You tend to water ${plantName} later than scheduled.` };
    case 'irregular':
      return { icon: Target, classes: 'bg-sprout-cream text-sprout-dark', message: `Your watering pattern for ${plantName} varies quite a bit.` };
    default:
      return { icon: Brain, classes: 'bg-card text-foreground', message: `I've analyzed your watering pattern for ${plantName}.` };
  }
}

/** What to say when there are no suggestions left to show */
function emptyState(analysis: WateringPatternAnalysis | null, insufficient: boolean, plantName: string) {
  if (insufficient) {
    return {
      icon: Calendar,
      iconClasses: 'bg-field text-foreground',
      title: 'Keep watering to unlock insights',
      body: [`Water ${plantName} a few more times to see personalized pattern analysis. We need at least 3 watering records to provide meaningful insights.`],
    };
  }
  if (analysis?.pattern === 'consistent') {
    return {
      icon: CheckCircle,
      iconClasses: 'bg-sprout-success text-sprout-dark',
      title: "You're doing great!",
      body: ['Your watering pattern looks good. Keep up the consistent care!'],
    };
  }
  if (analysis?.pattern === 'late') {
    const body = [
      (analysis.healthObservationContext?.stressedCount ?? 0) > 0
        ? `${plantName} showed signs of stress during some late waterings — keeping the current schedule for now. Try setting a reminder to water on time.`
        : (analysis.healthObservationContext?.healthyCount ?? 0) > 0
        ? `${plantName} has looked okay when watered late. A couple more healthy observations and we can give a firmer recommendation.`
        : `You've been watering ${plantName} later than scheduled. Next time you water late, let us know how the plant looked — that helps us decide whether to adjust the schedule.`,
    ];
    const postponed = analysis.postponementContext;
    if ((postponed?.count ?? 0) >= 2) {
      body.push(
        postponed!.isSignificant
          ? `You've also postponed watering ${postponed!.count} times recently — strong evidence the current schedule may be more frequent than ${plantName} needs. We just need a bit more data to confirm.`
          : `You've also postponed watering ${postponed!.count} times recently. If you're checking the soil each time and finding it still moist, that's a good signal the schedule might need adjusting.`
      );
    }
    return { icon: Clock, iconClasses: 'bg-sprout-warning text-sprout-dark', title: 'Watering a bit late', body };
  }
  if (analysis?.pattern === 'early') {
    return {
      icon: TrendingUp,
      iconClasses: 'bg-sprout-water text-sprout-dark',
      title: 'Watering a bit early',
      body: [`You've been watering ${plantName} earlier than scheduled. That's often fine, but watch for signs of overwatering like yellowing leaves or soggy soil.`],
    };
  }
  return {
    icon: Target,
    iconClasses: 'bg-field text-foreground',
    title: 'Pattern still forming',
    body: ["Your watering timing has been variable. Keep tracking — once a clearer pattern emerges, we'll be able to give better guidance."],
  };
}

export default PatternTipsContent;

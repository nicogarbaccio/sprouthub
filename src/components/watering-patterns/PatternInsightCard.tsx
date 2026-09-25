/**
 * One pattern insight in the watering history, with its full reasoning and benefits
 */

import {
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle,
  AlertCircle,
  Info,
  X,
} from 'lucide-react';
import { PatternInsight } from '@/types/wateringPatternTypes';
import { capitalize, cn } from '@/lib/utils';

interface PatternInsightCardProps {
  insight: PatternInsight;
  onAcceptSuggestion?: (insight: PatternInsight) => void;
  onDismiss?: (insight: PatternInsight) => void;
  className?: string;
}

const TYPE_LABEL: Record<string, string> = {
  schedule_adjustment: 'Schedule',
  consistency_improvement: 'Consistency',
  overwatering_risk: 'Overwatering risk',
  underwatering_risk: 'Underwatering risk',
};

/** Icon square colour by how much the insight matters */
const SEVERITY_CLASSES: Record<string, string> = {
  high: 'bg-sprout-warning',
  medium: 'bg-sprout-cream',
  low: 'bg-sprout-water',
};

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

  const IconComponent = getInsightIcon();
  const suggestion = insight.suggestion;

  return (
    <div className={cn('rounded-3xl bg-card p-4', className)}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-10 h-10 shrink-0 rounded-[14px] text-sprout-dark flex items-center justify-center',
            SEVERITY_CLASSES[insight.severity] ?? SEVERITY_CLASSES.low
          )}
        >
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-foreground leading-snug">{insight.title}</p>
          <p className="text-xs font-bold tracking-[0.6px] uppercase text-muted-foreground mt-0.5">
            {TYPE_LABEL[insight.type] ?? insight.type.replace(/_/g, ' ')}
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={() => onDismiss(insight)}
            className="w-9 h-9 shrink-0 rounded-xl bg-field text-muted-foreground hover:text-foreground flex items-center justify-center"
            aria-label="Dismiss this suggestion"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mt-2.5">{insight.description}</p>

      {suggestion && (
        <>
          <div className="flex items-center justify-between gap-3 mt-3 rounded-[18px] bg-field px-4 py-3">
            <span className="text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground">Schedule</span>
            <span className="flex items-center gap-2 font-display font-bold text-foreground">
              <span className="text-muted-foreground">{suggestion.currentSchedule}d</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <span className="text-lg">{suggestion.suggestedSchedule}d</span>
            </span>
          </div>

          {suggestion.reasoning.length > 0 && (
            <div className="mt-3">
              <p className="text-[13px] font-bold text-foreground">Why this change?</p>
              <ul className="space-y-1 mt-1">
                {suggestion.reasoning.map((reason, index) => (
                  <li key={index} className="text-[13px] text-muted-foreground flex items-start gap-2">
                    <span className="w-1 h-1 bg-current rounded-full mt-2 shrink-0" aria-hidden="true" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {suggestion.potentialBenefits.length > 0 && (
            <div className="mt-3">
              <p className="text-[13px] font-bold text-foreground">Potential benefits</p>
              <ul className="space-y-1 mt-1">
                {suggestion.potentialBenefits.map((benefit, index) => (
                  <li key={index} className="text-[13px] text-muted-foreground flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-sprout-success mt-0.5 shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <span className="inline-flex mt-3 text-xs font-bold px-2.5 py-1 rounded-full bg-field text-foreground">
            {capitalize(suggestion.confidence)} confidence
          </span>
        </>
      )}

      {insight.actionable && (suggestion && onAcceptSuggestion || onDismiss) && (
        <div className="flex gap-2 mt-3">
          {onDismiss && (
            <button
              type="button"
              onClick={() => onDismiss(insight)}
              className="flex-1 h-12 rounded-[18px] bg-field text-foreground font-bold text-sm hover:bg-field/70"
            >
              Dismiss
            </button>
          )}
          {suggestion && onAcceptSuggestion && (
            <button
              type="button"
              onClick={() => onAcceptSuggestion(insight)}
              className="flex-[1.4] h-12 rounded-[18px] bg-sprout-dark text-sprout-cream font-bold text-sm shadow-[inset_0_0_0_2px_#dfc490] hover:bg-sprout-dark/90"
            >
              Apply {suggestion.adjustmentType === 'increase' ? 'Extension' : 'Shortening'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PatternInsightCard;

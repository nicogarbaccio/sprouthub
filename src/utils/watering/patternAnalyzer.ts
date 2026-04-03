/**
 * Core watering pattern analysis service
 * Analyzes user watering behavior and suggests schedule adjustments
 */

import {
  WateringPatternAnalysis,
  WateringPatternData,
  WateringRecordForAnalysis,
  PatternAnalysisResult,
  ScheduleAdjustmentSuggestion,
  PatternInsight,
  PatternAnalysisOptions,
  PatternAnalysisStats,
} from '@/types/wateringPatternTypes';
import { LATE_HEALTHY_PREFIX, LATE_STRESSED_PREFIX, POSTPONEMENT_PREFIX } from '@/utils/watering/notesPrefixes';

const DEFAULT_OPTIONS: Required<PatternAnalysisOptions> = {
  minRecords: 3,
  analysisWindowDays: 60,
  consistencyThreshold: 0.8,
  earlyLateThresholdDays: 1.5, // More sensitive to detect early/late patterns
};

/** Internal structure returned by analyzePostponementSignal */
interface PostponementSignal {
  count: number;
  averageDelayDays: number;
  delaysAboveThreshold: number; // count of postponements where delay >= 2 days past due
  isSignificant: boolean;       // count >= 3 AND averageDelayDays >= 2
}

/** Internal structure returned by evaluateUnifiedEvidence */
interface UnifiedEvidenceResult {
  verdict: 'allow' | 'veto' | 'insufficient';
  points: number;
}

export class WateringPatternAnalyzer {
  private options: Required<PatternAnalysisOptions>;

  constructor(options?: PatternAnalysisOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Main analysis method - analyzes watering patterns for a plant
   */
  public analyzePattern(data: WateringPatternData): WateringPatternAnalysis {
    // Filter actual watering records (excludes postponements).
    // If lastSeasonalTransitionDate is set, the window is clipped to post-transition data
    // so we don't mix plant behaviour from different seasons.
    const relevantRecords = this.filterRelevantRecords(
      data.records,
      data.analysisDate,
      data.lastSeasonalTransitionDate
    );
    const windowWasClipped = !!data.lastSeasonalTransitionDate && (
      data.lastSeasonalTransitionDate > new Date(data.analysisDate.getTime() - this.options.analysisWindowDays * 24 * 60 * 60 * 1000)
    );

    // Analyze postponement signal from the full record set (before filtering).
    // Postponements represent intentional "I checked the soil and it was still moist"
    // decisions — they are the most reliable signal that a schedule is too aggressive.
    const postponementSignal = this.analyzePostponementSignal(
      data.records,
      relevantRecords,
      data.analysisDate,
      data.suggestedDays
    );

    // Check if we have enough data
    if (relevantRecords.length < this.options.minRecords) {
      return this.createInsufficientDataAnalysis(
        data.plantId,
        data.suggestedDays,
        postponementSignal,
        windowWasClipped
      );
    }

    // Calculate intervals between waterings
    const intervals = this.calculateWateringIntervals(relevantRecords);

    // Additional check: we need at least minRecords-1 intervals for meaningful analysis
    if (intervals.length < this.options.minRecords - 1) {
      return this.createInsufficientDataAnalysis(
        data.plantId,
        data.suggestedDays,
        postponementSignal,
        windowWasClipped
      );
    }

    // Perform pattern analysis
    const analysisResult = this.performPatternAnalysis(intervals, data.suggestedDays);

    // Generate suggestions (uses unified evidence gate)
    const suggestion = this.generateScheduleAdjustment(
      data.suggestedDays,
      analysisResult,
      intervals,
      relevantRecords,
      postponementSignal
    );

    // Generate reasoning (enriched with postponement context where relevant)
    const reasoning = this.generateReasoning(
      analysisResult,
      data.suggestedDays,
      intervals,
      postponementSignal
    );

    // Summarise health observations for UI messaging
    const observedRecords = relevantRecords.filter(
      r => r.notes?.startsWith(LATE_HEALTHY_PREFIX) || r.notes?.startsWith(LATE_STRESSED_PREFIX)
    );
    const healthObservationContext = {
      healthyCount: observedRecords.filter(r => r.notes?.startsWith(LATE_HEALTHY_PREFIX)).length,
      stressedCount: observedRecords.filter(r => r.notes?.startsWith(LATE_STRESSED_PREFIX)).length,
      totalObservations: observedRecords.length,
    };

    const postponementContext = {
      count: postponementSignal.count,
      averageDelayDays: Math.round(postponementSignal.averageDelayDays * 10) / 10,
      isSignificant: postponementSignal.isSignificant,
    };

    return {
      plantId: data.plantId,
      currentSchedule: data.suggestedDays,
      actualAverageInterval: Math.round(analysisResult.averageInterval * 10) / 10,
      pattern: analysisResult.pattern,
      confidence: analysisResult.confidence,
      suggestedAdjustment: suggestion?.suggestedSchedule,
      reasoning,
      healthObservationContext,
      postponementContext,
      analysisWindowNote: windowWasClipped
        ? "Using only post-season-change data to give you accurate seasonal analysis"
        : undefined,
    };
  }

  /**
   * Generate pattern insights for UI display
   */
  public generateInsights(analysis: WateringPatternAnalysis): PatternInsight[] {
    const insights: PatternInsight[] = [];

    // Schedule adjustment insight
    if (analysis.suggestedAdjustment && analysis.suggestedAdjustment !== analysis.currentSchedule) {
      const adjustmentType = analysis.suggestedAdjustment > analysis.currentSchedule ? 'increase' : 'decrease';
      const severity = this.getSeverityFromConfidence(analysis.confidence);

      insights.push({
        type: 'schedule_adjustment',
        severity,
        title: `Schedule ${adjustmentType === 'increase' ? 'Extension' : 'Shortening'} Suggested`,
        description: `Based on your watering pattern, consider ${adjustmentType === 'increase' ? 'extending' : 'shortening'} the schedule to ${analysis.suggestedAdjustment} days.`,
        actionable: true,
        suggestion: {
          currentSchedule: analysis.currentSchedule,
          suggestedSchedule: analysis.suggestedAdjustment,
          adjustmentType,
          confidence: analysis.confidence,
          reasoning: analysis.reasoning,
          potentialBenefits: this.getPotentialBenefits(adjustmentType, analysis.pattern),
        },
      });
    }

    // Pattern consistency insight
    if (analysis.pattern === 'irregular' && analysis.confidence === 'high') {
      insights.push({
        type: 'consistency_improvement',
        severity: 'medium',
        title: 'Irregular Watering Pattern Detected',
        description: 'Your watering schedule varies significantly. Consider setting reminders for more consistent care.',
        actionable: true,
      });
    }

    // Overwatering risk insight
    if (analysis.pattern === 'early' && analysis.confidence !== 'low') {
      const daysDifference = analysis.currentSchedule - analysis.actualAverageInterval;
      if (daysDifference >= 3) {
        insights.push({
          type: 'overwatering_risk',
          severity: 'high',
          title: 'Potential Overwatering Risk',
          description: `You're watering ${daysDifference.toFixed(1)} days earlier than recommended, which could lead to overwatering.`,
          actionable: true,
        });
      }
    }

    // Underwatering risk insight
    if (analysis.pattern === 'late' && analysis.confidence !== 'low') {
      const daysDifference = analysis.actualAverageInterval - analysis.currentSchedule;
      if (daysDifference >= 3) {
        insights.push({
          type: 'underwatering_risk',
          severity: 'medium',
          title: 'Potential Underwatering Risk',
          description: `You're watering ${daysDifference.toFixed(1)} days later than recommended. Your plant might benefit from more frequent watering.`,
          actionable: true,
        });
      }
    }

    // Postponement pattern insight (only when no schedule_adjustment is already showing,
    // to avoid stacking two "water less often" signals simultaneously)
    const hasScheduleAdjustment = insights.some(i => i.type === 'schedule_adjustment');
    const postponeCount = analysis.postponementContext?.count ?? 0;
    if (!hasScheduleAdjustment && postponeCount >= 2) {
      const isSignificant = analysis.postponementContext?.isSignificant ?? false;
      const avgDelay = analysis.postponementContext?.averageDelayDays ?? 0;
      insights.push({
        type: 'postponement_pattern',
        severity: isSignificant ? 'medium' : 'low',
        title: 'Frequent Postponements Detected',
        description:
          `You've postponed watering ${postponeCount} time${postponeCount !== 1 ? 's' : ''} recently` +
          (avgDelay > 0 ? ` (average ${avgDelay.toFixed(1)} days past due date)` : '') +
          '. If you\'re checking the soil each time and finding it still moist, consider adjusting your schedule.',
        actionable: isSignificant,
      });
    }

    return insights;
  }

  /**
   * Get detailed statistics for pattern analysis
   */
  public getAnalysisStats(records: WateringRecordForAnalysis[], analysisDate: Date): PatternAnalysisStats {
    const relevantRecords = this.filterRelevantRecords(records, analysisDate);
    const intervals = this.calculateWateringIntervals(relevantRecords);

    if (intervals.length === 0) {
      return {
        totalRecords: records.length,
        recordsUsed: relevantRecords.length,
        timeSpanDays: 0,
        averageInterval: 0,
        standardDeviation: 0,
        minInterval: 0,
        maxInterval: 0,
        dataQuality: 'insufficient',
      };
    }

    const average = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - average, 2), 0) / intervals.length;
    const standardDeviation = Math.sqrt(variance);

    const firstRecord = new Date(relevantRecords[relevantRecords.length - 1].watered_at);
    const lastRecord = new Date(relevantRecords[0].watered_at);
    const timeSpanDays = Math.ceil((lastRecord.getTime() - firstRecord.getTime()) / (1000 * 60 * 60 * 24));

    const consistencyScore = standardDeviation / average;
    const dataQuality = this.assessDataQuality(relevantRecords.length, 1 - consistencyScore);

    return {
      totalRecords: records.length,
      recordsUsed: relevantRecords.length,
      timeSpanDays,
      averageInterval: Math.round(average * 10) / 10,
      standardDeviation: Math.round(standardDeviation * 10) / 10,
      minInterval: Math.min(...intervals),
      maxInterval: Math.max(...intervals),
      dataQuality,
    };
  }

  /**
   * Filter records to relevant time window and exclude postponements.
   *
   * If lastSeasonalTransitionDate is provided and falls within the default window,
   * it is used as the window start instead. This prevents mixing plant behaviour
   * from different seasons in the same analysis.
   */
  private filterRelevantRecords(
    records: WateringRecordForAnalysis[],
    analysisDate: Date,
    lastSeasonalTransitionDate?: Date
  ): WateringRecordForAnalysis[] {
    const defaultWindowStart = new Date(
      analysisDate.getTime() - this.options.analysisWindowDays * 24 * 60 * 60 * 1000
    );

    // Clip to seasonal transition if it occurred within the default window
    const windowStart =
      lastSeasonalTransitionDate && lastSeasonalTransitionDate > defaultWindowStart
        ? lastSeasonalTransitionDate
        : defaultWindowStart;

    return records
      .filter(record => {
        // Exclude postponement records — they are analyzed separately
        if (record.notes?.includes(POSTPONEMENT_PREFIX)) {
          return false;
        }

        const recordDate = new Date(record.watered_at);
        return recordDate >= windowStart && recordDate <= analysisDate;
      })
      .sort((a, b) => new Date(b.watered_at).getTime() - new Date(a.watered_at).getTime()); // Most recent first
  }

  /**
   * Analyze postponement behaviour within the analysis window.
   *
   * Each postponement represents an intentional "I checked the soil and it
   * was still moist" decision. Multiple consecutive postponements with meaningful
   * delays past the scheduled due date are the strongest available signal that
   * a watering schedule is more aggressive than the plant needs.
   */
  private analyzePostponementSignal(
    allRecords: WateringRecordForAnalysis[],
    actualWateringRecords: WateringRecordForAnalysis[],
    analysisDate: Date,
    suggestedDays: number
  ): PostponementSignal {
    const windowStart = new Date(
      analysisDate.getTime() - this.options.analysisWindowDays * 24 * 60 * 60 * 1000
    );
    // Add a 2-day buffer to the upper bound to capture still-pending postponements
    // whose watered_at is set to "tomorrow 9 AM"
    const windowEnd = new Date(analysisDate.getTime() + 2 * 24 * 60 * 60 * 1000);

    const postponementRecords = allRecords.filter(r => {
      if (!r.notes?.includes(POSTPONEMENT_PREFIX)) return false;
      const date = new Date(r.watered_at);
      return date >= windowStart && date <= windowEnd;
    });

    if (postponementRecords.length === 0) {
      return { count: 0, averageDelayDays: 0, delaysAboveThreshold: 0, isSignificant: false };
    }

    // Sort actual waterings oldest-first for look-up efficiency
    const sortedWaterings = [...actualWateringRecords].sort(
      (a, b) => new Date(a.watered_at).getTime() - new Date(b.watered_at).getTime()
    );

    const delays: number[] = [];
    for (const postponement of postponementRecords) {
      const postponeDate = new Date(postponement.watered_at);

      // Find the most recent actual watering before this postponement
      const previousWatering = sortedWaterings
        .filter(w => new Date(w.watered_at) < postponeDate)
        .pop();

      if (!previousWatering) continue; // Can't compute a delay without a preceding watering

      const dueDate = new Date(
        new Date(previousWatering.watered_at).getTime() + suggestedDays * 24 * 60 * 60 * 1000
      );
      const delayDays = (postponeDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);

      // Only count positive delays — a negative delay would mean the postponement
      // happened before the plant was even due, which doesn't make botanical sense
      if (delayDays >= 0) {
        delays.push(delayDays);
      }
    }

    const averageDelayDays =
      delays.length > 0
        ? delays.reduce((sum, d) => sum + d, 0) / delays.length
        : 0;

    const delaysAboveThreshold = delays.filter(d => d >= 2).length;
    const isSignificant = postponementRecords.length >= 3 && averageDelayDays >= 2;

    return {
      count: postponementRecords.length,
      averageDelayDays,
      delaysAboveThreshold,
      isSignificant,
    };
  }

  /**
   * Calculate intervals between consecutive watering records
   */
  private calculateWateringIntervals(records: WateringRecordForAnalysis[]): number[] {
    if (records.length < 2) return [];

    const intervals: number[] = [];

    for (let i = 0; i < records.length - 1; i++) {
      const current = new Date(records[i].watered_at);
      const previous = new Date(records[i + 1].watered_at);
      const intervalDays = (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);

      // Only include reasonable intervals (1-90 days).
      // The 45-day cap silently dropped valid intervals for slow-watering plants
      // like cacti and ZZ plants — raised to 90 days to cover them.
      if (intervalDays >= 1 && intervalDays <= 90) {
        intervals.push(intervalDays);
      }
    }

    return intervals;
  }

  /**
   * Perform core pattern analysis
   */
  private performPatternAnalysis(intervals: number[], suggestedDays: number): PatternAnalysisResult {
    if (intervals.length === 0) {
      return {
        pattern: 'irregular',
        confidence: 'low',
        intervals: [],
        averageInterval: 0,
        deviationFromSchedule: 0,
        consistencyScore: 0,
        dataQuality: 'insufficient',
      };
    }

    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const deviationFromSchedule = averageInterval - suggestedDays;

    // Calculate consistency score (1 = perfectly consistent, 0 = completely inconsistent)
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - averageInterval, 2), 0) / intervals.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / averageInterval;
    const consistencyScore = Math.max(0, 1 - coefficientOfVariation);

    // Determine pattern type
    const pattern = this.classifyPattern(deviationFromSchedule, consistencyScore);

    // Determine confidence based on data quality and consistency
    const confidence = this.calculateConfidence(intervals.length, consistencyScore, Math.abs(deviationFromSchedule));

    // Assess data quality
    const dataQuality = this.assessDataQuality(intervals.length, consistencyScore);

    return {
      pattern,
      confidence,
      intervals,
      averageInterval,
      deviationFromSchedule,
      consistencyScore,
      dataQuality,
    };
  }

  /**
   * Classify watering pattern based on deviation and consistency
   */
  private classifyPattern(deviationFromSchedule: number, consistencyScore: number): PatternAnalysisResult['pattern'] {
    const absDeviation = Math.abs(deviationFromSchedule);

    // First, check for irregular patterns (high inconsistency should override everything)
    // More strict threshold for irregular patterns to catch highly variable intervals
    if (consistencyScore < 0.7) {
      return 'irregular';
    }

    // Check for early or late patterns with sufficient consistency
    // Early pattern: watering significantly before schedule
    if (deviationFromSchedule <= -this.options.earlyLateThresholdDays) {
      // If reasonably consistent, it's clearly early
      if (consistencyScore >= 0.3) {
        return 'early';
      }
      // Even with low consistency, if highly deviated, still early
      if (deviationFromSchedule <= -3.0) {
        return 'early';
      }
    }

    // Additional check for moderately early patterns with high consistency (respect custom threshold)
    const moderateEarlyThreshold = Math.min(-1.0, -this.options.earlyLateThresholdDays + 0.5);
    if (deviationFromSchedule <= moderateEarlyThreshold && consistencyScore >= 0.7) {
      return 'early';
    }

    // Late pattern: watering significantly after schedule
    if (deviationFromSchedule >= this.options.earlyLateThresholdDays) {
      // If reasonably consistent, it's clearly late
      if (consistencyScore >= 0.3) {
        return 'late';
      }
      // Even with low consistency, if highly deviated, still late
      if (deviationFromSchedule >= 3.0) {
        return 'late';
      }
    }

    // Additional check for moderately late patterns with high consistency (respect custom threshold)
    const moderateLateThreshold = Math.max(1.0, this.options.earlyLateThresholdDays - 0.5);
    if (deviationFromSchedule >= moderateLateThreshold && consistencyScore >= 0.7) {
      return 'late';
    }

    // If very close to schedule and highly consistent, mark as consistent
    // Use dynamic threshold based on custom early/late thresholds
    const consistentDevThreshold = Math.max(1.0, this.options.earlyLateThresholdDays - 1.0);
    if (absDeviation <= consistentDevThreshold && consistencyScore >= this.options.consistencyThreshold) {
      return 'consistent';
    }

    // Default to irregular for ambiguous cases
    return 'irregular';
  }

  /**
   * Calculate confidence level based on multiple factors
   */
  private calculateConfidence(
    dataPoints: number,
    consistencyScore: number,
    deviationMagnitude: number
  ): PatternAnalysisResult['confidence'] {
    // For highly inconsistent patterns, always return low confidence
    if (consistencyScore < 0.5) {
      return 'low';
    }

    // Require at least 5 data points to reach medium confidence.
    // With only 3-4 waterings the pattern is still forming and a single
    // outlier can swing the analysis significantly.
    if (dataPoints < 5) {
      return 'low';
    }

    let confidenceScore = 0;

    // Data quantity factor (0-0.4) - balanced scoring
    if (dataPoints >= 8) confidenceScore += 0.4;
    else if (dataPoints >= 5) confidenceScore += 0.3;
    else if (dataPoints >= 4) confidenceScore += 0.2;
    else if (dataPoints >= 3) confidenceScore += 0.15;

    // Consistency factor (0-0.4) - more weight to consistency
    confidenceScore += consistencyScore * 0.45;

    // Pattern clarity factor (0-0.15) - less generous for unclear patterns
    if (deviationMagnitude >= 2) confidenceScore += 0.15;
    else if (deviationMagnitude >= 1) confidenceScore += 0.1;
    else if (deviationMagnitude >= 0.5) confidenceScore += 0.05;

    // Bonus for very consistent patterns (consistent score > 0.85 and minimal deviation)
    if (consistencyScore >= 0.85 && deviationMagnitude <= 0.5) {
      confidenceScore += 0.2;
    }

    // Adjusted thresholds based on test expectations
    if (confidenceScore >= 0.75) return 'high';
    if (confidenceScore >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Assess overall data quality
   */
  private assessDataQuality(dataPoints: number, consistencyScore: number): PatternAnalysisStats['dataQuality'] {
    if (dataPoints < this.options.minRecords) return 'insufficient';
    if (dataPoints >= 7 && consistencyScore >= 0.8) return 'excellent'; // 7+ intervals with high consistency
    if (dataPoints >= 5 && consistencyScore >= 0.6) return 'good';
    if (dataPoints >= 3) return 'limited';
    return 'insufficient';
  }

  /**
   * Generate schedule adjustment suggestion.
   *
   * "Increase" suggestions (water less often) are gated behind a unified
   * evidence model that considers both plant health observations and
   * postponement patterns. Either gate passing is sufficient; any stressed
   * observation vetoes regardless of other evidence.
   */
  private generateScheduleAdjustment(
    currentSchedule: number,
    analysis: PatternAnalysisResult,
    intervals: number[],
    records: WateringRecordForAnalysis[],
    postponementSignal: PostponementSignal
  ): ScheduleAdjustmentSuggestion | null {
    if (analysis.confidence === 'low' || analysis.pattern === 'irregular') {
      return null;
    }

    const { averageInterval, deviationFromSchedule } = analysis;

    // Only suggest adjustments for significant deviations
    if (Math.abs(deviationFromSchedule) < 1.5) {
      return null;
    }

    // Calculate suggested schedule with bounds
    let suggestedSchedule = Math.round(averageInterval);
    suggestedSchedule = Math.max(2, Math.min(30, suggestedSchedule)); // Reasonable bounds

    const adjustmentType = suggestedSchedule > currentSchedule ? 'increase' : 'decrease';

    if (adjustmentType === 'increase') {
      // Hard veto: any stressed observation overrides all positive evidence
      const stressedCount = records.filter(r => r.notes?.startsWith(LATE_STRESSED_PREFIX)).length;
      if (stressedCount > 0) return null;

      // Allow if EITHER the legacy gate (2 healthy observations) OR the unified
      // evidence gate (3+ combined points from healthy obs + postponements) passes.
      // This preserves existing behaviour while extending it with postponement signals.
      const legacyOk = this.evaluateHealthObservationGate(records) === 'allow';
      const unifiedOk = this.evaluateUnifiedEvidence(records, postponementSignal).verdict === 'allow';
      if (!legacyOk && !unifiedOk) return null;
    }

    const reasoning = this.generateAdjustmentReasoning(
      currentSchedule,
      suggestedSchedule,
      analysis,
      intervals,
      records,
      postponementSignal
    );

    return {
      currentSchedule,
      suggestedSchedule,
      adjustmentType,
      confidence: analysis.confidence,
      reasoning,
      potentialBenefits: this.getPotentialBenefits(adjustmentType, analysis.pattern),
    };
  }

  /**
   * Legacy gate: allows "water less" only when ≥2 healthy observations with zero stressed.
   * Preserved for backward compatibility and used as the lower bar in the unified gate.
   */
  private evaluateHealthObservationGate(
    records: WateringRecordForAnalysis[]
  ): 'allow' | 'suppress' {
    const observedRecords = records.filter(
      r => r.notes?.startsWith(LATE_HEALTHY_PREFIX) || r.notes?.startsWith(LATE_STRESSED_PREFIX)
    );

    if (observedRecords.length === 0) return 'suppress';

    const stressedCount = observedRecords.filter(r => r.notes?.startsWith(LATE_STRESSED_PREFIX)).length;
    if (stressedCount > 0) return 'suppress';

    const healthyCount = observedRecords.filter(r => r.notes?.startsWith(LATE_HEALTHY_PREFIX)).length;
    return healthyCount >= 2 ? 'allow' : 'suppress';
  }

  /**
   * Unified evidence model: combines healthy observations and meaningful postponements.
   *
   * Evidence points:
   *   + min(LATE_HEALTHY count, 3)           — user confirmed plant looked fine when watered late
   *   + min(postponements with delay ≥2, 3)  — user actively chose not to water past due date
   *
   * Threshold: ≥3 points = 'allow'. Any stressed observation = 'veto'.
   */
  private evaluateUnifiedEvidence(
    records: WateringRecordForAnalysis[],
    postponementSignal: PostponementSignal
  ): UnifiedEvidenceResult {
    const stressedCount = records.filter(r => r.notes?.startsWith(LATE_STRESSED_PREFIX)).length;
    if (stressedCount > 0) {
      return { verdict: 'veto', points: 0 };
    }

    const healthyCount = Math.min(
      records.filter(r => r.notes?.startsWith(LATE_HEALTHY_PREFIX)).length,
      3
    );
    const postponementPoints = Math.min(postponementSignal.delaysAboveThreshold, 3);

    const points = healthyCount + postponementPoints;

    return {
      verdict: points >= 3 ? 'allow' : 'insufficient',
      points,
    };
  }

  /**
   * Generate human-readable reasoning for analysis (enriched with postponement context)
   */
  private generateReasoning(
    analysis: PatternAnalysisResult,
    suggestedDays: number,
    intervals: number[],
    postponementSignal?: PostponementSignal
  ): string[] {
    const reasoning: string[] = [];
    const { pattern, averageInterval, consistencyScore, dataQuality } = analysis;

    // Data quality context
    if (dataQuality === 'excellent') {
      reasoning.push(`Analysis based on ${intervals.length + 1} watering records with high consistency`);
    } else if (dataQuality === 'good') {
      reasoning.push(`Analysis based on ${intervals.length + 1} watering records with good consistency`);
    } else if (dataQuality === 'limited') {
      reasoning.push(`Analysis based on ${intervals.length + 1} watering records with limited data`);
    }

    // Pattern-specific reasoning
    switch (pattern) {
      case 'consistent':
        reasoning.push(`You water consistently every ${averageInterval.toFixed(1)} days on average`);
        reasoning.push(`This aligns well with your ${suggestedDays}-day schedule`);
        break;

      case 'early': {
        const earlyBy = suggestedDays - averageInterval;
        reasoning.push(`You tend to water ${earlyBy.toFixed(1)} days earlier than your ${suggestedDays}-day schedule`);
        if (earlyBy >= 2) {
          reasoning.push('This could indicate the plant needs water sooner than expected');
        }
        break;
      }

      case 'late': {
        const lateBy = averageInterval - suggestedDays;
        reasoning.push(`You tend to water ${lateBy.toFixed(1)} days later than your ${suggestedDays}-day schedule`);
        if (lateBy >= 2) {
          reasoning.push('Consider if the current schedule fits your routine');
        }
        // Surface postponement context here so the user sees the full picture
        if (postponementSignal && postponementSignal.count > 0) {
          reasoning.push(
            `You've also postponed watering ${postponementSignal.count} time${postponementSignal.count !== 1 ? 's' : ''} recently` +
            (postponementSignal.averageDelayDays > 0
              ? ` (average ${postponementSignal.averageDelayDays.toFixed(1)} days past due date)`
              : '')
          );
        }
        break;
      }

      case 'irregular':
        reasoning.push('Your watering pattern varies significantly');
        if (intervals.length > 0) {
          reasoning.push(`Intervals range from ${Math.min(...intervals).toFixed(1)} to ${Math.max(...intervals).toFixed(1)} days`);
        }
        reasoning.push('Consider setting reminders for more consistent watering');
        break;
    }

    // Consistency feedback
    if (consistencyScore > 0.8) {
      reasoning.push('Your watering routine is very consistent');
    } else if (consistencyScore > 0.6) {
      reasoning.push('Your watering routine is moderately consistent');
    } else {
      reasoning.push('Consider setting reminders for more consistent watering');
    }

    return reasoning;
  }

  /**
   * Generate reasoning for schedule adjustments (enriched copy when evidence is strong)
   */
  private generateAdjustmentReasoning(
    currentSchedule: number,
    suggestedSchedule: number,
    analysis: PatternAnalysisResult,
    _intervals: number[],
    records?: WateringRecordForAnalysis[],
    postponementSignal?: PostponementSignal
  ): string[] {
    const reasoning: string[] = [];
    const difference = suggestedSchedule - currentSchedule;
    const { averageInterval, pattern } = analysis;

    if (difference > 0) {
      const healthyCount = records
        ? records.filter(r => r.notes?.startsWith(LATE_HEALTHY_PREFIX)).length
        : 0;
      const postponeCount = postponementSignal?.count ?? 0;

      if (healthyCount >= 2 && postponeCount >= 3) {
        // Both signals present — strongest evidence, most compelling copy
        reasoning.push(
          `Your plant looked healthy on ${healthyCount} occasion${healthyCount !== 1 ? 's' : ''} when watered late, ` +
          `and you also postponed watering ${postponeCount} times — strong evidence the current schedule is too aggressive`
        );
        reasoning.push(`Extending to ${suggestedSchedule} days aligns with the interval your plant consistently handled well`);
      } else if (postponementSignal?.isSignificant) {
        // Postponements drove the suggestion
        reasoning.push(
          `You postponed watering ${postponeCount} times (average ${postponementSignal.averageDelayDays.toFixed(1)} days after due date), ` +
          `suggesting the current schedule is more frequent than your plant needs`
        );
        reasoning.push(`Extending to ${suggestedSchedule} days better matches how your plant is actually being cared for`);
      } else if (healthyCount >= 2) {
        // Health observations drove the suggestion (original copy)
        reasoning.push(
          `Your plant looked healthy on ${healthyCount} occasion${healthyCount !== 1 ? 's' : ''} when watered late, suggesting it can comfortably go longer between waterings`
        );
        reasoning.push(`Extending to ${suggestedSchedule} days aligns with the interval your plant handled well`);
      } else {
        // Fallback (shouldn't normally be reached given the gate)
        reasoning.push(`Your actual watering average of ${averageInterval.toFixed(1)} days suggests the plant can go longer between waterings`);
        reasoning.push(`Extending to ${suggestedSchedule} days could reduce maintenance while maintaining plant health`);
      }
    } else {
      reasoning.push(`Your actual watering average of ${averageInterval.toFixed(1)} days suggests the plant needs more frequent attention`);
      reasoning.push(`Shortening to ${suggestedSchedule} days aligns better with your natural watering instincts`);
    }

    if (pattern === 'consistent') {
      reasoning.push('Your consistent watering pattern shows you have a good sense of this plant\'s needs');
    }

    return reasoning;
  }

  /**
   * Get potential benefits of schedule adjustment
   */
  private getPotentialBenefits(adjustmentType: string, pattern: string): string[] {
    const benefits: string[] = [];

    if (adjustmentType === 'increase') {
      benefits.push('Reduced maintenance frequency');
      benefits.push('Lower risk of overwatering');
      if (pattern === 'consistent') {
        benefits.push('Schedule better matches your natural timing');
      }
    } else {
      benefits.push('Better plant health through adequate hydration');
      benefits.push('Reduced stress on the plant');
      if (pattern === 'consistent') {
        benefits.push('Schedule aligns with your watering instincts');
      }
    }

    return benefits;
  }

  /**
   * Create analysis result for insufficient data.
   * Still includes postponement context so the UI can surface early nudges
   * even before there are enough watering records for timing analysis.
   */
  private createInsufficientDataAnalysis(
    plantId: string,
    suggestedDays: number,
    postponementSignal?: PostponementSignal,
    windowWasClipped?: boolean
  ): WateringPatternAnalysis {
    const reasoning = [
      `Need at least ${this.options.minRecords} watering records for pattern analysis`,
      'Keep tracking your watering to unlock personalized insights',
    ];

    return {
      plantId,
      currentSchedule: suggestedDays,
      actualAverageInterval: 0,
      pattern: 'irregular',
      confidence: 'low',
      reasoning,
      postponementContext: postponementSignal
        ? {
            count: postponementSignal.count,
            averageDelayDays: Math.round(postponementSignal.averageDelayDays * 10) / 10,
            isSignificant: postponementSignal.isSignificant,
          }
        : undefined,
      analysisWindowNote: windowWasClipped
        ? "Using only post-season-change data to give you accurate seasonal analysis"
        : undefined,
    };
  }

  /**
   * Convert confidence level to severity
   */
  private getSeverityFromConfidence(confidence: string): 'low' | 'medium' | 'high' {
    switch (confidence) {
      case 'high': return 'high';
      case 'medium': return 'medium';
      default: return 'low';
    }
  }
}

// Export default instance for convenience
export const wateringPatternAnalyzer = new WateringPatternAnalyzer();

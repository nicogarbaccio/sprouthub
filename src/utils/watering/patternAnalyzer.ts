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

const DEFAULT_OPTIONS: Required<PatternAnalysisOptions> = {
  minRecords: 3,
  analysisWindowDays: 60,
  consistencyThreshold: 0.8,
  earlyLateThresholdDays: 1.5, // More sensitive to detect early/late patterns
};

export class WateringPatternAnalyzer {
  private options: Required<PatternAnalysisOptions>;

  constructor(options?: PatternAnalysisOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Main analysis method - analyzes watering patterns for a plant
   */
  public analyzePattern(data: WateringPatternData): WateringPatternAnalysis {
    // Filter and prepare records
    const relevantRecords = this.filterRelevantRecords(data.records, data.analysisDate);
    
    
    // Check if we have enough data
    if (relevantRecords.length < this.options.minRecords) {
      return this.createInsufficientDataAnalysis(data.plantId, data.suggestedDays);
    }
    
    // Calculate intervals between waterings
    const intervals = this.calculateWateringIntervals(relevantRecords);
    
    
    // Additional check: we need at least minRecords-1 intervals for meaningful analysis
    if (intervals.length < this.options.minRecords - 1) {
      return this.createInsufficientDataAnalysis(data.plantId, data.suggestedDays);
    }
    
    // Perform pattern analysis
    const analysisResult = this.performPatternAnalysis(intervals, data.suggestedDays);
    
    // Generate suggestions
    const suggestion = this.generateScheduleAdjustment(
      data.suggestedDays,
      analysisResult,
      intervals
    );

    // Generate reasoning
    const reasoning = this.generateReasoning(analysisResult, data.suggestedDays, intervals);

    return {
      plantId: data.plantId,
      currentSchedule: data.suggestedDays,
      actualAverageInterval: Math.round(analysisResult.averageInterval * 10) / 10,
      pattern: analysisResult.pattern,
      confidence: analysisResult.confidence,
      suggestedAdjustment: suggestion?.suggestedSchedule,
      reasoning,
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
   * Filter records to relevant time window and exclude postponements
   */
  private filterRelevantRecords(records: WateringRecordForAnalysis[], analysisDate: Date): WateringRecordForAnalysis[] {
    const windowStart = new Date(analysisDate.getTime() - this.options.analysisWindowDays * 24 * 60 * 60 * 1000);
    
    return records
      .filter(record => {
        // Exclude postponement records
        if (record.notes?.includes('POSTPONEMENT:')) {
          return false;
        }
        
        const recordDate = new Date(record.watered_at);
        return recordDate >= windowStart && recordDate <= analysisDate;
      })
      .sort((a, b) => new Date(b.watered_at).getTime() - new Date(a.watered_at).getTime()); // Most recent first
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
      
      // Only include reasonable intervals (1-45 days)
      if (intervalDays >= 1 && intervalDays <= 45) {
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
   * Generate schedule adjustment suggestion
   */
  private generateScheduleAdjustment(
    currentSchedule: number,
    analysis: PatternAnalysisResult,
    intervals: number[]
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
    
    const reasoning = this.generateAdjustmentReasoning(
      currentSchedule,
      suggestedSchedule,
      analysis,
      intervals
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
   * Generate human-readable reasoning for analysis
   */
  private generateReasoning(
    analysis: PatternAnalysisResult,
    suggestedDays: number,
    intervals: number[]
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
      
      case 'early':
        const earlyBy = suggestedDays - averageInterval;
        reasoning.push(`You tend to water ${earlyBy.toFixed(1)} days earlier than your ${suggestedDays}-day schedule`);
        if (earlyBy >= 2) {
          reasoning.push('This could indicate the plant needs water sooner than expected');
        }
        break;
      
      case 'late':
        const lateBy = averageInterval - suggestedDays;
        reasoning.push(`You tend to water ${lateBy.toFixed(1)} days later than your ${suggestedDays}-day schedule`);
        if (lateBy >= 2) {
          reasoning.push('Consider if the current schedule fits your routine');
        }
        break;
      
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
   * Generate reasoning for schedule adjustments
   */
  private generateAdjustmentReasoning(
    currentSchedule: number,
    suggestedSchedule: number,
    analysis: PatternAnalysisResult,
    _intervals: number[]
  ): string[] {
    const reasoning: string[] = [];
    const difference = suggestedSchedule - currentSchedule;
    const { averageInterval, pattern } = analysis;

    if (difference > 0) {
      reasoning.push(`Your actual watering average of ${averageInterval.toFixed(1)} days suggests the plant can go longer between waterings`);
      reasoning.push(`Extending to ${suggestedSchedule} days could reduce maintenance while maintaining plant health`);
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
   * Create analysis result for insufficient data
   */
  private createInsufficientDataAnalysis(plantId: string, suggestedDays: number): WateringPatternAnalysis {
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
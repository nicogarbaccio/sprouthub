/**
 * TypeScript interfaces for watering pattern analysis system
 */

export interface WateringPatternAnalysis {
  plantId: string;
  currentSchedule: number;
  actualAverageInterval: number;
  pattern: 'early' | 'late' | 'consistent' | 'irregular';
  confidence: 'low' | 'medium' | 'high';
  suggestedAdjustment?: number;
  reasoning: string[];
  /** Health observations logged during late waterings, used to contextualise suggestions */
  healthObservationContext?: {
    healthyCount: number;
    stressedCount: number;
    totalObservations: number;
  };
  /** Postponement behaviour within the analysis window */
  postponementContext?: {
    count: number;             // postponements in analysis window
    averageDelayDays: number;  // avg days past scheduled due date at time of postponement
    isSignificant: boolean;    // count >= 3 AND averageDelayDays >= 2
  };
  /** Set when the analysis window was clipped to a seasonal boundary */
  analysisWindowNote?: string;
}

export interface WateringPatternData {
  plantId: string;
  records: WateringRecordForAnalysis[];
  suggestedDays: number;
  analysisDate: Date;
  /** When set, the analysis window is clipped to start from this date (prevents mixing pre/post-seasonal-transition data) */
  lastSeasonalTransitionDate?: Date;
}

export interface WateringRecordForAnalysis {
  id: string;
  watered_at: string;
  notes?: string | null;
  /**
   * Discriminator from `watering_records.record_type`. Authoritative for telling a real
   * watering from a postponement; the legacy notes marker is only a fallback.
   */
  record_type?: string | null;
}

export interface PatternAnalysisResult {
  pattern: WateringPatternAnalysis['pattern'];
  confidence: WateringPatternAnalysis['confidence'];
  intervals: number[];
  averageInterval: number;
  deviationFromSchedule: number;
  consistencyScore: number;
  dataQuality: 'insufficient' | 'limited' | 'good' | 'excellent';
}

export interface ScheduleAdjustmentSuggestion {
  currentSchedule: number;
  suggestedSchedule: number;
  adjustmentType: 'increase' | 'decrease' | 'maintain';
  confidence: 'low' | 'medium' | 'high';
  reasoning: string[];
  potentialBenefits: string[];
}

export interface PatternInsight {
  type: 'schedule_adjustment' | 'consistency_improvement' | 'overwatering_risk' | 'underwatering_risk' | 'postponement_pattern';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  actionable: boolean;
  suggestion?: ScheduleAdjustmentSuggestion;
}

export interface PatternAnalysisOptions {
  minRecords?: number;
  analysisWindowDays?: number;
  consistencyThreshold?: number;
  earlyLateThresholdDays?: number;
}

export interface PatternAnalysisStats {
  totalRecords: number;
  recordsUsed: number;
  timeSpanDays: number;
  averageInterval: number;
  standardDeviation: number;
  minInterval: number;
  maxInterval: number;
  dataQuality: 'insufficient' | 'limited' | 'good' | 'excellent';
}
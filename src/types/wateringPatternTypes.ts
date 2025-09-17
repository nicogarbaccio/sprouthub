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
}

export interface WateringPatternData {
  plantId: string;
  records: WateringRecordForAnalysis[];
  suggestedDays: number;
  analysisDate: Date;
}

export interface WateringRecordForAnalysis {
  id: string;
  watered_at: string;
  notes?: string | null;
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
  type: 'schedule_adjustment' | 'consistency_improvement' | 'overwatering_risk' | 'underwatering_risk';
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
/**
 * TypeScript interfaces for Enhanced Scoring System
 * Frontend types that match the backend scoring interfaces
 */

export interface EnhancedScoringData {
  scorePercent: number;
  finalScore: number;
  basePoints: number;
  attemptNumber: number;
  penaltyApplied: number;
  bonusApplied: boolean;
  minimumFloorApplied: boolean;
  stepBreakdown: StepScoreBreakdown[];
}

export interface StepScoreBreakdown {
  stepNumber: number;
  passed: boolean;
  points: number;
  percentage: number;
  weight: number;
}

export interface EnhancedValidationResult {
  id: string;
  description: string;
  passed: boolean;
  points: number;
  enhancedPoints?: number;
  percentage?: number;
  weight?: number;
  errorMessage?: string;
}

export interface ValidationTrackingInfo {
  attemptNumber: number;
  remainingAttempts: number;
  totalScore: number; // Legacy score for backward compatibility
  enhancedTotalScore?: number; // Enhanced score
  sessionId: string;
  attemptId: string;
}

export interface ValidationCompletedEvent {
  questionId: string;
  passed: boolean;
  totalSteps: number;
  passedSteps: number;
  totalPoints: number; // Legacy points
  maxPoints: number; // Legacy max points
  progressiveScore: number; // Legacy progressive score
  enhancedScoring?: EnhancedScoringData; // Enhanced scoring information
  results: EnhancedValidationResult[];
  tracking: ValidationTrackingInfo;
}

export interface ValidationStepEvent {
  step: string;
  status: 'running' | 'success' | 'failed';
  message?: string;
}

export interface ValidationStartEvent {
  validationQuestionId: string;
}

export interface ValidationErrorEvent {
  questionId: string;
  error: string;
}

export interface ValidationAttemptsReachedEvent {
  questionId: string;
  error: string;
}

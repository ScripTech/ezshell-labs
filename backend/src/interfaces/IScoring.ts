/**
 * Scoring System Interfaces
 *
 * This module defines the interfaces for the enhanced scoring system that provides
 * progressive penalties for multiple attempts while maintaining educational value.
 *
 * Key Features:
 * - Progressive penalty system (7.5% per attempt by default)
 * - Minimum score floor to encourage learning
 * - First attempt bonus for perfect performance
 * - Configurable scoring parameters per question type
 */

/**
 * Configuration for scoring a specific question or validation task
 */
export interface ScoringConfig {
  /** Base points for this question (e.g., 10, 15, 20 points) */
  basePoints: number;

  /** Percentage penalty applied per attempt (default: 7.5%) */
  penaltyPerAttempt: number;

  /** Minimum score percentage to prevent complete failure (default: 20%) */
  minimumScorePercent: number;

  /** Bonus percentage for first attempt success (default: 5%) */
  firstAttemptBonus: number;

  /** Maximum number of attempts allowed (default: 5) */
  maxAttempts: number;

  /** Optional: Different weights for validation steps if some are more critical */
  stepWeights?: number[];
}

/**
 * Input data for score calculation
 */
export interface ValidationResult {
  /** Number of validation steps that passed */
  stepsPassed: number;

  /** Total number of validation steps */
  totalSteps: number;

  /** Current attempt number (1-based) */
  attemptNumber: number;

  /** Scoring configuration for this question */
  config: ScoringConfig;

  /** Optional: Which specific steps passed (for detailed analysis) */
  passedSteps?: number[];

  /** Optional: Question/task identifier */
  questionId?: string;

  /** Optional: User identifier */
  userId?: string;
}

/**
 * Result of score calculation
 */
export interface ScoreResult {
  /** Final percentage score (0-100) */
  score_percent: number;

  /** Final points awarded based on base points */
  final_score: number;

  /** Attempt number this score was calculated for */
  attempt_number: number;

  /** Number of steps that passed */
  steps_passed: number;

  /** Total number of steps */
  total_steps: number;

  /** Penalty applied for this attempt */
  penalty_applied: number;

  /** Whether first attempt bonus was applied */
  bonus_applied: boolean;

  /** Breakdown of score per step */
  step_breakdown: StepScore[];

  /** Whether minimum score floor was applied */
  minimum_floor_applied: boolean;
}

/**
 * Score breakdown for individual validation steps
 */
export interface StepScore {
  /** Step number (1-based) */
  stepNumber: number;

  /** Whether this step passed */
  passed: boolean;

  /** Points awarded for this step */
  points: number;

  /** Percentage of total score this step represents */
  percentage: number;

  /** Weight of this step (if custom weights are used) */
  weight: number;
}

/**
 * Default scoring configuration
 */
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  basePoints: 10,
  penaltyPerAttempt: 7.5,
  minimumScorePercent: 20,
  firstAttemptBonus: 5,
  maxAttempts: 5
};

/**
 * Predefined scoring configurations for different question types
 */
export const SCORING_PRESETS = {
  /** Basic validation questions (10 points) */
  BASIC: {
    ...DEFAULT_SCORING_CONFIG,
    basePoints: 10
  },

  /** Intermediate validation questions (15 points) */
  INTERMEDIATE: {
    ...DEFAULT_SCORING_CONFIG,
    basePoints: 15,
    penaltyPerAttempt: 10
  },

  /** Advanced validation questions (20 points) */
  ADVANCED: {
    ...DEFAULT_SCORING_CONFIG,
    basePoints: 20,
    penaltyPerAttempt: 12.5,
    minimumScorePercent: 25
  },

  /** Critical validation questions (25 points) */
  CRITICAL: {
    ...DEFAULT_SCORING_CONFIG,
    basePoints: 25,
    penaltyPerAttempt: 15,
    minimumScorePercent: 30,
    maxAttempts: 3
  }
} as const;

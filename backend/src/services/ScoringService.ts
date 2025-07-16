import {
  ScoringConfig,
  ValidationResult,
  ScoreResult,
  StepScore,
  DEFAULT_SCORING_CONFIG
} from '../interfaces/IScoring';

/**
 * Enhanced Scoring Service
 *
 * Implements a sophisticated scoring algorithm that:
 * 1. Distributes points equally among validation steps (or uses custom weights)
 * 2. Applies progressive penalties for multiple attempts
 * 3. Maintains a minimum score floor to encourage learning
 * 4. Provides bonus points for first-attempt success
 * 5. Tracks detailed score breakdowns for analytics
 *
 * Algorithm Details:
 * - Base Score: 100% divided among validation steps
 * - Attempt Penalty: Configurable percentage per attempt (default 7.5%)
 * - Minimum Floor: Prevents scores below configured minimum (default 20%)
 * - First Attempt Bonus: Additional percentage for perfect first try (default 5%)
 *
 * Example Calculation:
 * Question: 3 steps, 10 points, Attempt 2, 2 steps passed
 * 1. Base per step: 100/3 = 33.33%
 * 2. Attempt penalty: (2-1) × 7.5% = 7.5%
 * 3. Attempt multiplier: (100-7.5)/100 = 0.925
 * 4. Step scores: 33.33% × 0.925 × 2 passed steps = 61.66%
 * 5. Final score: 61.66% × 10 points = 6.17 points
 */
export class ScoringService {

  /**
   * Calculate score for a validation attempt
   * @param result Validation result data
   * @returns Detailed score calculation result
   */
  public static calculateScore(result: ValidationResult): ScoreResult {
    const { stepsPassed, totalSteps, attemptNumber, config } = result;

    // Validate inputs
    this.validateInputs(result);

    // Calculate step weights (equal distribution or custom weights)
    const stepWeights = this.calculateStepWeights(totalSteps, config.stepWeights);

    // Calculate attempt penalty multiplier
    const { penaltyApplied, attemptMultiplier, minFloorApplied } = this.calculateAttemptPenalty(
      attemptNumber,
      config
    );

    // Calculate individual step scores
    const stepBreakdown = this.calculateStepBreakdown(
      stepsPassed,
      totalSteps,
      stepWeights,
      attemptMultiplier,
      result.passedSteps
    );

    // Sum up the total percentage
    const basePercentage = stepBreakdown.reduce((sum, step) => sum + step.percentage, 0);

    // Apply first attempt bonus if applicable
    const { finalPercentage, bonusApplied } = this.applyFirstAttemptBonus(
      basePercentage,
      attemptNumber,
      stepsPassed,
      totalSteps,
      config
    );

    // Calculate final points
    const finalScore = (finalPercentage / 100) * config.basePoints;

    return {
      score_percent: Math.round(finalPercentage * 100) / 100,
      final_score: Math.round(finalScore * 100) / 100,
      attempt_number: attemptNumber,
      steps_passed: stepsPassed,
      total_steps: totalSteps,
      penalty_applied: penaltyApplied,
      bonus_applied: bonusApplied,
      step_breakdown: stepBreakdown,
      minimum_floor_applied: minFloorApplied
    };
  }

  /**
   * Validate input parameters
   */
  private static validateInputs(result: ValidationResult): void {
    const { stepsPassed, totalSteps, attemptNumber, config } = result;

    if (stepsPassed < 0 || stepsPassed > totalSteps) {
      throw new Error(`Invalid stepsPassed: ${stepsPassed}. Must be between 0 and ${totalSteps}`);
    }

    if (totalSteps <= 0) {
      throw new Error(`Invalid totalSteps: ${totalSteps}. Must be greater than 0`);
    }

    if (attemptNumber <= 0) {
      throw new Error(`Invalid attemptNumber: ${attemptNumber}. Must be greater than 0`);
    }

    if (config.basePoints <= 0) {
      throw new Error(`Invalid basePoints: ${config.basePoints}. Must be greater than 0`);
    }
  }

  /**
   * Calculate step weights (equal distribution or custom)
   */
  private static calculateStepWeights(totalSteps: number, customWeights?: number[]): number[] {
    if (customWeights && customWeights.length === totalSteps) {
      // Normalize custom weights to sum to 100
      const totalWeight = customWeights.reduce((sum, weight) => sum + weight, 0);
      return customWeights.map(weight => (weight / totalWeight) * 100);
    }

    // Equal distribution
    const equalWeight = 100 / totalSteps;
    return Array(totalSteps).fill(equalWeight);
  }

  /**
   * Calculate attempt penalty and multiplier
   */
  private static calculateAttemptPenalty(
    attemptNumber: number,
    config: ScoringConfig
  ): { penaltyApplied: number; attemptMultiplier: number; minFloorApplied: boolean } {
    const penaltyApplied = (attemptNumber - 1) * config.penaltyPerAttempt;
    const calculatedMultiplier = (100 - penaltyApplied) / 100;
    const minimumMultiplier = config.minimumScorePercent / 100;

    const attemptMultiplier = Math.max(calculatedMultiplier, minimumMultiplier);
    const minFloorApplied = attemptMultiplier === minimumMultiplier && calculatedMultiplier < minimumMultiplier;

    return {
      penaltyApplied,
      attemptMultiplier,
      minFloorApplied
    };
  }

  /**
   * Calculate score breakdown for each validation step
   */
  private static calculateStepBreakdown(
    stepsPassed: number,
    totalSteps: number,
    stepWeights: number[],
    attemptMultiplier: number,
    passedSteps?: number[]
  ): StepScore[] {
    const breakdown: StepScore[] = [];

    for (let i = 0; i < totalSteps; i++) {
      const stepNumber = i + 1;
      const weight = stepWeights[i];

      // Determine if this step passed
      let passed: boolean;
      if (passedSteps && passedSteps.length > 0) {
        // Use explicit passed steps array
        passed = passedSteps.includes(stepNumber);
      } else {
        // Assume first N steps passed (simple case)
        passed = stepNumber <= stepsPassed;
      }

      const basePercentage = passed ? weight : 0;
      const adjustedPercentage = basePercentage * attemptMultiplier;
      const points = (adjustedPercentage / 100) * (weight / 100);

      breakdown.push({
        stepNumber,
        passed,
        points: Math.round(points * 10000) / 10000, // 4 decimal precision
        percentage: Math.round(adjustedPercentage * 100) / 100,
        weight: Math.round(weight * 100) / 100
      });
    }

    return breakdown;
  }

  /**
   * Apply first attempt bonus if conditions are met
   */
  private static applyFirstAttemptBonus(
    basePercentage: number,
    attemptNumber: number,
    stepsPassed: number,
    totalSteps: number,
    config: ScoringConfig
  ): { finalPercentage: number; bonusApplied: boolean } {
    // Apply bonus only on first attempt with perfect score
    const isPerfectFirstAttempt = attemptNumber === 1 && stepsPassed === totalSteps;

    if (isPerfectFirstAttempt && config.firstAttemptBonus > 0) {
      const bonusMultiplier = 1 + (config.firstAttemptBonus / 100);
      const finalPercentage = Math.min(basePercentage * bonusMultiplier, 100);

      return {
        finalPercentage,
        bonusApplied: true
      };
    }

    return {
      finalPercentage: basePercentage,
      bonusApplied: false
    };
  }

  /**
   * Get scoring configuration for a specific question type
   */
  public static getScoringConfig(
    questionType: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'CRITICAL',
    customOverrides?: Partial<ScoringConfig>
  ): ScoringConfig {
    const presets = {
      BASIC: { ...DEFAULT_SCORING_CONFIG, basePoints: 10 },
      INTERMEDIATE: { ...DEFAULT_SCORING_CONFIG, basePoints: 15, penaltyPerAttempt: 10 },
      ADVANCED: {
        ...DEFAULT_SCORING_CONFIG,
        basePoints: 20,
        penaltyPerAttempt: 12.5,
        minimumScorePercent: 25
      },
      CRITICAL: {
        ...DEFAULT_SCORING_CONFIG,
        basePoints: 25,
        penaltyPerAttempt: 15,
        minimumScorePercent: 30,
        maxAttempts: 3
      }
    };

    return {
      ...presets[questionType],
      ...customOverrides
    };
  }

  /**
   * Calculate what score would be achieved with different attempt numbers
   * Useful for showing users potential score degradation
   */
  public static calculateScoreProjection(
    stepsPassed: number,
    totalSteps: number,
    config: ScoringConfig,
    maxAttempts: number = 5
  ): ScoreResult[] {
    const projections: ScoreResult[] = [];

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result: ValidationResult = {
        stepsPassed,
        totalSteps,
        attemptNumber: attempt,
        config
      };

      projections.push(this.calculateScore(result));
    }

    return projections;
  }
}

/**
 * Enhanced Scoring Utilities
 *
 * This module provides utility functions and examples for implementing
 * the enhanced scoring system in validation controllers.
 *
 * The enhanced scoring system provides:
 * - Progressive penalties for multiple attempts
 * - Configurable scoring based on question difficulty
 * - Detailed step breakdown and analytics
 * - Minimum score floors to encourage learning
 * - First attempt bonuses for perfect performance
 */

import { ValidationContext } from '../services/ValidationTrackingService';
import { ScoringConfig, SCORING_PRESETS } from '../interfaces/IScoring';

/**
 * Scoring utility class for controllers
 */
export class ScoringUtils {

  /**
   * Create a validation context with enhanced scoring configuration
   *
   * @param baseContext - Basic validation context
   * @param questionType - Type of question for automatic preset selection
   * @param customConfig - Custom scoring configuration (overrides preset)
   * @returns Enhanced validation context with scoring configuration
   *
   * @example
   * ```typescript
   * const context = ScoringUtils.createScoringContext(baseContext, 'INTERMEDIATE');
   * await this.trackingService.executeValidationWithSocketTracking(context, validationFunction);
   * ```
   */
  static createScoringContext(
    baseContext: Omit<ValidationContext, 'scoringConfig' | 'questionType'>,
    questionType: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'CRITICAL' = 'BASIC',
    customConfig?: Partial<ScoringConfig>
  ): ValidationContext {
    return {
      ...baseContext,
      questionType,
      scoringConfig: customConfig ? {
        ...SCORING_PRESETS[questionType],
        ...customConfig
      } : undefined
    };
  }

  /**
   * Create a custom scoring configuration
   *
   * @param basePoints - Points awarded for perfect completion
   * @param options - Additional scoring options
   * @returns Custom scoring configuration
   *
   * @example
   * ```typescript
   * const config = ScoringUtils.createCustomConfig(25, {
   *   penaltyPerAttempt: 10,
   *   maxAttempts: 4,
   *   stepWeights: [40, 30, 30] // Custom weights for 3 steps
   * });
   * ```
   */
  static createCustomConfig(
    basePoints: number,
    options: {
      penaltyPerAttempt?: number;
      minimumScorePercent?: number;
      firstAttemptBonus?: number;
      maxAttempts?: number;
      stepWeights?: number[];
    } = {}
  ): ScoringConfig {
    return {
      basePoints,
      penaltyPerAttempt: options.penaltyPerAttempt ?? 7.5,
      minimumScorePercent: options.minimumScorePercent ?? 20,
      firstAttemptBonus: options.firstAttemptBonus ?? 5,
      maxAttempts: options.maxAttempts ?? 5,
      stepWeights: options.stepWeights
    };
  }

  /**
   * Get scoring configuration presets
   */
  static getPresets() {
    return SCORING_PRESETS;
  }
}

/**
 * Example implementations for different controller types
 */
export class ScoringExamples {

  /**
   * Example: Basic validation with default scoring
   * Perfect for simple file checks, basic commands, etc.
   */
  static basicValidationExample = `
    async performBasicValidation(baseContext: ValidationContext): Promise<void> {
      // Use basic scoring (10 points, 7.5% penalty per attempt)
      const context = ScoringUtils.createScoringContext(baseContext, 'BASIC');

      await this.trackingService.executeValidationWithSocketTracking(
        context,
        async (socket) => {
          socket.emit('validation-step', { step: 'Checking file existence', status: 'running' });
          const fileExists = await this.service.checkFileExists('/etc/hosts');
          socket.emit('validation-step', {
            step: 'Checking file existence',
            status: fileExists ? 'success' : 'failed',
            message: fileExists ? 'File exists' : 'File not found'
          });

          return fileExists;
        }
      );
    }
  `;

  /**
   * Example: Intermediate validation with custom penalties
   * Good for multi-step configurations, service setups, etc.
   */
  static intermediateValidationExample = `
    async performIntermediateValidation(baseContext: ValidationContext): Promise<void> {
      // Use intermediate scoring with custom penalty
      const context = ScoringUtils.createScoringContext(
        baseContext,
        'INTERMEDIATE',
        { penaltyPerAttempt: 12.5 } // Higher penalty for complex tasks
      );

      await this.trackingService.executeValidationWithSocketTracking(
        context,
        async (socket) => {
          let allPassed = true;

          // Step 1: Service configuration
          socket.emit('validation-step', { step: 'Checking service configuration', status: 'running' });
          const configValid = await this.service.validateConfig();
          socket.emit('validation-step', {
            step: 'Checking service configuration',
            status: configValid ? 'success' : 'failed'
          });
          allPassed = allPassed && configValid;

          // Step 2: Service status
          socket.emit('validation-step', { step: 'Checking service status', status: 'running' });
          const serviceActive = await this.service.isServiceActive();
          socket.emit('validation-step', {
            step: 'Checking service status',
            status: serviceActive ? 'success' : 'failed'
          });
          allPassed = allPassed && serviceActive;

          return allPassed;
        }
      );
    }
  `;

  /**
   * Example: Advanced validation with weighted steps
   * Perfect for complex system configurations where some steps are more critical
   */
  static advancedValidationExample = `
    async performAdvancedValidation(baseContext: ValidationContext): Promise<void> {
      // Use advanced scoring with custom step weights
      const context = ScoringUtils.createScoringContext(
        baseContext,
        'ADVANCED',
        {
          stepWeights: [50, 30, 20], // Critical config=50%, Service=30%, Verification=20%
          maxAttempts: 4
        }
      );

      await this.trackingService.executeValidationWithSocketTracking(
        context,
        async (socket) => {
          let allPassed = true;

          // Critical Step (50% weight): Core configuration
          socket.emit('validation-step', { step: 'Validating core configuration', status: 'running' });
          const coreConfig = await this.service.validateCoreConfig();
          socket.emit('validation-step', {
            step: 'Validating core configuration',
            status: coreConfig ? 'success' : 'failed',
            message: coreConfig ? 'Core configuration valid' : 'Core configuration has errors'
          });
          allPassed = allPassed && coreConfig;

          // Important Step (30% weight): Service management
          socket.emit('validation-step', { step: 'Checking service management', status: 'running' });
          const serviceManagement = await this.service.validateServiceManagement();
          socket.emit('validation-step', {
            step: 'Checking service management',
            status: serviceManagement ? 'success' : 'failed'
          });
          allPassed = allPassed && serviceManagement;

          // Verification Step (20% weight): Final verification
          socket.emit('validation-step', { step: 'Running final verification', status: 'running' });
          const finalVerification = await this.service.runFinalVerification();
          socket.emit('validation-step', {
            step: 'Running final verification',
            status: finalVerification ? 'success' : 'failed'
          });
          allPassed = allPassed && finalVerification;

          return allPassed;
        }
      );
    }
  `;

  /**
   * Example: Critical validation with strict penalties
   * For security-critical tasks, system-critical configurations, etc.
   */
  static criticalValidationExample = `
    async performCriticalValidation(baseContext: ValidationContext): Promise<void> {
      // Use critical scoring with strict penalties and limited attempts
      const context = ScoringUtils.createScoringContext(
        baseContext,
        'CRITICAL',
        {
          penaltyPerAttempt: 20, // Heavy penalty
          maxAttempts: 3,        // Limited attempts
          minimumScorePercent: 40 // Higher minimum score
        }
      );

      await this.trackingService.executeValidationWithSocketTracking(
        context,
        async (socket) => {
          // Critical validations with detailed error reporting
          let allPassed = true;

          socket.emit('validation-step', { step: 'Security configuration validation', status: 'running' });
          const securityValid = await this.service.validateSecurityConfig();
          socket.emit('validation-step', {
            step: 'Security configuration validation',
            status: securityValid ? 'success' : 'failed',
            message: securityValid ? 'Security configuration compliant' : 'CRITICAL: Security vulnerabilities detected'
          });
          allPassed = allPassed && securityValid;

          return allPassed;
        }
      );
    }
  `;
}

/**
 * Migration guide for existing controllers
 */
export const MIGRATION_GUIDE = {
  description: `
    To migrate existing controllers to use enhanced scoring:

    1. Import ScoringUtils:
       import { ScoringUtils } from '../utils/ScoringUtils';

    2. Update your validation context creation:
       // Before
       const context = { socket, questionId, validationQuestionId, userId, labId, labEnrollmentId };

       // After
       const context = ScoringUtils.createScoringContext(
         { socket, questionId, validationQuestionId, userId, labId, labEnrollmentId },
         'INTERMEDIATE' // or BASIC, ADVANCED, CRITICAL
       );

    3. Optional: Use custom scoring for special cases:
       const context = ScoringUtils.createScoringContext(
         baseContext,
         'BASIC',
         { basePoints: 15, penaltyPerAttempt: 10 }
       );

    4. The rest of your validation logic remains unchanged!
  `,

  examples: {
    before: `
      await this.trackingService.executeValidationWithSocketTracking(
        { socket, questionId, validationQuestionId, userId, labId, labEnrollmentId },
        validationFunction
      );
    `,

    after: `
      const context = ScoringUtils.createScoringContext(
        { socket, questionId, validationQuestionId, userId, labId, labEnrollmentId },
        'INTERMEDIATE'
      );

      await this.trackingService.executeValidationWithSocketTracking(
        context,
        validationFunction
      );
    `
  }
};

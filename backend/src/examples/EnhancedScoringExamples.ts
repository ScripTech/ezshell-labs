/**
 * Enhanced Scoring Implementation Example
 * 
 * This file demonstrates how to update the BasicValidationController
 * to use the new enhanced scoring system.
 * 
 * This shows the before/after comparison and can serve as a template
 * for updating other controllers.
 */

import { Socket } from 'socket.io';
import { ValidationTrackingService } from '../../services/ValidationTrackingService';
import { BasicValidationService } from '../../services/ex200/BasicValidationService';
import { ScoringUtils } from '../../utils/ScoringUtils';

export class EnhancedBasicValidationController {
  private trackingService: ValidationTrackingService;
  private basicValidationService: BasicValidationService;

  constructor() {
    this.trackingService = new ValidationTrackingService();
    this.basicValidationService = new BasicValidationService();
  }

  /**
   * EXAMPLE 1: Basic tar validation with BASIC scoring preset
   * Perfect for simple file existence checks
   */
  async performTarValidation(
    socket: Socket,
    questionId: string,
    validationQuestionId: string,
    userId: string,
    labId: string,
    labEnrollmentId: string
  ): Promise<void> {
    // Create enhanced scoring context with BASIC preset (10 points, 7.5% penalty)
    const context = ScoringUtils.createScoringContext(
      { socket, questionId, validationQuestionId, userId, labId, labEnrollmentId },
      'BASIC'  // 10 points, 7.5% penalty per attempt, 20% minimum score
    );

    await this.trackingService.executeValidationWithSocketTracking(
      context,
      async (socket) => {
        socket.emit('validation-step', { 
          step: 'Checking tar archive existence', 
          status: 'running' 
        });

        const tarExists = await this.basicValidationService.tarValidation();
        
        socket.emit('validation-step', { 
          step: 'Checking tar archive existence', 
          status: tarExists ? 'success' : 'failed',
          message: tarExists 
            ? 'Tar archive /root/myetcbackup.tar.bz2 found successfully'
            : 'Tar archive /root/myetcbackup.tar.bz2 not found. Please create the archive.'
        });

        return tarExists;
      }
    );
  }

  /**
   * EXAMPLE 2: File permissions validation with INTERMEDIATE scoring
   * Multi-step validation with moderate complexity
   */
  async performFilePermissionsValidation(
    socket: Socket,
    questionId: string,
    validationQuestionId: string,
    userId: string,
    labId: string,
    labEnrollmentId: string
  ): Promise<void> {
    // Create enhanced scoring context with INTERMEDIATE preset
    const context = ScoringUtils.createScoringContext(
      { socket, questionId, validationQuestionId, userId, labId, labEnrollmentId },
      'INTERMEDIATE', // 15 points, 10% penalty per attempt
      {
        // Custom configuration: File permissions are important, so higher penalty
        penaltyPerAttempt: 12.5,
        // Step weights: Owner/group verification is most critical
        stepWeights: [40, 40, 20] // ownership=40%, group=40%, not-executable=20%
      }
    );

    await this.trackingService.executeValidationWithSocketTracking(
      context,
      async (socket) => {
        let allPassed = true;

        // Step 1: Check file ownership (40% weight)
        socket.emit('validation-step', { 
          step: 'Verifying file ownership', 
          status: 'running' 
        });
        
        const ownedByRoot = await this.basicValidationService.filePermissionsValidation_OwnedBy('root');
        socket.emit('validation-step', { 
          step: 'Verifying file ownership', 
          status: ownedByRoot ? 'success' : 'failed',
          message: ownedByRoot 
            ? 'File is correctly owned by root'
            : 'File must be owned by root user'
        });
        allPassed = allPassed && ownedByRoot;

        // Step 2: Check group ownership (40% weight)
        socket.emit('validation-step', { 
          step: 'Verifying group ownership', 
          status: 'running' 
        });
        
        const belongsToRoot = await this.basicValidationService.filePermissionsValidation_BelongsTO('root');
        socket.emit('validation-step', { 
          step: 'Verifying group ownership', 
          status: belongsToRoot ? 'success' : 'failed',
          message: belongsToRoot 
            ? 'File belongs to root group'
            : 'File must belong to root group'
        });
        allPassed = allPassed && belongsToRoot;

        // Step 3: Check not executable (20% weight)
        socket.emit('validation-step', { 
          step: 'Verifying file is not executable', 
          status: 'running' 
        });
        
        const notExecutable = await this.basicValidationService.filePermissionsValidation_NotExec();
        socket.emit('validation-step', { 
          step: 'Verifying file is not executable', 
          status: notExecutable ? 'success' : 'failed',
          message: notExecutable 
            ? 'File correctly lacks execute permissions'
            : 'File should not have execute permissions'
        });
        allPassed = allPassed && notExecutable;

        return allPassed;
      }
    );
  }

  /**
   * EXAMPLE 3: Time synchronization with ADVANCED scoring
   * Complex system configuration validation
   */
  async performTimeSynchronizationValidation(
    socket: Socket,
    questionId: string,
    validationQuestionId: string,
    userId: string,
    labId: string,
    labEnrollmentId: string
  ): Promise<void> {
    // Create enhanced scoring context with ADVANCED preset
    const context = ScoringUtils.createScoringContext(
      { socket, questionId, validationQuestionId, userId, labId, labEnrollmentId },
      'ADVANCED', // 20 points, 12.5% penalty per attempt, 25% minimum
      {
        // Custom configuration for system services
        penaltyPerAttempt: 15, // Higher penalty for system configuration
        maxAttempts: 4,        // Limited attempts for advanced tasks
        stepWeights: [70, 30]  // Service active=70%, NTP config=30%
      }
    );

    await this.trackingService.executeValidationWithSocketTracking(
      context,
      async (socket) => {
        let allPassed = true;

        // Step 1: Check chronyd service status (70% weight - most critical)
        socket.emit('validation-step', { 
          step: 'Checking chronyd service status', 
          status: 'running' 
        });
        
        const serviceActive = await this.basicValidationService.timeSynchronizationValidation();
        socket.emit('validation-step', { 
          step: 'Checking chronyd service status', 
          status: serviceActive ? 'success' : 'failed',
          message: serviceActive 
            ? 'chronyd service is active and properly configured'
            : 'chronyd service must be active and configured with classroom.example.com'
        });
        allPassed = allPassed && serviceActive;

        // Step 2: Verify NTP server configuration (30% weight)
        socket.emit('validation-step', { 
          step: 'Verifying NTP server configuration', 
          status: 'running' 
        });
        
        // This step is already included in timeSynchronizationValidation,
        // but we're demonstrating how to break it down for detailed scoring
        const ntpConfigured = serviceActive; // Simplified for demo
        socket.emit('validation-step', { 
          step: 'Verifying NTP server configuration', 
          status: ntpConfigured ? 'success' : 'failed',
          message: ntpConfigured 
            ? 'NTP server classroom.example.com is properly configured'
            : 'NTP server must be configured to use classroom.example.com'
        });
        allPassed = allPassed && ntpConfigured;

        return allPassed;
      }
    );
  }

  /**
   * EXAMPLE 4: Tuned profile validation with CRITICAL scoring
   * High-stakes system performance configuration
   */
  async performTunedProfileValidation(
    socket: Socket,
    questionId: string,
    validationQuestionId: string,
    userId: string,
    labId: string,
    labEnrollmentId: string
  ): Promise<void> {
    // Create enhanced scoring context with CRITICAL preset
    const context = ScoringUtils.createScoringContext(
      { socket, questionId, validationQuestionId, userId, labId, labEnrollmentId },
      'CRITICAL', // 25 points, 15% penalty per attempt, 30% minimum, 3 max attempts
      {
        // Critical system configuration requires strict scoring
        penaltyPerAttempt: 20,   // Heavy penalty for wrong attempts
        minimumScorePercent: 40, // Higher minimum to ensure competency
        maxAttempts: 3,          // Limited attempts for critical tasks
        firstAttemptBonus: 10    // Higher bonus for getting it right first time
      }
    );

    await this.trackingService.executeValidationWithSocketTracking(
      context,
      async (socket) => {
        socket.emit('validation-step', { 
          step: 'Validating tuned profile configuration', 
          status: 'running' 
        });

        const tunedConfigured = await this.basicValidationService.tunedProfileValidation();
        
        socket.emit('validation-step', { 
          step: 'Validating tuned profile configuration', 
          status: tunedConfigured ? 'success' : 'failed',
          message: tunedConfigured 
            ? 'Tuned service is active with recommended profile applied'
            : 'CRITICAL: Tuned service must be active with recommended profile for optimal system performance'
        });

        return tunedConfigured;
      }
    );
  }

  /**
   * EXAMPLE 5: Custom scoring for special cases
   * Dynamic scoring based on user context or question complexity
   */
  async performCustomScoredValidation(
    socket: Socket,
    questionId: string,
    validationQuestionId: string,
    userId: string,
    labId: string,
    labEnrollmentId: string,
    userLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ): Promise<void> {
    // Create custom scoring configuration based on user level
    const customConfig = this.getCustomScoringForUser(userLevel);
    
    const context = ScoringUtils.createScoringContext(
      { socket, questionId, validationQuestionId, userId, labId, labEnrollmentId },
      'BASIC', // Base preset
      customConfig // Override with custom configuration
    );

    await this.trackingService.executeValidationWithSocketTracking(
      context,
      async (socket) => {
        // Multi-step validation with custom scoring
        let allPassed = true;

        // Custom validation steps based on user level
        const steps = this.getValidationStepsForUser(userLevel);
        
        for (const step of steps) {
          socket.emit('validation-step', { 
            step: step.description, 
            status: 'running' 
          });

          const result = await step.validation();
          
          socket.emit('validation-step', { 
            step: step.description, 
            status: result ? 'success' : 'failed',
            message: result ? step.successMessage : step.failureMessage
          });

          allPassed = allPassed && result;
        }

        return allPassed;
      }
    );
  }

  /**
   * Helper: Get custom scoring configuration based on user level
   */
  private getCustomScoringForUser(userLevel: string) {
    switch (userLevel) {
      case 'beginner':
        return {
          basePoints: 8,
          penaltyPerAttempt: 5,    // Gentler penalties
          minimumScorePercent: 40, // Higher safety net
          maxAttempts: 6,          // More chances to learn
          firstAttemptBonus: 15    // Bigger reward for success
        };

      case 'advanced':
        return {
          basePoints: 25,
          penaltyPerAttempt: 20,   // Stricter penalties
          minimumScorePercent: 15, // Lower safety net
          maxAttempts: 3,          // Fewer chances
          firstAttemptBonus: 5     // Smaller bonus
        };

      default: // intermediate
        return {
          basePoints: 15,
          penaltyPerAttempt: 10,
          minimumScorePercent: 25,
          maxAttempts: 4,
          firstAttemptBonus: 8
        };
    }
  }

  /**
   * Helper: Get validation steps based on user level
   */
  private getValidationStepsForUser(userLevel: string) {
    const baseSteps = [
      {
        description: 'Basic file validation',
        validation: () => this.basicValidationService.tarValidation(),
        successMessage: 'File validation passed',
        failureMessage: 'File validation failed'
      }
    ];

    if (userLevel === 'advanced') {
      baseSteps.push(
        {
          description: 'Advanced time synchronization',
          validation: () => this.basicValidationService.timeSynchronizationValidation(),
          successMessage: 'Time synchronization configured correctly',
          failureMessage: 'Time synchronization configuration failed'
        },
        {
          description: 'System tuning validation',
          validation: () => this.basicValidationService.tunedProfileValidation(),
          successMessage: 'System tuning profile applied successfully',
          failureMessage: 'System tuning profile not properly configured'
        }
      );
    }

    return baseSteps;
  }
}

/**
 * MIGRATION COMPARISON
 * 
 * Here's how the controller methods change with enhanced scoring:
 */

// BEFORE: Legacy implementation
/*
async performTarValidation(socket, questionId, validationQuestionId, userId, labId, labEnrollmentId) {
  await this.trackingService.executeValidationWithSocketTracking(
    { socket, questionId, validationQuestionId, userId, labId, labEnrollmentId },
    async (socket) => {
      // validation logic here...
      return result;
    }
  );
}
*/

// AFTER: Enhanced scoring implementation
/*
async performTarValidation(socket, questionId, validationQuestionId, userId, labId, labEnrollmentId) {
  const context = ScoringUtils.createScoringContext(
    { socket, questionId, validationQuestionId, userId, labId, labEnrollmentId },
    'BASIC' // Just add this line to specify scoring type!
  );

  await this.trackingService.executeValidationWithSocketTracking(
    context, // Use enhanced context instead of plain object
    async (socket) => {
      // Same validation logic - no changes needed!
      return result;
    }
  );
}
*/

/**
 * BENEFITS OF THE ENHANCED SCORING SYSTEM:
 * 
 * 1. MINIMAL CODE CHANGES: Just add ScoringUtils.createScoringContext()
 * 2. FLEXIBLE CONFIGURATION: Choose presets or customize scoring
 * 3. BETTER UX: Students get detailed feedback and fair progression
 * 4. RICH ANALYTICS: Detailed scoring breakdown for analysis
 * 5. BACKWARD COMPATIBLE: Legacy scores still available
 * 6. EDUCATIONAL FOCUS: Minimum scores prevent complete failure
 * 7. PERFORMANCE INCENTIVES: Bonuses for first-attempt success
 */

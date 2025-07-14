import { Socket } from 'socket.io';
import { ValidationTaskService } from '../services/ValidationTaskService';
import { NetworkValidationExecutor } from '../services/executors/NetworkValidationExecutor';
import { ValidationContext, ValidationResult } from '../interfaces/IValidationTypes';

export class WebSocketValidationService {
  private validationService: ValidationTaskService;

  constructor() {
    this.validationService = new ValidationTaskService();

    // Register executors
    this.validationService.registerExecutor(new NetworkValidationExecutor());
  }

  /**
   * Handle real-time validation with WebSocket feedback
   */
  async handleValidationWithRealTimeUpdates(
    socket: Socket,
    taskId: string,
    context: ValidationContext
  ): Promise<void> {
    try {
      // Emit validation started
      socket.emit('validation-started', {
        taskId,
        message: 'Validation started...',
        timestamp: new Date().toISOString()
      });

      // Get validation configuration
      const config = await this.validationService.getTaskValidationConfig(taskId);

      if (!config) {
        socket.emit('validation-error', {
          taskId,
          error: 'Task validation configuration not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Emit validation progress info
      socket.emit('validation-progress', {
        taskId,
        totalSteps: config.steps.length,
        currentStep: 0,
        message: `Found ${config.steps.length} validation steps`,
        timestamp: new Date().toISOString()
      });

      const results: ValidationResult[] = [];
      let currentStep = 0;

      // Execute each validation step and provide real-time feedback
      for (const step of config.steps) {
        currentStep++;

        // Emit step started
        socket.emit('validation-step-started', {
          taskId,
          stepId: step.id,
          stepNumber: currentStep,
          totalSteps: config.steps.length,
          description: step.description || `Executing ${step.method}`,
          timestamp: new Date().toISOString()
        });

        try {
          // Execute the validation step
          const executor = this.validationService.getExecutor(step.type);
          if (!executor) {
            throw new Error(`No executor found for validation type: ${step.type}`);
          }

          const result = await executor.executeStep(step, context);
          results.push(result);

          // Emit step completed with result
          socket.emit('validation-step-completed', {
            taskId,
            stepId: step.id,
            stepNumber: currentStep,
            success: result.success,
            score: result.score,
            maxScore: result.maxScore,
            message: result.message,
            details: result.details,
            executionTime: result.executionTime,
            timestamp: new Date().toISOString()
          });

        } catch (stepError) {
          // Handle step error
          const errorResult: ValidationResult = {
            stepId: step.id,
            success: false,
            score: 0,
            maxScore: step.weight || 1,
            message: `Step execution failed: ${stepError instanceof Error ? stepError.message : 'Unknown error'}`
          };
          results.push(errorResult);

          socket.emit('validation-step-error', {
            taskId,
            stepId: step.id,
            stepNumber: currentStep,
            error: errorResult.message,
            timestamp: new Date().toISOString()
          });
        }

        // Emit progress update
        socket.emit('validation-progress', {
          taskId,
          totalSteps: config.steps.length,
          currentStep,
          completedSteps: currentStep,
          message: `Completed step ${currentStep} of ${config.steps.length}`,
          timestamp: new Date().toISOString()
        });
      }

      // Calculate final summary
      const summary = this.calculateValidationSummary(taskId, context.userId, config, results);

      // Emit validation completed
      socket.emit('validation-completed', {
        taskId,
        userId: context.userId,
        summary: {
          passed: summary.passed,
          totalScore: summary.totalScore,
          maxScore: summary.maxScore,
          completedSteps: summary.completedSteps,
          totalSteps: summary.totalSteps,
          passingScore: config.passingScore || 0.7,
          results: summary.results
        },
        timestamp: new Date().toISOString()
      });

      // Also emit legacy format for backward compatibility
      socket.emit('validation-result', {
        labId: context.labId,
        questionId: taskId,
        success: summary.passed,
        score: summary.totalScore,
        maxScore: summary.maxScore,
        message: summary.passed ? 'Validation passed!' : 'Validation failed',
        details: summary.results,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      // Handle service-level errors
      socket.emit('validation-error', {
        taskId,
        error: error instanceof Error ? error.message : 'Unknown validation error',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Calculate validation summary from results
   */
  private calculateValidationSummary(
    taskId: string,
    userId: string,
    config: any,
    results: ValidationResult[]
  ) {
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const maxScore = results.reduce((sum, r) => sum + r.maxScore, 0);
    const completedSteps = results.filter(r => r.success).length;
    const scorePercentage = maxScore > 0 ? totalScore / maxScore : 0;
    const passingScore = config.passingScore || 0.7;

    return {
      taskId,
      userId,
      totalScore,
      maxScore,
      passed: scorePercentage >= passingScore,
      completedSteps,
      totalSteps: results.length,
      results,
      executedAt: new Date()
    };
  }
}

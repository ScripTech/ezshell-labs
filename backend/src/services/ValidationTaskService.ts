import { db } from '../db';
import { labTasks } from '../db/schemas/LabSchema';
import { eq } from 'drizzle-orm';
import {
  ValidationConfig,
  ValidationContext,
  ValidationSummary,
  ValidationExecutor,
  ValidationResult
} from '../interfaces/IValidationTypes';

export class ValidationTaskService {
  private executors: Map<string, ValidationExecutor> = new Map();

  constructor() {
    // Executors will be registered here
  }

  /**
   * Register a validation executor for specific types
   */
  registerExecutor(executor: ValidationExecutor): void {
    for (const type of executor.getSupportedTypes()) {
      this.executors.set(type, executor);
    }
  }

  /**
   * Get lab task with validation configuration
   */
  async getTaskValidationConfig(taskId: string): Promise<ValidationConfig | null> {
    const tasks = await db
      .select()
      .from(labTasks)
      .where(eq(labTasks.id, taskId))
      .limit(1);

    if (tasks.length === 0) {
      return null;
    }

    const task = tasks[0];
    const validationSteps = task.validationSteps as any;

    if (!validationSteps || !validationSteps.steps) {
      return null;
    }

    return {
      steps: validationSteps.steps,
      totalPoints: task.points || 0,
      passingScore: validationSteps.passingScore || 0.7
    };
  }

  /**
   * Execute validation for a specific task
   */
  async executeValidation(
    taskId: string,
    context: ValidationContext
  ): Promise<ValidationSummary> {
    const config = await this.getTaskValidationConfig(taskId);

    if (!config) {
      throw new Error(`No validation configuration found for task ${taskId}`);
    }

    const results: ValidationResult[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // Execute each validation step
    for (const step of config.steps) {
      try {
        const executor = this.executors.get(step.type);

        if (!executor) {
          results.push({
            stepId: step.id,
            success: false,
            score: 0,
            maxScore: step.weight || 1,
            message: `No executor found for validation type: ${step.type}`
          });
          continue;
        }

        const result = await executor.executeStep(step, context);
        results.push(result);

        totalScore += result.score;
        maxScore += result.maxScore;

      } catch (error) {
        results.push({
          stepId: step.id,
          success: false,
          score: 0,
          maxScore: step.weight || 1,
          message: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    const passed = maxScore > 0 ? (totalScore / maxScore) >= (config.passingScore || 0.7) : false;

    return {
      taskId,
      userId: context.userId,
      totalScore,
      maxScore,
      passed,
      completedSteps: results.filter(r => r.success).length,
      totalSteps: config.steps.length,
      results,
      executedAt: new Date()
    };
  }

  /**
   * Get available validation types
   */
  getAvailableValidationTypes(): string[] {
    return Array.from(this.executors.keys());
  }

  /**
   * Get executor for a specific validation type
   */
  getExecutor(type: string): ValidationExecutor | undefined {
    return this.executors.get(type);
  }
}

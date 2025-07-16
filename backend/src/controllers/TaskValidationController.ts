import { Request, Response } from 'express';
import { ValidationTaskService } from '../services/ValidationTaskService';
import { NetworkValidationExecutor } from '../services/executors/NetworkValidationExecutor';

export class TaskValidationController {
  private validationService: ValidationTaskService;

  constructor() {
    this.validationService = new ValidationTaskService();

    // Register available executors
    this.validationService.registerExecutor(new NetworkValidationExecutor());
  }

  /**
   * Execute validation for a specific task
   */
  async executeTaskValidation(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const { userId, labId, sessionData } = req.body;

      if (!taskId || !userId || !labId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: taskId, userId, labId'
        });
      }

      const context = {
        taskId,
        userId,
        labId,
        sessionData,
        sshConfig: {
          host: process.env.LAB_SSH_HOST || 'localhost',
          port: parseInt(process.env.LAB_SSH_PORT || '22'),
          username: process.env.LAB_SSH_USERNAME || 'lab-user',
          password: process.env.LAB_SSH_PASSWORD || 'password'
        }
      };

      const summary = await this.validationService.executeValidation(taskId, context);

      res.status(200).json({
        success: true,
        data: summary,
        message: summary.passed ? 'Validation completed successfully' : 'Validation completed with failures'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Validation execution failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get validation configuration for a task
   */
  async getTaskValidationConfig(req: Request, res: Response) {
    try {
      const { taskId } = req.params;

      const config = await this.validationService.getTaskValidationConfig(taskId);

      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'Task validation configuration not found'
        });
      }

      res.status(200).json({
        success: true,
        data: config,
        message: 'Validation configuration retrieved successfully'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve validation configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get available validation types
   */
  async getAvailableValidationTypes(req: Request, res: Response) {
    try {
      const types = this.validationService.getAvailableValidationTypes();

      res.status(200).json({
        success: true,
        data: types,
        message: 'Available validation types retrieved successfully'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve validation types',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

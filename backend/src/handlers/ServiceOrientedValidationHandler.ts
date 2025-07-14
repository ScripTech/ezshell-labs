import { Socket } from 'socket.io';
import { WebSocketValidationService } from '../services/WebSocketValidationService';
import { ValidationContext } from '../interfaces/IValidationTypes';
import { ILabValidationHandler } from '../interfaces/ILabValidationHandler';

export class ServiceOrientedValidationHandler implements ILabValidationHandler {
  private webSocketValidationService: WebSocketValidationService;

  constructor() {
    this.webSocketValidationService = new WebSocketValidationService();
  }

  /**
   * Handle validation using the new service-oriented architecture
   * while maintaining compatibility with existing WebSocket interface
   */
  async handleValidation(socket: Socket, questionId: string, additionalContext?: any): Promise<void> {
    try {
      // Extract context information
      const context: ValidationContext = {
        taskId: questionId,
        userId: additionalContext?.userId || 'anonymous',
        labId: additionalContext?.labId || 'unknown',
        sessionData: additionalContext?.sessionData,
        sshConfig: {
          host: process.env.LAB_SSH_HOST || 'localhost',
          port: parseInt(process.env.LAB_SSH_PORT || '22'),
          username: process.env.LAB_SSH_USERNAME || 'lab-user',
          password: process.env.LAB_SSH_PASSWORD || 'password'
        }
      };

      // Use the new WebSocket validation service for real-time updates
      await this.webSocketValidationService.handleValidationWithRealTimeUpdates(
        socket,
        questionId,
        context
      );

    } catch (error) {
      // Handle any unexpected errors
      socket.emit('validation-error', {
        questionId,
        error: error instanceof Error ? error.message : 'Unknown validation error',
        timestamp: new Date().toISOString()
      });
    }
  }
}

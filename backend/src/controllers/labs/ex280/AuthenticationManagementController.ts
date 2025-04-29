import { Socket } from 'socket.io';
import { AuthenticationManagementService } from '../../../services/ex280/AuthenticationManagementService';
import { BaseLabController } from '../BaseLabController';

export class AuthenticationManagementController extends BaseLabController {
  constructor() {
      super(new AuthenticationManagementService());
    }

  async handleValidation(socket: Socket, questionId: string): Promise<void> {
    const steps = this.service.getSteps();

    try {
      // Emit initial loading state for all steps
      for (const step of steps) {
        await this.emitValidationStep(socket, questionId, step, "loading");
      }

      const result = await this.service.validate();
      const details = result.details as Record<string, boolean>;

      // Map validation results to steps
      const stepResults = {
        'HTPasswd Configuration': details.htpasswdSecret,
        'OAuth Configuration': details.oauthConfig,
        'Admin User Setup': details.adminUser && details.adminUserRole,
        'Developer User Setup': details.devUser,
        'Project Configuration': details.devProject,
        'Role Assignments': details.devUserRole
      };

      // Emit results for each step
      for (const [step, success] of Object.entries(stepResults)) {
         await this.emitValidationStep(
           socket,
           questionId,
           step,
           success ? "success" : "failed"
         );
      }

      // Emit final result
      socket.emit(`validation-${questionId}-complete`, {
        success: result.success,
        message: result.message
      });

    } catch (error: any) {
      // Handle errors by marking all steps as failed
      for (const step of steps) {
        socket.emit(`validation-${questionId}-step`, {
          step,
          status: 'failed'
        });
      }

      socket.emit(`validation-${questionId}-complete`, {
        success: false,
        message: `Validation failed: ${error.message}`
      });
    }
  }
}

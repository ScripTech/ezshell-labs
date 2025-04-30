import { Socket } from 'socket.io';
import { BaseLabController } from '../BaseLabController';
import { GroupRoleManagementService } from '../../../services/ex280/GroupRoleManagementService';

export class GroupRoleManagementController extends BaseLabController {
  constructor() {
    super(new GroupRoleManagementService());
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
        'Verify Group Creation': details.groups,
        'Check Group Membership': details.memberships,
        'Validate Group Roles': details.projectAccess,
        'Test Project Access': details.specialPermissions,
        'Check Resource Quotas': details.quotas
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
        await this.emitValidationStep(socket, questionId, step, "failed");
      }

      socket.emit(`validation-${questionId}-complete`, {
        success: false,
        message: `Validation failed: ${error.message}`
      });
    }
  }
}

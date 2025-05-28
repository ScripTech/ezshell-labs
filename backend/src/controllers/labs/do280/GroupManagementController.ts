// backend/src/controllers/labs/do280/GroupManagementController.ts
import { Socket } from "socket.io";
import { BaseLabController } from "../BaseLabController";
import { GroupManagementService } from "../../../services/do280/GroupManagementService";

export class GroupManagementController extends BaseLabController {
  constructor() {
    super(new GroupManagementService());
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
        'Group ex280-users Creation': details['group_ex280-users_exists'],
        'Group ex280-guests Creation': details['group_ex280-guests_exists'],

        'User qwerty in ex280-guests': details['user_qwerty_in_ex280-guests'],
        'User susan in ex280-users': details['user_susan_in_ex280-users'],
        'User harry in ex280-users': details['user_harry_in_ex280-users'],

        'ex280-users Edit Permission in ex280-test project':
          details['group_ex280-users_edit_in_ex280-test'],
        'ex280-guests View Permission in ex280-demo project':
          details['group_ex280-guests_view_in_ex280-demo']
      };

      // Log validation details for debugging
      console.log('Validation Details:', {
        details,
        stepResults
      });

      // Emit results for each step with detailed status
      for (const [step, success] of Object.entries(stepResults)) {
        await this.emitValidationStep(
          socket,
          questionId,
          step,
          success ? "success" : "failed"
        );

        // Log each step result
        console.log(`Step "${step}" validation result:`, success);
      }

      // Generate detailed message based on failures
      const failedSteps = Object.entries(stepResults)
        .filter(([_, success]) => !success)
        .map(([step]) => step);

      const message = failedSteps.length === 0
        ? "All group configurations are correct"
        : `Failed validations: ${failedSteps.join(', ')}`;

      // Emit final result
      socket.emit(`validation-${questionId}-complete`, {
        success: result.success,
        message
      });

    } catch (error: any) {
      console.error('Validation error:', error);

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

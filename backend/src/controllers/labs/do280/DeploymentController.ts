import { Socket } from "socket.io";
import { BaseLabController } from "../BaseLabController";
import { DeploymentService } from "../../../services/do280/DeploymentService";

export class DeploymentController extends BaseLabController {
  constructor() {
    super(new DeploymentService());
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
        'Project Existence': details['project_exists'],
        'Application Deployment': details['deployment_exists'],
        'Image Configuration': details['correct_image'],
        'Resource Limits': details['resource_limits'],
        'Route Configuration': details['route_configured']
      };

      // Log validation details for debugging
      console.log('Deployment Validation Details:', {
        details,
        stepResults
      });

      // Emit results for each step
      for (const [step, success] of Object.entries(stepResults)) {
        await this.emitValidationStep(
          socket,
          questionId,
          step,
          success ? "success" : "failed"
        );

        console.log(`Step "${step}" validation result:`, success);
      }

      // Generate detailed message based on failures
      const failedSteps = Object.entries(stepResults)
        .filter(([_, success]) => !success)
        .map(([step]) => step);

      const message = failedSteps.length === 0
        ? "Application deployment is correctly configured"
        : `Failed validations: ${failedSteps.join(', ')}`;

      // Emit final result
      socket.emit(`validation-${questionId}-complete`, {
        success: result.success,
        message
      });

    } catch (error: any) {
      console.error('Deployment validation error:', error);

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

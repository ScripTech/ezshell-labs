import { Socket } from "socket.io";
import { BaseLabController } from "../BaseLabController";
import { AutoScalingService } from "../../../services/do280/AutoScalingService";

export class AutoScalingController extends BaseLabController {
  constructor() {
    super(new AutoScalingService());
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
        'HPA Configuration': details['hpa_exists'],
        'Minimum Replicas': details['min_replicas'],
        'Maximum Replicas': details['max_replicas'],
        'CPU Target Utilization': details['target_cpu'],
        'Resource Requests': details['resource_requests']
      };

      // Log validation details for debugging
      console.log('Autoscaling Validation Details:', {
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
        ? "Autoscaling configuration is correct"
        : `Failed validations: ${failedSteps.join(', ')}`;

      // Emit final result
      socket.emit(`validation-${questionId}-complete`, {
        success: result.success,
        message
      });

    } catch (error: any) {
      console.error('Autoscaling validation error:', error);

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

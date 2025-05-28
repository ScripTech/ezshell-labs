import { Socket } from "socket.io";
import { BaseLabController } from "../BaseLabController";
import { LimitRangeService } from "../../../services/do280/LimitRangeService";

export class LimitRangeController extends BaseLabController {
  constructor() {
    super(new LimitRangeService());
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
        'Project Creation': details['projectExists'],
        'Pod Memory Limits': details['pod_memory_limits'],
        'Pod CPU Limits': details['pod_cpu_limits'],
        'Container Memory Limits and Defaults':
          details['container_memory_limits'] && details['container_memory_default'],
        'Container CPU Limits and Defaults':
          details['container_cpu_limits'] && details['container_cpu_default']
      };

      // Log validation details for debugging
      console.log('Limit Range Validation Details:', {
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
        ? "All limit ranges are correctly configured"
        : `Failed validations: ${failedSteps.join(', ')}`;

      // Emit final result
      socket.emit(`validation-${questionId}-complete`, {
        success: result.success,
        message
      });

    } catch (error: any) {
      console.error('Limit Range validation error:', error);

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

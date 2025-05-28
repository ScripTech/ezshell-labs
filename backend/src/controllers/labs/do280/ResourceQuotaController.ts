import { Request, Response } from "express";
import { ResourceQuotaService } from "../../../services/do280/ResourceQuotaService";
import { BaseLabController } from "../BaseLabController";
import { Socket } from "socket.io";

export class ResourceQuotaController extends BaseLabController {
  constructor() {
    super(new ResourceQuotaService());
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
        'Pods Quota Configuration': details['quota_pods'],
        'CPU Quota Configuration': details['quota_cpu'],
        'Services Quota Configuration': details['quota_services'],
        'Memory Quota Configuration': details['quota_memory'],
        'Secrets Quota Configuration': details['quota_secrets'],
        'Replication Controllers Quota Configuration': details['quota_replicationcontrollers']
      };

      // Log validation details for debugging
      console.log('Resource Quota Validation Details:', {
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
        ? "All resource quotas are correctly configured"
        : `Failed validations: ${failedSteps.join(', ')}`;

      // Emit final result
      socket.emit(`validation-${questionId}-complete`, {
        success: result.success,
        message
      });

    } catch (error: any) {
      console.error('Resource Quota validation error:', error);

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

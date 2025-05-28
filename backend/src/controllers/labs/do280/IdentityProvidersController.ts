import { Socket } from "socket.io";
import { BaseLabController } from "../BaseLabController";
import { IdentityProviderService } from "../../../services/do280/IdentityProviderService";


export class IdentityProvidersController extends BaseLabController {

  constructor() {
        super(new IdentityProviderService());
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
      const stepResults: Record<string, boolean> = {
        'HTPasswd Secret Configuration': details.htpasswdSecret,
        'OAuth Provider Configuration': details.oauthConfig,
      };

      // Add user validation results
      const users = [
        "bob",
        "qwerty",
        "john",
        "armstrong",
        "natasha",
        "harry",
        "susan",
      ];
      for (const username of users) {
        stepResults[`User ${username} Validation`] = details[`user_${username}_exists`];
        stepResults[`User ${username} Authentication`] = details[`user_${username}_auth`];
      }

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
        message: result.message || (result.success
          ? "All users configured correctly"
          : "Some users are not configured correctly")
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

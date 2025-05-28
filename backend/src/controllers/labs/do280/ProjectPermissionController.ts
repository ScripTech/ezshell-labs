import { Socket } from "socket.io";
import { BaseLabController } from "../BaseLabController";
import { ProjectPermissionService } from "../../../services/do280/ProjectPermissionService";

export class ProjectPermissionController extends BaseLabController {
  constructor() {
    super(new ProjectPermissionService());
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
        'Project Creation': details.projectsExist,
        'Cluster Admin Rights': details.bobClusterAdmin,
        'Project Creation Rights': details.johnProjectCreation && details.qwertyNoProjectCreation,
        'View Role Permissions': details.natashaViewerRoles && details.susanViewerRole,
        'Developer Role Permissions': details.harryDeveloperRole,
        'Admin Role Permissions': details.armstrongAdminRole,
        'Kubeadmin Removal': details.kubeadminRemoved
      };

      // Emit results for each step
      for (const [step, success] of Object.entries(stepResults)) {
        await this.emitValidationStep(socket, questionId, step, success ? "success" : "failed");
      }

      // Emit final result
      socket.emit(`validation-${questionId}-complete`, {
        success: result.success,
        message: result.message
      });

    } catch (error: any) {
      // Handle errors
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

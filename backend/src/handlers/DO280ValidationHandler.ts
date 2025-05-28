import { Socket } from "socket.io";
import { GroupRoleManagementController } from "../controllers/labs/ex280/GroupRoleManagementController";
import { ILabValidationHandler } from "../interfaces/ILabValidationHandler";
import { IdentityProvidersController } from "../controllers/labs/do280/IdentityProvidersController";


export class DO280ValidationHandler implements ILabValidationHandler {
  constructor(
    private readonly identityProvidersController: IdentityProvidersController,
    private readonly groupRoleController: GroupRoleManagementController,
  ) {}

  async handleValidation(socket: Socket, questionId: string): Promise<void> {
    switch (questionId) {
      case "01_manage_identity_providers":
        await this.identityProvidersController.handleValidation(socket, questionId);
        break;
      case "02_manage_cluster_project_permissions":
        await this.groupRoleController.handleValidation(socket, questionId);
        break;
      case "03_managing_groups":
        console.error(`Validation for questionId ${questionId} is not implemented.`);
        break;
      case "04_resource_qoutas":
        console.error(`Validation for questionId ${questionId} is not implemented.`);
        break;
      case "05_limit_ranges":
        console.error(`Validation for questionId ${questionId} is not implemented.`);
        break;
      case "06_manage_cluster_project_network":
        console.error(`Validation for questionId ${questionId} is not implemented.`);
        break;
      default:
        console.error(`Fatal Error! Unexpected questionId ${questionId}!`);
        throw new Error(`Fatal Error! Unexpected questionId ${questionId}`);
    }
  }
}

import { Socket } from "socket.io";
import { GroupRoleManagementController } from "../controllers/labs/ex280/GroupRoleManagementController";
import { ILabValidationHandler } from "../interfaces/ILabValidationHandler";
import { IdentityProvidersController } from "../controllers/labs/do280/IdentityProvidersController";
import { ProjectPermissionController } from "../controllers/labs/do280/ProjectPermissionController";
import { GroupManagementController } from "../controllers/labs/do280/GroupManagementController";
import { ResourceQuotaController } from "../controllers/labs/do280/ResourceQuotaController";
import { LimitRangeController } from "../controllers/labs/do280/LimitRangeController";
import { ScalingController } from "../controllers/labs/do280/ScalingController";
import { DeploymentController } from "../controllers/labs/do280/DeploymentController";
import { AutoScalingController } from "../controllers/labs/do280/AutoScalingController";


export class DO280ValidationHandler implements ILabValidationHandler {
  constructor(
    private readonly identityProvidersController: IdentityProvidersController,
    private readonly projectPermissionController: ProjectPermissionController,
    private readonly groupManagementController: GroupManagementController,
    private readonly resourceQuotaController: ResourceQuotaController,
    private readonly limitRangeController: LimitRangeController,
    private readonly scalingController: ScalingController,
    private readonly deploymentController: DeploymentController,
    private readonly autoScalingController: AutoScalingController
  ) {}

  async handleValidation(socket: Socket, questionId: string): Promise<void> {
    switch (questionId) {
      case "01_manage_identity_providers":
        await this.identityProvidersController.handleValidation(
          socket,
          questionId
        );
        break;
      case "02_manage_cluster_project_permissions":
        await this.projectPermissionController.handleValidation(
          socket,
          questionId
        );
        break;
      case "03_managing_groups":
        await this.groupManagementController.handleValidation(
          socket,
          questionId
        );
        break;
      case "04_resource_qoutas":
        await this.resourceQuotaController.handleValidation(socket, questionId);
        break;
      case "05_limit_ranges":
        await this.limitRangeController.handleValidation(socket, questionId);
        break;
      case "06_deploy_application":
        await this.deploymentController.handleValidation(
          socket,
          questionId
        );
        break;
      case "07_manual_scalling":
        await this.scalingController.handleValidation(socket, questionId);
        break;
      case "08_auto_scalling":
        await this.autoScalingController.handleValidation(
          socket,
          questionId
        );
        break;
      default:
        console.error(`Fatal Error! Unexpected questionId ${questionId}!`);
        throw new Error(`Fatal Error! Unexpected questionId ${questionId}`);
    }
  }
}

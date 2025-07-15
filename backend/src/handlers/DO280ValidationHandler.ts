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
import { AuthenticatedSocket } from '../middleware/socketAuth';
import { SocketUserService } from '../services/SocketUserService';
import { validationTrackingService, ValidationContext } from '../services/ValidationTrackingService';


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

  private async executeWithAuthentication(
    socket: Socket,
    questionId: string,
    validationFunction: () => Promise<void>
  ): Promise<void> {
    const authSocket = socket as AuthenticatedSocket;

    try {
      // Get user context from authenticated socket
      const userContext = await SocketUserService.getUserContextWithLab(authSocket, 'do280');

      if (!userContext || !userContext.labEnrollmentId) {
        socket.emit('validation-error', {
          questionId,
          error: 'Authentication required or lab enrollment not found'
        });
        return;
      }

      // Create validation context for tracking
      const validationContext: ValidationContext = {
        socket: authSocket,
        questionId,
        validationQuestionId: "",
        userId: userContext.userId,
        labId: "do280",
        labEnrollmentId: userContext.labEnrollmentId,
      };

      // Execute validation with tracking
      await validationTrackingService.executeValidationWithTracking(
        validationContext,
        [
          validationTrackingService.createValidationStep(
            `${questionId}-execution`,
            `Execute validation for ${questionId}`,
            100,
            async () => {
              await validationFunction();
              return true;
            }
          )
        ]
      );

    } catch (error) {
      console.error(`Authentication error for ${questionId}:`, error);
      socket.emit('validation-error', {
        questionId,
        error: 'Authentication failed'
      });
    }
  }

  async handleValidation(socket: Socket, questionId: string): Promise<void> {
    switch (questionId) {
      case "01_manage_identity_providers":
        await this.executeWithAuthentication(socket, questionId, async () => {
          await this.identityProvidersController.handleValidation(socket, questionId);
        });
        break;
      case "02_manage_cluster_project_permissions":
        await this.executeWithAuthentication(socket, questionId, async () => {
          await this.projectPermissionController.handleValidation(socket, questionId);
        });
        break;
      case "03_managing_groups":
        await this.executeWithAuthentication(socket, questionId, async () => {
          await this.groupManagementController.handleValidation(socket, questionId);
        });
        break;
      case "04_resource_qoutas":
        await this.executeWithAuthentication(socket, questionId, async () => {
          await this.resourceQuotaController.handleValidation(socket, questionId);
        });
        break;
      case "05_limit_ranges":
        await this.executeWithAuthentication(socket, questionId, async () => {
          await this.limitRangeController.handleValidation(socket, questionId);
        });
        break;
      case "06_deploy_application":
        await this.executeWithAuthentication(socket, questionId, async () => {
          await this.deploymentController.handleValidation(socket, questionId);
        });
        break;
      case "07_manual_scalling":
        await this.executeWithAuthentication(socket, questionId, async () => {
          await this.scalingController.handleValidation(socket, questionId);
        });
        break;
      case "08_auto_scalling":
        await this.executeWithAuthentication(socket, questionId, async () => {
          await this.autoScalingController.handleValidation(socket, questionId);
        });
        break;
      default:
        console.error(`Fatal Error! Unexpected questionId ${questionId}!`);
        throw new Error(`Fatal Error! Unexpected questionId ${questionId}`);
    }
  }
}

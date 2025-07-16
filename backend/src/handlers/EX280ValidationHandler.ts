import { Socket } from 'socket.io';
import { ILabValidationHandler } from '../interfaces/ILabValidationHandler';
import { AuthenticationManagementController } from '../controllers/labs/ex280/AuthenticationManagementController';
import { GroupRoleManagementController } from '../controllers/labs/ex280/GroupRoleManagementController';
import { AuthenticatedSocket } from '../middleware/socketAuth';
import { SocketUserService } from '../services/SocketUserService';
import { validationTrackingService, ValidationContext } from '../services/ValidationTrackingService';


export class EX280ValidationHandler implements ILabValidationHandler {
  constructor(
    private readonly authController: AuthenticationManagementController,
    private readonly groupRoleController: GroupRoleManagementController,
    // ...other controllers
  ) {}

  private async executeWithAuthentication(
    socket: Socket,
    questionId: string,
    validationFunction: () => Promise<void>
  ): Promise<void> {
    const authSocket = socket as AuthenticatedSocket;

    try {
      // Get user context from authenticated socket
      const userContext = await SocketUserService.getUserContextWithLab(authSocket, 'ex280');

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
      case "01_manage_authentication":
        await this.executeWithAuthentication(socket, questionId, async () => {
          await this.authController.handleValidation(socket, questionId);
        });
        break;
      case "02_manage_groups_roles":
        await this.executeWithAuthentication(socket, questionId, async () => {
          await this.groupRoleController.handleValidation(socket, questionId);
        });
        break;
      case "03_manage_storage":
        // TODO: Implement the validation logic for this question
        break;
      case "04_configure_reliability":
        // TODO: Implement the validation logic for this question
        break;
      case "05_manage_openshift_platform":
        // TODO: Implement the validation logic for this question
        break;
      case "06_network_security":
        // TODO: Implement the validation logic for this question
        break;
      case "07_developer_self_service":
        // TODO: Implement the validation logic for this question
        break;
      case "08_manage_operators":
        // TODO: Implement the validation logic for this question
        break;
      case "09_configure_app_security":
        // TODO: Implement the validation logic for this question
        break;
      case "10_multicontainer_pods":
        // TODO: Implement the validation logic for this question
        break;
      case "10_multicontainer_pods":
        // TODO: Implement the validation logic for this question
        break;
      case "11_configure_routes":
        // TODO: Implement the validation logic for this question
        break;
      case "12_configure_image_streams":
        // TODO: Implement the validation logic for this question
        break;
      case "13_configure_rbac":
        // TODO: Implement the validation logic for this question
        break;
      case "14_configure_monitoring":
        // TODO: Implement the validation logic for this question
        break;
      case "15_scaling_applications":
        // TODO: Implement the validation logic for this question
        break;
      case "16_troubleshooting_applications":
        // TODO: Implement the validation logic for this question
        break;
      default:
        console.log(`Unknown EX280 question: ${questionId}`);
        break;
    }
  }
}

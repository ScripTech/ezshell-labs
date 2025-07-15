import { Socket } from 'socket.io';
import { ILabValidationHandler } from '../interfaces/ILabValidationHandler';
import { NetworkConfigValidationController } from '../controllers/labs/ex200/NetworkConfigValidationController';
import { UserGroupManagementController } from '../controllers/labs/ex200/UserGroupManagementController';
import { YumRepositoryValidationController } from '../controllers/labs/ex200/YumRepositoryValidationController';
import { SELinuxManagementController } from '../controllers/labs/ex200/SELinuxManagementController';
import { AutofsConfigurationController } from '../controllers/labs/ex200/AutofsConfigurationController';
import { BasicValidationController } from '../controllers/labs/ex200/BasicValidationController';
import { CollaborativeDirectoryControllerV1 } from '../controllers/labs/ex200/CollaborativeDirectoryControllerV1';
import { CronJobController } from '../controllers/labs/ex200/CronJobController';
import { AuthenticatedSocket } from '../middleware/socketAuth';
import { SocketUserService } from '../services/SocketUserService';
import { validationTrackingService, ValidationContext } from '../services/ValidationTrackingService';

export class EX200ValidationHandler implements ILabValidationHandler {
  constructor(
    private readonly networkConfigValidationController: NetworkConfigValidationController,
    private readonly userGroupMnt: UserGroupManagementController,
    private readonly yumManagement: YumRepositoryValidationController,
    private readonly selinuxMnt: SELinuxManagementController,
    private readonly collabDirV1: CollaborativeDirectoryControllerV1,
    private readonly cronJob: CronJobController,
    private readonly autofsConfig: AutofsConfigurationController,
    private readonly basicController: BasicValidationController
  ) {}

  private async executeWithAuthentication(
    socket: Socket,
    questionId: string,
    labId: string,
    validationQuestionId: string,
    validationFunction: () => Promise<void>
  ): Promise<void> {
    const authSocket = socket as AuthenticatedSocket;

    try {
      // Get user context from authenticated socket
      const userContext = await SocketUserService.getUserContextWithLab(
        authSocket,
        labId,
      );
      console.log(`User context for ${validationQuestionId}:`, userContext);
      if (!userContext || !userContext.labEnrollmentId) {
        socket.emit("validation-error", {
          validationQuestionId,
          error: "Authentication required or lab enrollment not found",
        });
        return;
      }

      // Create validation context for tracking
      const validationContext: ValidationContext = {
        socket: authSocket,
        questionId: questionId,
        validationQuestionId: validationQuestionId,
        userId: userContext.userId,
        labId: labId,
        labEnrollmentId: userContext.labEnrollmentId,
      };

      // Execute validation with tracking
      await validationTrackingService.executeValidationWithTracking(
        validationContext,
        [
          validationTrackingService.createValidationStep(
            `${validationQuestionId}-execution`,
            `Execute validation for ${validationQuestionId}`,
            100,
            async () => {
              await validationFunction();
              return true;
            }
          ),
        ]
      );
    } catch (error) {
      console.error(`Authentication error for ${validationQuestionId}:`, error);
      socket.emit("validation-error", {
        validationQuestionId,
        error: "Authentication failed",
      });
    }
  }

  async handleValidation(
    socket: Socket,
    questionId: string,
    labId: string,
    validationQuestionId: string
  ): Promise<void> {
    switch (validationQuestionId) {
      case "question-1-network-config":
        console.log(`Handling validation for ${validationQuestionId}`);
        await this.executeWithAuthentication(
          socket,
          questionId,
          labId,
          validationQuestionId,
          async () => {
            this.networkConfigValidationController.handleValidation(
              socket,
              validationQuestionId
            );
          }
        );
        break;
      case "question-2-yum-repository":
        await this.executeWithAuthentication(socket,
          questionId,
          labId,
          validationQuestionId,
          async () => {
            this.yumManagement.handleValidation(socket, validationQuestionId);
          }
        );
        break;
      case "question-14-configure-yum-repository":
        await this.executeWithAuthentication(socket, questionId, labId, validationQuestionId, async () => {
          this.yumManagement.handleValidation(socket, validationQuestionId);
        });
        break;
      case "question-3-selinux-port":
        await this.executeWithAuthentication(socket, questionId, labId, validationQuestionId, async () => {
          this.selinuxMnt.handleValidation(socket, validationQuestionId);
        });
        break;
      case "question-4-user-group-management":
        await this.executeWithAuthentication(socket, questionId, labId, validationQuestionId, async () => {
          this.userGroupMnt.handleValidations(socket, validationQuestionId, {
            group: "sysadm",
            users: ["natasha"],
          });
        });
        break;
      case "question-5-collaborative-directory":
        await this.executeWithAuthentication(socket, questionId, labId, validationQuestionId, async () => {
          this.collabDirV1.handleValidation(socket, validationQuestionId);
        });
        break;
      case "question-6-cron-job":
        await this.executeWithAuthentication(socket, questionId, labId, validationQuestionId, async () => {
          this.cronJob.handleValidation(socket, validationQuestionId, {
            user: "natasha",
            cronjob: '*/1\t*\t*\t*\t*\tlogger "EX200 Testing"',
          });
        });
        break;
      case "question-7-autofs-configuration":
        await this.executeWithAuthentication(socket, questionId, labId, validationQuestionId, async () => {
          this.autofsConfig.handleValidation(socket, validationQuestionId);
        });
        break;
      case "question-8-create-tar-archive":
        await this.executeWithAuthentication(socket, questionId, labId, validationQuestionId, async () => {
          this.basicController.handleTarValidation(socket, validationQuestionId);
        });
        break;
      case "question-9-file-permissions":
        await this.executeWithAuthentication(socket, questionId, labId, validationQuestionId, async () => {
          this.basicController.handleFilePermissionsValidation(
            socket,
            validationQuestionId
          );
        });
        break;
      case "question-10-time-synchronization":
        await this.executeWithAuthentication(socket, questionId, labId, validationQuestionId, async () => {
          this.basicController.handleTimeSynchronizationValidation(
            socket,
            validationQuestionId
          );
        });
        break;
      case "question-11-find-user-files":
        // This case was empty - maintaining for compatibility
        break;
      case "question-12-string-search":
        await this.executeWithAuthentication(socket, questionId, labId, validationQuestionId, async () => {
          this.basicController.handleStringSearchValidation(socket, validationQuestionId);
        });
        break;
      case "question-13-create-user":
        await this.executeWithAuthentication(socket, questionId, labId, validationQuestionId, async () => {
          this.userGroupMnt.handleUserIDValidation(socket, validationQuestionId, {
            user: "appservice",
            id: "2334",
          });
        });
        break;
      case "question-18-configure-tuned-profile":
        await this.executeWithAuthentication(socket, questionId, labId, validationQuestionId, async () => {
          this.basicController.handleTunedProfileValidation(socket, validationQuestionId);
        });
        break;
      default:
        console.log(`Unknown EX200 question: ${validationQuestionId}`);
        break;
    }
  }
}

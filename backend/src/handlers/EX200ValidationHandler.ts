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
import { AdditionalValidationController } from '../controllers/labs/ex200/AdditionalValidationController';
import { LVMConfigurationController } from '../controllers/labs/ex200/LVMConfigurationController';
import { SwapConfigurationController } from '../controllers/labs/ex200/SwapConfigurationController';
import { LVMResizeController } from '../controllers/labs/ex200/LVMResizeController';
import { VDOConfigurationController } from '../controllers/labs/ex200/VDOConfigurationController';
import { AdvancedContainerController } from '../controllers/labs/ex200/AdvancedContainerController';
import { FindUserFilesController } from '../controllers/labs/ex200/FindUserFilesController';
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
    private readonly basicController: BasicValidationController,
    private readonly additionalController: AdditionalValidationController,
    private readonly lvmController: LVMConfigurationController,
    private readonly swapController: SwapConfigurationController,
    private readonly lvmResizeController: LVMResizeController,
    private readonly vdoController: VDOConfigurationController,
    private readonly advancedContainerController: AdvancedContainerController,
    private readonly findUserFilesController: FindUserFilesController
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

  private async executeWithYumValidation(
    socket: Socket,
    questionId: string,
    labId: string,
    validationQuestionId: string
  ): Promise<void> {
    const authSocket = socket as AuthenticatedSocket;

    try {
      // Get user context from authenticated socket
      const userContext = await SocketUserService.getUserContextWithLab(
        authSocket,
        labId,
      );

      if (!userContext || !userContext.labEnrollmentId) {
        socket.emit("validation-error", {
          validationQuestionId,
          error: "Authentication required or lab enrollment not found",
        });
        return;
      }

      // Call the updated YumRepositoryValidationController with all required parameters
      await this.yumManagement.handleValidation(authSocket, {
        questionId,
        userId: userContext.userId,
        labId,
        validationQuestionId,
        labEnrollmentId: userContext.labEnrollmentId
      });

    } catch (error) {
      console.error(`Authentication error for ${validationQuestionId}:`, error);
      socket.emit("validation-error", {
        validationQuestionId,
        error: "Authentication failed",
      });
    }
  }

  private async executeWithNetworkValidation(
    socket: Socket,
    questionId: string,
    labId: string,
    validationQuestionId: string
  ): Promise<void> {
    const authSocket = socket as AuthenticatedSocket;

    try {
      // Get user context from authenticated socket
      const userContext = await SocketUserService.getUserContextWithLab(
        authSocket,
        labId,
      );

      if (!userContext || !userContext.labEnrollmentId) {
        socket.emit("validation-error", {
          validationQuestionId,
          error: "Authentication required or lab enrollment not found",
        });
        return;
      }

      // Call the updated NetworkConfigValidationController with all required parameters
      await this.networkConfigValidationController.handleValidation(authSocket, {
        questionId,
        userId: userContext.userId,
        labId,
        validationQuestionId,
        labEnrollmentId: userContext.labEnrollmentId
      });

    } catch (error) {
      console.error(`Authentication error for ${validationQuestionId}:`, error);
      socket.emit("validation-error", {
        validationQuestionId,
        error: "Authentication failed",
      });
    }
  }

  private async executeWithSELinuxValidation(
    socket: Socket,
    questionId: string,
    labId: string,
    validationQuestionId: string
  ): Promise<void> {
    const authSocket = socket as AuthenticatedSocket;

    try {
      // Get user context from authenticated socket
      const userContext = await SocketUserService.getUserContextWithLab(
        authSocket,
        labId,
      );

      if (!userContext || !userContext.labEnrollmentId) {
        socket.emit("validation-error", {
          validationQuestionId,
          error: "Authentication required or lab enrollment not found",
        });
        return;
      }

      // Call the updated SELinuxManagementController with all required parameters
      await this.selinuxMnt.handleValidation(authSocket, {
        questionId,
        userId: userContext.userId,
        labId,
        validationQuestionId,
        labEnrollmentId: userContext.labEnrollmentId
      });

    } catch (error) {
      console.error(`Authentication error for ${validationQuestionId}:`, error);
      socket.emit("validation-error", {
        validationQuestionId,
        error: "Authentication failed",
      });
    }
  }

  private async executeWithBasicValidation(
    socket: Socket,
    questionId: string,
    labId: string,
    validationQuestionId: string,
    validationType: 'tar' | 'filePermissions' | 'timeSynchronization' | 'stringSearch' | 'tunedProfile'
  ): Promise<void> {
    const authSocket = socket as AuthenticatedSocket;

    try {
      // Get user context from authenticated socket
      const userContext = await SocketUserService.getUserContextWithLab(
        authSocket,
        labId,
      );

      if (!userContext || !userContext.labEnrollmentId) {
        socket.emit("validation-error", {
          validationQuestionId,
          error: "Authentication required or lab enrollment not found",
        });
        return;
      }

      const validationData = {
        questionId,
        userId: userContext.userId,
        labId,
        validationQuestionId,
        labEnrollmentId: userContext.labEnrollmentId
      };

      // Call the appropriate validation method based on type
      switch (validationType) {
        case 'tar':
          await this.basicController.handleTarValidation(authSocket, validationData);
          break;
        case 'filePermissions':
          await this.basicController.handleFilePermissionsValidation(authSocket, validationData);
          break;
        case 'timeSynchronization':
          await this.basicController.handleTimeSynchronizationValidation(authSocket, validationData);
          break;
        case 'stringSearch':
          await this.basicController.handleStringSearchValidation(authSocket, validationData);
          break;
        case 'tunedProfile':
          await this.basicController.handleTunedProfileValidation(authSocket, validationData);
          break;
      }

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
        await this.executeWithNetworkValidation(socket, questionId, labId, validationQuestionId);
        break;
      case "question-2-yum-repository":
        await this.executeWithYumValidation(socket, questionId, labId, validationQuestionId);
        break;
      case "question-14-configure-yum-repository":
        await this.executeWithYumValidation(socket, questionId, labId, validationQuestionId);
        break;
      case "question-3-selinux-port":
        await this.executeWithSELinuxValidation(socket, questionId, labId, validationQuestionId);
        break;
      case "question-4-user-group-management":
        const authSocket = socket as AuthenticatedSocket;
        const userContext = await SocketUserService.getUserContextWithLab(authSocket, labId);
        if (userContext?.labEnrollmentId) {
          await this.userGroupMnt.handleUserGroupValidationWithSocketTracking(
            socket,
            {
              questionId,
              userId: userContext.userId,
              labId,
              validationQuestionId,
              labEnrollmentId: userContext.labEnrollmentId,
            },
            {
              group: "sysadm",
              users: ["natasha", "harry", "sarah"],
            }
          );
        }
        break;
      case "question-5-collaborative-directory":
        const authSocket5 = socket as AuthenticatedSocket;
        const userContext5 = await SocketUserService.getUserContextWithLab(authSocket5, labId);
        if (userContext5?.labEnrollmentId) {
          await this.collabDirV1.handleValidationWithSocketTracking(socket, {
            questionId,
            userId: userContext5.userId,
            labId,
            validationQuestionId,
            labEnrollmentId: userContext5.labEnrollmentId,
          });
        }
        break;
      case "question-6-cron-job":
        const authSocket6 = socket as AuthenticatedSocket;
        const userContext6 = await SocketUserService.getUserContextWithLab(authSocket6, labId);
        if (userContext6?.labEnrollmentId) {
          await this.cronJob.handleValidationWithSocketTracking(socket, {
            questionId,
            userId: userContext6.userId,
            labId,
            validationQuestionId,
            labEnrollmentId: userContext6.labEnrollmentId,
            user: "natasha",
            cronjob: '*/1\t*\t*\t*\t*\tlogger "EX200 Testing"',
          });
        }
        break;
      case "question-7-autofs-configuration":
        const authSocket7 = socket as AuthenticatedSocket;
        const userContext7 = await SocketUserService.getUserContextWithLab(authSocket7, labId);
        if (userContext7?.labEnrollmentId) {
          await this.autofsConfig.handleValidationWithSocketTracking(socket, {
            questionId,
            userId: userContext7.userId,
            labId,
            validationQuestionId,
            labEnrollmentId: userContext7.labEnrollmentId,
          });
        }
        break;
      case "question-8-create-tar-archive":
        await this.executeWithBasicValidation(socket, questionId, labId, validationQuestionId, 'tar');
        break;
      case "question-9-file-permissions":
        await this.executeWithBasicValidation(socket, questionId, labId, validationQuestionId, 'filePermissions');
        break;
      case "question-10-time-synchronization":
        await this.executeWithBasicValidation(socket, questionId, labId, validationQuestionId, 'timeSynchronization');
        break;
      case "question-11-find-user-files":
        const authSocket11 = socket as AuthenticatedSocket;
        const userContext11 = await SocketUserService.getUserContextWithLab(authSocket11, labId);
        if (userContext11?.labEnrollmentId) {
          await this.findUserFilesController.handleFindUserFilesValidation(socket, {
            questionId,
            userId: userContext11.userId,
            labId,
            validationQuestionId,
            labEnrollmentId: userContext11.labEnrollmentId,
          });
        } else {
          socket.emit("validation-error", {
            validationQuestionId,
            error: "Authentication required or lab enrollment not found",
          });
        }
        break;
      case "question-12-string-search":
        await this.executeWithBasicValidation(socket, questionId, labId, validationQuestionId, 'stringSearch');
        break;
      case "question-13-create-user":
        const authSocket13 = socket as AuthenticatedSocket;
        const userContext13 = await SocketUserService.getUserContextWithLab(authSocket13, labId);
        if (userContext13?.labEnrollmentId) {
          await this.userGroupMnt.handleUserIDValidationWithSocketTracking(socket, {
            questionId,
            userId: userContext13.userId,
            labId,
            validationQuestionId,
            labEnrollmentId: userContext13.labEnrollmentId,
          }, {
            user: "appservice",
            id: "2334",
          });
        }
        break;
      case "question-18-configure-tuned-profile":
        await this.executeWithBasicValidation(socket, questionId, labId, validationQuestionId, 'tunedProfile');
        break;
      case "question-15-container-management":
        const authSocket15 = socket as AuthenticatedSocket;
        const userContext15 = await SocketUserService.getUserContextWithLab(authSocket15, labId);
        if (userContext15?.labEnrollmentId) {
          await this.additionalController.handleContainerManagementValidation(socket, {
            questionId,
            userId: userContext15.userId,
            labId,
            validationQuestionId,
            labEnrollmentId: userContext15.labEnrollmentId,
          });
        }
        break;
      case "question-16-system-monitoring":
        const authSocket16 = socket as AuthenticatedSocket;
        const userContext16 = await SocketUserService.getUserContextWithLab(authSocket16, labId);
        if (userContext16?.labEnrollmentId) {
          await this.additionalController.handleSystemMonitoringValidation(socket, {
            questionId,
            userId: userContext16.userId,
            labId,
            validationQuestionId,
            labEnrollmentId: userContext16.labEnrollmentId,
          });
        }
        break;
      case "question-17-boot-process":
        const authSocket17 = socket as AuthenticatedSocket;
        const userContext17 = await SocketUserService.getUserContextWithLab(authSocket17, labId);
        if (userContext17?.labEnrollmentId) {
          await this.additionalController.handleBootProcessValidation(socket, {
            questionId,
            userId: userContext17.userId,
            labId,
            validationQuestionId,
            labEnrollmentId: userContext17.labEnrollmentId,
          });
        }
        break;
      case "question-19-lvm-configuration":
        const authSocket19 = socket as AuthenticatedSocket;
        const userContext19 = await SocketUserService.getUserContextWithLab(authSocket19, labId);
        if (userContext19?.labEnrollmentId) {
          await this.lvmController.handleLVMValidationWithSocketTracking(socket, {
            questionId,
            userId: userContext19.userId,
            labId,
            validationQuestionId,
            labEnrollmentId: userContext19.labEnrollmentId,
          });
        }
        break;
      case "question-20-swap-configuration":
        const authSocket20 = socket as AuthenticatedSocket;
        const userContext20 = await SocketUserService.getUserContextWithLab(authSocket20, labId);
        if (userContext20?.labEnrollmentId) {
          await this.swapController.handleSwapValidationWithSocketTracking(socket, {
            questionId,
            userId: userContext20.userId,
            labId,
            validationQuestionId,
            labEnrollmentId: userContext20.labEnrollmentId,
          });
        }
        break;
      case "question-21-lvm-resize":
        const authSocket21 = socket as AuthenticatedSocket;
        const userContext21 = await SocketUserService.getUserContextWithLab(authSocket21, labId);
        if (userContext21?.labEnrollmentId) {
          await this.lvmResizeController.handleLVMResizeValidationWithSocketTracking(socket, {
            questionId,
            userId: userContext21.userId,
            labId,
            validationQuestionId,
            labEnrollmentId: userContext21.labEnrollmentId,
          });
        }
        break;
      case "question-22-vdo-configuration":
        const authSocket22 = socket as AuthenticatedSocket;
        const userContext22 = await SocketUserService.getUserContextWithLab(authSocket22, labId);
        if (userContext22?.labEnrollmentId) {
          await this.vdoController.handleVDOValidationWithSocketTracking(socket, {
            questionId,
            userId: userContext22.userId,
            labId,
            validationQuestionId,
            labEnrollmentId: userContext22.labEnrollmentId,
          });
        }
        break;
      case "question-23-advanced-containers":
        const authSocket23 = socket as AuthenticatedSocket;
        const userContext23 = await SocketUserService.getUserContextWithLab(authSocket23, labId);
        if (userContext23?.labEnrollmentId) {
          await this.advancedContainerController.handleAdvancedContainerValidationWithSocketTracking(socket, {
            questionId,
            userId: userContext23.userId,
            labId,
            validationQuestionId,
            labEnrollmentId: userContext23.labEnrollmentId,
          });
        }
        break;
      default:
        console.log(`Unknown EX200 question: ${validationQuestionId}`);
        break;
    }
  }
}

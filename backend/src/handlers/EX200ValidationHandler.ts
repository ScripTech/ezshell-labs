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

  async handleValidation(socket: Socket, questionId: string): Promise<void> {
    switch (questionId) {
      case "question-1-network-config":
        this.networkConfigValidationController.handleValidation(
          socket,
          questionId
        );
        break;
      case "question-2-yum-repository":
        this.yumManagement.handleValidation(socket, questionId);
        break;
      case "question-14-configure-yum-repository":
        this.yumManagement.handleValidation(socket, questionId);
        break;
      case "question-3-selinux-port":
        this.selinuxMnt.handleValidation(socket, questionId);
        break;
      case "question-4-user-group-management":
        this.userGroupMnt.handleValidations(socket, questionId, {
          group: "sysadm",
          users: ["natasha"],
        });
        break;
      case "question-5-collaborative-directory":
        this.collabDirV1.handleValidation(socket, questionId);
        break;
      case "question-6-cron-job":
        this.cronJob.handleValidation(socket, questionId, {
          user: "natasha",
          cronjob: '*/1\t*\t*\t*\t*\tlogger "EX200 Testing"',
        });
        break;
      case "question-7-autofs-configuration":
        this.autofsConfig.handleValidation(socket, questionId);
        break;
      case "question-8-create-tar-archive":
        this.basicController.handleTarValidation(socket, questionId);
        break;
      case "question-9-file-permissions":
        this.basicController.handleFilePermissionsValidation(
          socket,
          questionId
        );
        break;
      case "question-10-time-synchronization":
        this.basicController.handleTimeSynchronizationValidation(
          socket,
          questionId
        );
        break;
      case "question-11-find-user-files":
        break;
      case "question-12-string-search":
        this.basicController.handleStringSearchValidation(socket, questionId);
        break;
      case "question-13-create-user":
        this.userGroupMnt.handleUserIDValidation(socket, questionId, {
          user: "appservice",
          id: "2334",
        });
        break;
      case "question-18-configure-tuned-profile":
        this.basicController.handleTunedProfileValidation(socket, questionId);
        break;
      default:
        console.log(`Unknown EX200 question: ${questionId}`);
        break;
    }
  }
}

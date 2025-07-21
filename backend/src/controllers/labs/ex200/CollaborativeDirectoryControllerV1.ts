import { Socket } from "socket.io";
import { CollaborativeDirectoryServiceV1 } from "../../../services/ex200/CollaborativeDirectoryServiceV1";
import { ValidationTrackingService } from "../../../services/ValidationTrackingService";

export class CollaborativeDirectoryControllerV1 {
  private service: CollaborativeDirectoryServiceV1;
  private trackingService: ValidationTrackingService;

  constructor() {
    this.service = new CollaborativeDirectoryServiceV1();
    this.trackingService = new ValidationTrackingService();
  }

  handleValidation = async (socket: Socket, questionId: string) => {
    socket.emit(`validation-${questionId}-step`, {
      step: "Directory exist",
      status: "loading",
    });
    const dirExist = await this.service.validateDir("/shared/sysadm");
    socket.emit(`validation-${questionId}-step`, {
      step: "Directory exist",
      status: dirExist ? "success" : "failed",
    });


    socket.emit(`validation-${questionId}-step`, {
      step: "Group ownership is sysadm",
      status: "loading",
    });
    const gOwnership = await this.service.validateGroupOwnership("/shared/sysadm", "sysadm");
    socket.emit(`validation-${questionId}-step`, {
      step: "Group ownership is sysadm",
      status: gOwnership ? "success" : "failed",
    });

    socket.emit(`validation-${questionId}-step`, {
      step: "Members of sysadm only",
      status: "loading",
    });
    const gMemberPermission = await this.service.validateDirPermission(
      "/shared/sysadm",
      "sysadm"
    );
    socket.emit(`validation-${questionId}-step`, {
      step: "Members of sysadm only",
      status: gMemberPermission ? "success" : "failed",
    });

    socket.emit(`validation-${questionId}-step`, {
      step: "Automatically have group ownership",
      status: "loading",
    });
    const gDirPermission = await this.service.validateDirPermission(
      "/shared/sysadm",
      "sysadm"
    );
    socket.emit(`validation-${questionId}-step`, {
      step: "Automatically have group ownership",
      status: gDirPermission ? "success" : "failed",
    });
  }

  // New socket tracking methods
  handleValidationWithSocketTracking = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

      // Initialize service with user and lab context
      console.log(`🔧 Initializing CollaborativeDirectoryControllerV1 for user ${userId}, lab ${labId}`);
      await this.service.initialize(userId, labId);

      await this.trackingService.executeValidationWithSocketTracking(
        { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId },
        async (trackedSocket: Socket) => {
          return await this.performCollaborativeDirectoryValidation(trackedSocket, validationQuestionId);
        }
      );
    } catch (error) {
      console.error("Error in collaborative directory validation:", error);
      socket.emit('validation-error', {
        questionId: data.questionId,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  private async performCollaborativeDirectoryValidation(socket: Socket, questionId: string): Promise<boolean> {
    try {
      socket.emit(`validation-${questionId}-step`, {
        step: "Directory exist",
        status: "loading",
      });
      const dirExist = await this.service.validateDir("/shared/sysadm");
      socket.emit(`validation-${questionId}-step`, {
        step: "Directory exist",
        status: dirExist ? "success" : "failed",
        message: dirExist ? "Directory /shared/sysadm exists" : "Directory /shared/sysadm does not exist"
      });

      socket.emit(`validation-${questionId}-step`, {
        step: "Group ownership is sysadm",
        status: "loading",
      });
      const gOwnership = await this.service.validateGroupOwnership("/shared/sysadm", "sysadm");
      socket.emit(`validation-${questionId}-step`, {
        step: "Group ownership is sysadm",
        status: gOwnership ? "success" : "failed",
        message: gOwnership ? "Directory has correct group ownership (sysadm)" : "Directory does not have correct group ownership"
      });

      socket.emit(`validation-${questionId}-step`, {
        step: "Members of sysadm only",
        status: "loading",
      });
      const gMemberPermission = await this.service.validateDirPermission("/shared/sysadm", "sysadm");
      socket.emit(`validation-${questionId}-step`, {
        step: "Members of sysadm only",
        status: gMemberPermission ? "success" : "failed",
        message: gMemberPermission ? "Only sysadm group members can access" : "Directory permissions are incorrect"
      });

      socket.emit(`validation-${questionId}-step`, {
        step: "Automatically have group ownership",
        status: "loading",
      });
      const gDirPermission = await this.service.validateDirPermission("/shared/sysadm", "sysadm");
      socket.emit(`validation-${questionId}-step`, {
        step: "Automatically have group ownership",
        status: gDirPermission ? "success" : "failed",
        message: gDirPermission ? "Files automatically have group ownership" : "Files do not automatically have group ownership"
      });

      return dirExist && gOwnership && gMemberPermission && gDirPermission;
    } catch (error) {
      console.error("Error in collaborative directory validation:", error);
      const steps = ["Directory exist", "Group ownership is sysadm", "Members of sysadm only", "Automatically have group ownership"];
      steps.forEach(step => {
        socket.emit(`validation-${questionId}-step`, {
          step,
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error occurred"
        });
      });
      return false;
    }
  }
}

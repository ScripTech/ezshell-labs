import { Socket } from "socket.io";
import { YumRepositoryValidationService } from "../../../services/ex200/YumRepositoryValidationService";
import { ValidationTrackingService } from "../../../services/ValidationTrackingService";

export class YumRepositoryValidationController {
  private service: YumRepositoryValidationService;
  private trackingService: ValidationTrackingService;

  constructor() {
    this.service = new YumRepositoryValidationService();
    this.trackingService = new ValidationTrackingService();
  }

  handleValidation = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

      // Use the new socket tracking validation method
      await this.trackingService.executeValidationWithSocketTracking(
        { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId },
        async (trackedSocket: Socket) => {
          return await this.performYumRepositoryValidation(trackedSocket, validationQuestionId, userId, labId);
        }
      );

    } catch (error) {
      console.error("Error in YUM repository validation:", error);
      socket.emit('validation-error', {
        questionId: data.questionId,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  private async performYumRepositoryValidation(socket: Socket, questionId: string, userId: string, labId: string): Promise<boolean> {
    try {
      // Initialize the service with user and lab context
      console.log(`🔧 Initializing YUM repository validation for user ${userId}, lab ${labId}`);
      const connected = await this.service.initialize(userId, labId);

      if (!connected) {
        console.error(`❌ Failed to connect to lab instance for user ${userId}, lab ${labId}`);
        return false;
      }

      // BaseOS Repository validation
      socket.emit(`validation-${questionId}-step`, {
        step: "Repository file exist",
        status: "loading",
      });

      const repoExist = await this.service.validateRepoExist();
      socket.emit(`validation-${questionId}-step`, {
        step: "Repository file exist",
        status: repoExist ? "success" : "failed",
        message: repoExist
          ? "BaseOS repository configuration is correct"
          : "BaseOS repository configuration is incorrect",
      });

      // BaseOS Repository validation
      socket.emit(`validation-${questionId}-step`, {
        step: "BaseOS Repository",
        status: "loading",
      });

      const baseOs = await this.service.validateBaseOSRepo();
      socket.emit(`validation-${questionId}-step`, {
        step: "BaseOS Repository",
        status: baseOs ? "success" : "failed",
        message: baseOs ? "BaseOS repository configuration is correct" : "BaseOS repository configuration is incorrect"
      });

      // AppStream Repository validation
      socket.emit(`validation-${questionId}-step`, {
        step: "App Stream Repository",
        status: "loading",
      });

      const appStream = await this.service.validateAppStreamRepo();
      socket.emit(`validation-${questionId}-step`, {
        step: "App Stream Repository",
        status: appStream ? "success" : "failed",
        message: appStream ? "AppStream repository configuration is correct" : "AppStream repository configuration is incorrect"
      });

      // Repository URL validation
      socket.emit(`validation-${questionId}-step`, {
        step: "Repository URL",
        status: "loading",
      });

      const validateUrl = await this.service.validateRepoURLs();
      socket.emit(`validation-${questionId}-step`, {
        step: "Repository URL",
        status: validateUrl ? "success" : "failed",
        message: validateUrl ? "Repository URLs are correctly configured" : "Repository URLs are incorrectly configured"
      });

      // Return overall success
      return baseOs && appStream && validateUrl;

    } catch (error) {
      console.error("Error in YUM repository validation:", error);

      // Emit error for all pending steps (excluding internal SSH connection)
      const steps = ["BaseOS Repository", "App Stream Repository", "Repository URL"];
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

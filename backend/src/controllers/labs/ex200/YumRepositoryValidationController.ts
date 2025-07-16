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
          return await this.performYumRepositoryValidation(trackedSocket, validationQuestionId);
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

  private async performYumRepositoryValidation(socket: Socket, questionId: string): Promise<boolean> {
    try {
      // Test SSH connection first (internal validation - not emitted as step)
      const connectionTest = await this.service.testSSHConnection();
      if (!connectionTest.success) {
        console.error("SSH connection failed:", connectionTest.message);
        return false;
      }

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

import { Socket } from "socket.io";
import { YumRepositoryValidationService } from "../../../services/ex200/YumRepositoryValidationService";



export class YumRepositoryValidationController {
  private service: YumRepositoryValidationService;

  constructor() {
    this.service = new YumRepositoryValidationService();
  }

  handleValidation = async (socket: Socket, questionId: string) => {
    try {
      // Test SSH connection first
      socket.emit(`validation-${questionId}-step`, {
        step: "SSH Connection",
        status: "loading",
      });

      const connectionTest = await this.service.testSSHConnection();
      socket.emit(`validation-${questionId}-step`, {
        step: "SSH Connection",
        status: connectionTest.success ? "success" : "failed",
        message: connectionTest.message
      });

      if (!connectionTest.success) {
        socket.emit(`validation-${questionId}-complete`, {
          success: false,
          message: "SSH connection failed. Cannot proceed with validation."
        });
        return;
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
      });

      // Final validation result
      const overallSuccess = baseOs && appStream && validateUrl;
      socket.emit(`validation-${questionId}-complete`, {
        success: overallSuccess,
        message: overallSuccess
          ? "All YUM repository validations passed!"
          : "Some YUM repository validations failed. Please check the steps above."
      });

    } catch (error) {
      console.error("Error in YUM repository validation:", error);

      // Emit error for all pending steps
      const steps = ["SSH Connection", "BaseOS Repository", "App Stream Repository", "Repository URL"];
      steps.forEach(step => {
        socket.emit(`validation-${questionId}-step`, {
          step,
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error occurred"
        });
      });

      socket.emit(`validation-${questionId}-complete`, {
        success: false,
        message: `Validation failed due to error: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  };
}

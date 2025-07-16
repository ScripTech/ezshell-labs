import { Socket } from "socket.io";
import { SELinuxManagementService } from "../../../services/ex200/SELinuxManagementService";
import { ValidationTrackingService } from "../../../services/ValidationTrackingService";

export class SELinuxManagementController {
  private service: SELinuxManagementService;
  private trackingService: ValidationTrackingService;

  constructor() {
    this.service = new SELinuxManagementService();
    this.trackingService = new ValidationTrackingService();
  }

  handleValidation = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

      // Use the new socket tracking validation method
      await this.trackingService.executeValidationWithSocketTracking(
        { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId },
        async (trackedSocket: Socket) => {
          return await this.performSELinuxValidation(trackedSocket, validationQuestionId);
        }
      );

    } catch (error) {
      console.error("Error in SELinux validation:", error);
      socket.emit('validation-error', {
        questionId: data.questionId,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  private async performSELinuxValidation(socket: Socket, questionId: string): Promise<boolean> {
    try {
      socket.emit(`validation-${questionId}-step`, {
        step: "httpd service active",
        status: "loading",
      });
      const isServiceUp = await this.service.validateService("httpd");
      socket.emit(`validation-${questionId}-step`, {
        step: "httpd service active",
        status: isServiceUp ? "success" : "failed",
        message: isServiceUp ? "httpd service is active" : "httpd service is not active"
      });

      socket.emit(`validation-${questionId}-step`, {
        step: "Semanage valid port",
        status: "loading",
      });
      const isPortAccessible = await this.service.validateSemanagePort(82);
      socket.emit(`validation-${questionId}-step`, {
        step: "Semanage valid port",
        status: isPortAccessible ? "success" : "failed",
        message: isPortAccessible ? "Semanage port is correctly configured" : "Semanage port configuration is incorrect"
      });

      socket.emit(`validation-${questionId}-step`, {
        step: "Curl Service to get status",
        status: "loading",
      });
      const curlService = await this.service.validateByCurlTheService(82);
      socket.emit(`validation-${questionId}-step`, {
        step: "Curl Service to get status",
        status: curlService ? "success" : "failed",
        message: curlService ? "Service is accessible via curl" : "Service is not accessible via curl"
      });

      // Return overall success
      return isServiceUp && isPortAccessible && curlService;

    } catch (error) {
      console.error("Error in SELinux validation:", error);

      // Emit error for all pending steps
      const steps = ["httpd service active", "Semanage valid port", "Curl Service to get status"];
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

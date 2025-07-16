import { Socket } from "socket.io";
import { BasicValidationService } from "../../../services/ex200/BasicValidationService";
import { ValidationTrackingService } from "../../../services/ValidationTrackingService";

export class BasicValidationController {
  private service: BasicValidationService;
  private trackingService: ValidationTrackingService;

  constructor() {
    this.service = new BasicValidationService();
    this.trackingService = new ValidationTrackingService();
  }

  // Main validation methods using socket tracking
  handleTarValidation = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

      await this.trackingService.executeValidationWithSocketTracking(
        { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId },
        async (trackedSocket: Socket) => {
          return await this.performTarValidation(trackedSocket, validationQuestionId);
        }
      );
    } catch (error) {
      console.error("Error in tar validation:", error);
      socket.emit('validation-error', {
        questionId: data.questionId,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  private async performTarValidation(socket: Socket, questionId: string): Promise<boolean> {
    try {
      socket.emit(`validation-${questionId}-step`, {
        step: "Create a tar archive",
        status: "loading",
      });

      const isValid = await this.service.tarValidation();

      socket.emit(`validation-${questionId}-step`, {
        step: "Create a tar archive",
        status: isValid ? "success" : "failed",
        message: isValid ? "Tar archive created successfully" : "Tar archive creation failed"
      });

      return isValid;
    } catch (error) {
      console.error("Error in tar validation:", error);
      socket.emit(`validation-${questionId}-step`, {
        step: "Create a tar archive",
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
      return false;
    }
  }

  handleFilePermissionsValidation = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

      await this.trackingService.executeValidationWithSocketTracking(
        { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId },
        async (trackedSocket: Socket) => {
          return await this.performFilePermissionsValidation(trackedSocket, validationQuestionId);
        }
      );
    } catch (error) {
      console.error("Error in file permissions validation:", error);
      socket.emit('validation-error', {
        questionId: data.questionId,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  private async performFilePermissionsValidation(socket: Socket, questionId: string): Promise<boolean> {
    try {
      socket.emit(`validation-${questionId}-step`, {
        step: "File owned by root user and group",
        status: "loading",
      });
      const isOwnedByRootUser = await this.service.filePermissionsValidation_OwnedBy("root");
      socket.emit(`validation-${questionId}-step`, {
        step: "File owned by root user and group",
        status: isOwnedByRootUser ? "success" : "failed",
        message: isOwnedByRootUser ? "File is owned by root user and group" : "File is not owned by root user and group"
      });

      socket.emit(`validation-${questionId}-step`, {
        step: "File belongs to root group",
        status: "loading",
      });
      const belongsToRootGroup = await this.service.filePermissionsValidation_BelongsTO("root");
      socket.emit(`validation-${questionId}-step`, {
        step: "File belongs to root group",
        status: belongsToRootGroup ? "success" : "failed",
        message: belongsToRootGroup ? "File belongs to root group" : "File does not belong to root group"
      });

      socket.emit(`validation-${questionId}-step`, {
        step: "File is not executable",
        status: "loading",
      });
      const isNotExecutable = await this.service.filePermissionsValidation_NotExec();
      socket.emit(`validation-${questionId}-step`, {
        step: "File is not executable",
        status: isNotExecutable ? "success" : "failed",
        message: isNotExecutable ? "File is not executable" : "File is executable (should not be)"
      });

      return isOwnedByRootUser && belongsToRootGroup && isNotExecutable;
    } catch (error) {
      console.error("Error in file permissions validation:", error);
      const steps = ["File owned by root user and group", "File belongs to root group", "File is not executable"];
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

  handleTimeSynchronizationValidation = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

      await this.trackingService.executeValidationWithSocketTracking(
        { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId },
        async (trackedSocket: Socket) => {
          return await this.performTimeSynchronizationValidation(trackedSocket, validationQuestionId);
        }
      );
    } catch (error) {
      console.error("Error in time synchronization validation:", error);
      socket.emit('validation-error', {
        questionId: data.questionId,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  private async performTimeSynchronizationValidation(socket: Socket, questionId: string): Promise<boolean> {
    try {
      socket.emit(`validation-${questionId}-step`, {
        step: "Time synchronization",
        status: "loading",
      });

      const isValid = await this.service.timeSynchronizationValidation();

      socket.emit(`validation-${questionId}-step`, {
        step: "Time synchronization",
        status: isValid ? "success" : "failed",
        message: isValid ? "Time synchronization is properly configured" : "Time synchronization is not properly configured"
      });

      return isValid;
    } catch (error) {
      console.error("Error in time synchronization validation:", error);
      socket.emit(`validation-${questionId}-step`, {
        step: "Time synchronization",
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
      return false;
    }
  }

  handleStringSearchValidation = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

      await this.trackingService.executeValidationWithSocketTracking(
        { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId },
        async (trackedSocket: Socket) => {
          return await this.performStringSearchValidation(trackedSocket, validationQuestionId);
        }
      );
    } catch (error) {
      console.error("Error in string search validation:", error);
      socket.emit('validation-error', {
        questionId: data.questionId,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  private async performStringSearchValidation(socket: Socket, questionId: string): Promise<boolean> {
    try {
      socket.emit(`validation-${questionId}-step`, {
        step: "String search",
        status: "loading",
      });

      const isValid = await this.service.stringSearchValidation();

      socket.emit(`validation-${questionId}-step`, {
        step: "String search",
        status: isValid ? "success" : "failed",
        message: isValid ? "String search completed successfully" : "String search failed"
      });

      return isValid;
    } catch (error) {
      console.error("Error in string search validation:", error);
      socket.emit(`validation-${questionId}-step`, {
        step: "String search",
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
      return false;
    }
  }

  handleTunedProfileValidation = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

      await this.trackingService.executeValidationWithSocketTracking(
        { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId },
        async (trackedSocket: Socket) => {
          return await this.performTunedProfileValidation(trackedSocket, validationQuestionId);
        }
      );
    } catch (error) {
      console.error("Error in tuned profile validation:", error);
      socket.emit('validation-error', {
        questionId: data.questionId,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  private async performTunedProfileValidation(socket: Socket, questionId: string): Promise<boolean> {
    try {
      socket.emit(`validation-${questionId}-step`, {
        step: "Tuned profile configuration",
        status: "loading",
      });

      const isValid = await this.service.tunedProfileValidation();

      socket.emit(`validation-${questionId}-step`, {
        step: "Tuned profile configuration",
        status: isValid ? "success" : "failed",
        message: isValid ? "Tuned profile is correctly configured" : "Tuned profile is not correctly configured"
      });

      return isValid;
    } catch (error) {
      console.error("Error in tuned profile validation:", error);
      socket.emit(`validation-${questionId}-step`, {
        step: "Tuned profile configuration",
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
      return false;
    }
  }
}

import { Socket } from "socket.io";
import { AutofsConfigurationService } from "../../../services/ex200/AutofsConfigurationService";
import { ValidationTrackingService } from "../../../services/ValidationTrackingService";

export class AutofsConfigurationController {
  private service: AutofsConfigurationService;
  private trackingService: ValidationTrackingService;

  constructor() {
    this.service = new AutofsConfigurationService();
    this.trackingService = new ValidationTrackingService();
  }

  handleValidation = async (socket: Socket, questionId: string) => {
    socket.emit(`validation-${questionId}-step`, {
      step: "nfsuser home directory",
      status: "loading",
    });
    const nfsuser = await this.service.validateNFSDir("nfsuser");
    socket.emit(`validation-${questionId}-step`, {
      step: "nfsuser home directory",
      status: nfsuser ? "success" : "failed",
    });

    socket.emit(`validation-${questionId}-step`, {
      step: "NFS-exports directory",
      status: "loading",
    });
    const nfsExports = await this.service.validateNFSexports("nfsuser");
    socket.emit(`validation-${questionId}-step`, {
      step: "NFS-exports directory",
      status: nfsExports ? "success" : "failed",
    });

    socket.emit(`validation-${questionId}-step`, {
      step: "Home directories is writable",
      status: "loading",
    });
    const homeWritable = await this.service.validateHomeWritable("nfsuser");
    socket.emit(`validation-${questionId}-step`, {
      step: "Home directories is writable",
      status: homeWritable ? "success" : "failed",
    });
  };

  // New socket tracking methods
  handleValidationWithSocketTracking = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

      await this.trackingService.executeValidationWithSocketTracking(
        { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId },
        async (trackedSocket: Socket) => {
          return await this.performAutofsValidation(trackedSocket, validationQuestionId);
        }
      );
    } catch (error) {
      console.error("Error in autofs validation:", error);
      socket.emit('validation-error', {
        questionId: data.questionId,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  private async performAutofsValidation(socket: Socket, questionId: string): Promise<boolean> {
    try {
      socket.emit(`validation-${questionId}-step`, {
        step: "nfsuser home directory",
        status: "loading",
      });
      const nfsuser = await this.service.validateNFSDir("nfsuser");
      socket.emit(`validation-${questionId}-step`, {
        step: "nfsuser home directory",
        status: nfsuser ? "success" : "failed",
        message: nfsuser ? "nfsuser home directory is correctly configured" : "nfsuser home directory is not correctly configured"
      });

      socket.emit(`validation-${questionId}-step`, {
        step: "NFS-exports directory",
        status: "loading",
      });
      const nfsExports = await this.service.validateNFSexports("nfsuser");
      socket.emit(`validation-${questionId}-step`, {
        step: "NFS-exports directory",
        status: nfsExports ? "success" : "failed",
        message: nfsExports ? "NFS-exports directory is correctly configured" : "NFS-exports directory is not correctly configured"
      });

      socket.emit(`validation-${questionId}-step`, {
        step: "Home directories is writable",
        status: "loading",
      });
      const homeWritable = await this.service.validateHomeWritable("nfsuser");
      socket.emit(`validation-${questionId}-step`, {
        step: "Home directories is writable",
        status: homeWritable ? "success" : "failed",
        message: homeWritable ? "Home directories are writable" : "Home directories are not writable"
      });

      return nfsuser && nfsExports && homeWritable;
    } catch (error) {
      console.error("Error in autofs validation:", error);
      const steps = ["nfsuser home directory", "NFS-exports directory", "Home directories is writable"];
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

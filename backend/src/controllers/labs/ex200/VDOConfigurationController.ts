import { Socket } from "socket.io";
import { ValidationTrackingService } from "../../../services/ValidationTrackingService";
import { VDOConfigurationService } from "../../../services/ex200/VDOConfigurationService";

export class VDOConfigurationController {
  private trackingService: ValidationTrackingService;
  private vdoService: VDOConfigurationService;

  constructor() {
    this.trackingService = new ValidationTrackingService();
    this.vdoService = new VDOConfigurationService();
  }

  // Socket tracking method for VDO configuration validation
  handleVDOValidationWithSocketTracking = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

      // Initialize the VDO service with dynamic SSH
      await this.vdoService.initialize(userId, labId);

      await this.trackingService.executeValidationWithSocketTracking(
        { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId },
        async (trackedSocket: Socket) => {
          return await this.performVDOValidation(trackedSocket, validationQuestionId);
        }
      );
    } catch (error) {
      console.error("Error in VDO configuration validation:", error);
      socket.emit('validation-error', {
        questionId: data.questionId,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  private async performVDOValidation(socket: Socket, questionId: string): Promise<boolean> {
    try {
      // Check if VDO tools are installed
      socket.emit(`validation-${questionId}-step`, {
        step: "VDO tools installed",
        status: "loading",
      });

      const hasVDOTools = await this.vdoService.checkVDOInstallation();

      socket.emit(`validation-${questionId}-step`, {
        step: "VDO tools installed",
        status: hasVDOTools ? "success" : "failed",
        message: hasVDOTools ? "VDO tools are properly installed" : "VDO tools are not installed"
      });

      // Check VDO service status
      socket.emit(`validation-${questionId}-step`, {
        step: "VDO service active",
        status: "loading",
      });

      const isVDOServiceActive = await this.vdoService.checkVDOServiceStatus();

      socket.emit(`validation-${questionId}-step`, {
        step: "VDO service active",
        status: isVDOServiceActive ? "success" : "failed",
        message: isVDOServiceActive ? "VDO service is active and running" : "VDO service is not active"
      });

      // Check for VDO volumes
      socket.emit(`validation-${questionId}-step`, {
        step: "VDO volumes configured",
        status: "loading",
      });

      const volumeInfo = await this.vdoService.checkVDOVolumes();
      const hasVDOVolumes = volumeInfo.count > 0;

      socket.emit(`validation-${questionId}-step`, {
        step: "VDO volumes configured",
        status: hasVDOVolumes ? "success" : "failed",
        message: hasVDOVolumes ? `VDO volumes are properly configured (${volumeInfo.count} found)` : "No VDO volumes found"
      });

      // Check VDO compression status
      socket.emit(`validation-${questionId}-step`, {
        step: "VDO compression enabled",
        status: "loading",
      });

      const compressionResult = await this.vdoService.checkVDOCompression();

      socket.emit(`validation-${questionId}-step`, {
        step: "VDO compression enabled",
        status: compressionResult.enabled ? "success" : "warning",
        message: compressionResult.enabled ? "VDO compression is enabled" : "VDO compression is not enabled"
      });

      // Check VDO deduplication status
      socket.emit(`validation-${questionId}-step`, {
        step: "VDO deduplication enabled",
        status: "loading",
      });

      const deduplicationResult = await this.vdoService.checkVDODeduplication();

      socket.emit(`validation-${questionId}-step`, {
        step: "VDO deduplication enabled",
        status: deduplicationResult.enabled ? "success" : "warning",
        message: deduplicationResult.enabled ? "VDO deduplication is enabled" : "VDO deduplication is not enabled"
      });

      return hasVDOTools && isVDOServiceActive && hasVDOVolumes;
    } catch (error) {
      console.error("Error in VDO validation:", error);
      const steps = ["VDO tools installed", "VDO service active", "VDO volumes configured", "VDO compression enabled", "VDO deduplication enabled"];
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

import { Socket } from "socket.io";
import { ValidationTrackingService } from "../../../services/ValidationTrackingService";
import { LVMConfigurationService } from "../../../services/ex200/LVMConfigurationService";

export class LVMConfigurationController {
  private trackingService: ValidationTrackingService;
  private service: LVMConfigurationService;

  constructor() {
    this.trackingService = new ValidationTrackingService();
    this.service = new LVMConfigurationService();
  }

  // Socket tracking method for LVM configuration validation
  handleLVMValidationWithSocketTracking = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

      // Initialize service with user and lab context
      console.log(`🔧 Initializing LVMConfigurationController for user ${userId}, lab ${labId}`);
      await this.service.initialize(userId, labId);

      await this.trackingService.executeValidationWithSocketTracking(
        { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId },
        async (trackedSocket: Socket) => {
          return await this.performLVMValidation(trackedSocket, validationQuestionId);
        }
      );
    } catch (error) {
      console.error("Error in LVM configuration validation:", error);
      socket.emit('validation-error', {
        questionId: data.questionId,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  private async performLVMValidation(socket: Socket, questionId: string): Promise<boolean> {
    try {
      // Check if LVM tools are installed
      socket.emit(`validation-${questionId}-step`, {
        step: "LVM tools installed",
        status: "loading",
      });

      const hasLVMTools = await this.service.checkLVMInstallation();

      socket.emit(`validation-${questionId}-step`, {
        step: "LVM tools installed",
        status: hasLVMTools ? "success" : "failed",
        message: hasLVMTools ? "LVM tools are properly installed" : "LVM tools are not installed"
      });

      // Check for physical volumes
      socket.emit(`validation-${questionId}-step`, {
        step: "Physical volumes configured",
        status: "loading",
      });

      const hasPhysicalVolumes = await this.service.checkPhysicalVolumes();

      socket.emit(`validation-${questionId}-step`, {
        step: "Physical volumes configured",
        status: hasPhysicalVolumes ? "success" : "failed",
        message: hasPhysicalVolumes ? "Physical volumes are properly configured" : "No physical volumes found"
      });

      // Check for volume groups
      socket.emit(`validation-${questionId}-step`, {
        step: "Volume groups created",
        status: "loading",
      });

      const hasVolumeGroups = await this.service.checkVolumeGroups();

      socket.emit(`validation-${questionId}-step`, {
        step: "Volume groups created",
        status: hasVolumeGroups ? "success" : "failed",
        message: hasVolumeGroups ? "Volume groups are properly created" : "No volume groups found"
      });

      // Check for logical volumes
      socket.emit(`validation-${questionId}-step`, {
        step: "Logical volumes configured",
        status: "loading",
      });

      const hasLogicalVolumes = await this.service.checkLogicalVolumes();

      socket.emit(`validation-${questionId}-step`, {
        step: "Logical volumes configured",
        status: hasLogicalVolumes ? "success" : "failed",
        message: hasLogicalVolumes ? "Logical volumes are properly configured" : "No logical volumes found"
      });

      return hasLVMTools && hasPhysicalVolumes && hasVolumeGroups && hasLogicalVolumes;
    } catch (error) {
      console.error("Error in LVM validation:", error);
      const steps = ["LVM tools installed", "Physical volumes configured", "Volume groups created", "Logical volumes configured"];
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

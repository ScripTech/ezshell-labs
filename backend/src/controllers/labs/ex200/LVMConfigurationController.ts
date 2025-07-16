import { Socket } from "socket.io";
import { ValidationTrackingService } from "../../../services/ValidationTrackingService";

export class LVMConfigurationController {
  private trackingService: ValidationTrackingService;

  constructor() {
    this.trackingService = new ValidationTrackingService();
  }

  // Socket tracking method for LVM configuration validation
  handleLVMValidationWithSocketTracking = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

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
      
      const hasLVMTools = await this.checkLVMInstallation();
      
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
      
      const hasPhysicalVolumes = await this.checkPhysicalVolumes();
      
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
      
      const hasVolumeGroups = await this.checkVolumeGroups();
      
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
      
      const hasLogicalVolumes = await this.checkLogicalVolumes();
      
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

  // Helper methods for LVM validation
  private async checkLVMInstallation(): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('which lvm', (error: any) => {
        resolve(!error);
      });
    });
  }

  private async checkPhysicalVolumes(): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('pvs --noheadings | wc -l', (error: any, stdout: string) => {
        if (error) {
          resolve(false);
        } else {
          const count = parseInt(stdout.trim());
          resolve(count > 0);
        }
      });
    });
  }

  private async checkVolumeGroups(): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('vgs --noheadings | wc -l', (error: any, stdout: string) => {
        if (error) {
          resolve(false);
        } else {
          const count = parseInt(stdout.trim());
          resolve(count > 0);
        }
      });
    });
  }

  private async checkLogicalVolumes(): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('lvs --noheadings | wc -l', (error: any, stdout: string) => {
        if (error) {
          resolve(false);
        } else {
          const count = parseInt(stdout.trim());
          resolve(count > 0);
        }
      });
    });
  }
}

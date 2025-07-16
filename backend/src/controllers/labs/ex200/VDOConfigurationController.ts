import { Socket } from "socket.io";
import { ValidationTrackingService } from "../../../services/ValidationTrackingService";

export class VDOConfigurationController {
  private trackingService: ValidationTrackingService;

  constructor() {
    this.trackingService = new ValidationTrackingService();
  }

  // Socket tracking method for VDO configuration validation
  handleVDOValidationWithSocketTracking = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

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

      const hasVDOTools = await this.checkVDOInstallation();

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

      const isVDOServiceActive = await this.checkVDOServiceStatus();

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

      const hasVDOVolumes = await this.checkVDOVolumes();

      socket.emit(`validation-${questionId}-step`, {
        step: "VDO volumes configured",
        status: hasVDOVolumes ? "success" : "failed",
        message: hasVDOVolumes ? "VDO volumes are properly configured" : "No VDO volumes found"
      });

      // Check VDO compression status
      socket.emit(`validation-${questionId}-step`, {
        step: "VDO compression enabled",
        status: "loading",
      });

      const compressionEnabled = await this.checkVDOCompression();

      socket.emit(`validation-${questionId}-step`, {
        step: "VDO compression enabled",
        status: compressionEnabled ? "success" : "warning",
        message: compressionEnabled ? "VDO compression is enabled" : "VDO compression is not enabled"
      });

      // Check VDO deduplication status
      socket.emit(`validation-${questionId}-step`, {
        step: "VDO deduplication enabled",
        status: "loading",
      });

      const deduplicationEnabled = await this.checkVDODeduplication();

      socket.emit(`validation-${questionId}-step`, {
        step: "VDO deduplication enabled",
        status: deduplicationEnabled ? "success" : "warning",
        message: deduplicationEnabled ? "VDO deduplication is enabled" : "VDO deduplication is not enabled"
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

  // Helper methods for VDO validation
  private async checkVDOInstallation(): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('which vdo', (error: any) => {
        resolve(!error);
      });
    });
  }

  private async checkVDOServiceStatus(): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('systemctl is-active vdo', (error: any, stdout: string) => {
        resolve(stdout.trim() === 'active');
      });
    });
  }

  private async checkVDOVolumes(): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('vdo list 2>/dev/null | wc -l', (error: any, stdout: string) => {
        if (error) {
          resolve(false);
        } else {
          const count = parseInt(stdout.trim());
          resolve(count > 0);
        }
      });
    });
  }

  private async checkVDOCompression(): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('vdo status --name=* 2>/dev/null | grep -i "compression.*enabled" | wc -l', (error: any, stdout: string) => {
        if (error) {
          resolve(false);
        } else {
          const count = parseInt(stdout.trim());
          resolve(count > 0);
        }
      });
    });
  }

  private async checkVDODeduplication(): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('vdo status --name=* 2>/dev/null | grep -i "deduplication.*enabled" | wc -l', (error: any, stdout: string) => {
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

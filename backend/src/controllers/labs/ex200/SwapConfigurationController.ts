import { Socket } from "socket.io";
import { ValidationTrackingService } from "../../../services/ValidationTrackingService";

export class SwapConfigurationController {
  private trackingService: ValidationTrackingService;

  constructor() {
    this.trackingService = new ValidationTrackingService();
  }

  // Socket tracking method for swap configuration validation
  handleSwapValidationWithSocketTracking = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

      await this.trackingService.executeValidationWithSocketTracking(
        { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId },
        async (trackedSocket: Socket) => {
          return await this.performSwapValidation(trackedSocket, validationQuestionId);
        }
      );
    } catch (error) {
      console.error("Error in swap configuration validation:", error);
      socket.emit('validation-error', {
        questionId: data.questionId,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  private async performSwapValidation(socket: Socket, questionId: string): Promise<boolean> {
    try {
      // Check if swap is enabled
      socket.emit(`validation-${questionId}-step`, {
        step: "Swap space active",
        status: "loading",
      });

      const isSwapActive = await this.checkSwapStatus();

      socket.emit(`validation-${questionId}-step`, {
        step: "Swap space active",
        status: isSwapActive ? "success" : "failed",
        message: isSwapActive ? "Swap space is active and configured" : "No active swap space found"
      });

      // Check swap size
      socket.emit(`validation-${questionId}-step`, {
        step: "Swap size adequate",
        status: "loading",
      });

      const swapSize = await this.checkSwapSize();
      const isSizeAdequate = swapSize > 0;

      socket.emit(`validation-${questionId}-step`, {
        step: "Swap size adequate",
        status: isSizeAdequate ? "success" : "failed",
        message: isSizeAdequate ? `Swap size: ${swapSize}MB is configured` : "Swap size is insufficient"
      });

      // Check if swap is persistent (in fstab)
      socket.emit(`validation-${questionId}-step`, {
        step: "Swap persistent on boot",
        status: "loading",
      });

      const isPersistent = await this.checkSwapPersistence();

      socket.emit(`validation-${questionId}-step`, {
        step: "Swap persistent on boot",
        status: isPersistent ? "success" : "failed",
        message: isPersistent ? "Swap is configured to persist on boot" : "Swap is not configured in /etc/fstab"
      });

      // Check swap priority (optional)
      socket.emit(`validation-${questionId}-step`, {
        step: "Swap priority configured",
        status: "loading",
      });

      const hasPriority = await this.checkSwapPriority();

      socket.emit(`validation-${questionId}-step`, {
        step: "Swap priority configured",
        status: hasPriority ? "success" : "warning",
        message: hasPriority ? "Swap priority is properly configured" : "Swap priority not explicitly set (using default)"
      });

      return isSwapActive && isSizeAdequate && isPersistent;
    } catch (error) {
      console.error("Error in swap validation:", error);
      const steps = ["Swap space active", "Swap size adequate", "Swap persistent on boot", "Swap priority configured"];
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

  // Helper methods for swap validation
  private async checkSwapStatus(): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('swapon --show | wc -l', (error: any, stdout: string) => {
        if (error) {
          resolve(false);
        } else {
          const count = parseInt(stdout.trim());
          resolve(count > 0);
        }
      });
    });
  }

  private async checkSwapSize(): Promise<number> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('free -m | awk \'/^Swap:/ {print $2}\'', (error: any, stdout: string) => {
        if (error) {
          resolve(0);
        } else {
          const size = parseInt(stdout.trim()) || 0;
          resolve(size);
        }
      });
    });
  }

  private async checkSwapPersistence(): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('grep -c "swap" /etc/fstab', (error: any, stdout: string) => {
        if (error) {
          resolve(false);
        } else {
          const count = parseInt(stdout.trim());
          resolve(count > 0);
        }
      });
    });
  }

  private async checkSwapPriority(): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('swapon --show=PRIO | grep -v PRIO | wc -l', (error: any, stdout: string) => {
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

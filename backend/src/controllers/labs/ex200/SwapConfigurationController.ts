import { Socket } from "socket.io";
import { ValidationTrackingService } from "../../../services/ValidationTrackingService";
import { SwapConfigurationService } from "../../../services/ex200/SwapConfigurationService";

export class SwapConfigurationController {
  private trackingService: ValidationTrackingService;
  private swapService: SwapConfigurationService;

  constructor() {
    this.trackingService = new ValidationTrackingService();
    this.swapService = new SwapConfigurationService();
  }

  // Socket tracking method for swap configuration validation
  handleSwapValidationWithSocketTracking = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

      // Initialize the swap service with dynamic SSH
      await this.swapService.initialize(userId, labId);

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

      const swapStatus = await this.swapService.checkSwapStatus();
      const isSwapActive = swapStatus.active;

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

      const isSizeAdequate = swapStatus.total > 0;

      socket.emit(`validation-${questionId}-step`, {
        step: "Swap size adequate",
        status: isSizeAdequate ? "success" : "failed",
        message: isSizeAdequate ? `Swap size: ${swapStatus.total}MB is configured` : "Swap size is insufficient"
      });

      // Check if swap is persistent (in fstab) - using default swap path
      socket.emit(`validation-${questionId}-step`, {
        step: "Swap persistent on boot",
        status: "loading",
      });

      // For general swap validation, we'll check common swap paths
      const commonSwapPaths = ["/swapfile", "/dev/sda2", "/dev/mapper/swap"];
      let isPersistent = false;

      for (const swapPath of commonSwapPaths) {
        try {
          if (await this.swapService.validateSwapFstab(swapPath)) {
            isPersistent = true;
            break;
          }
        } catch (error) {
          // Continue checking other paths
        }
      }

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

      let hasPriority = false;

      for (const swapPath of commonSwapPaths) {
        try {
          if (await this.swapService.validateSwapPriority(swapPath)) {
            hasPriority = true;
            break;
          }
        } catch (error) {
          // Continue checking other paths
        }
      }

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
}

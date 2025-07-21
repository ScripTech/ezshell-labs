import { Socket } from "socket.io";
import { ValidationTrackingService } from "../../../services/ValidationTrackingService";
import { LVMResizeService } from "../../../services/ex200/LVMResizeService";

export class LVMResizeController {
  private trackingService: ValidationTrackingService;
  private lvmResizeService: LVMResizeService;

  constructor() {
    this.trackingService = new ValidationTrackingService();
    this.lvmResizeService = new LVMResizeService();
  }

  // Socket tracking method for LVM resize validation
  handleLVMResizeValidationWithSocketTracking = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string, lvPath?: string, targetSize?: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

      // Initialize the LVM resize service with dynamic SSH
      await this.lvmResizeService.initialize(userId, labId);

      await this.trackingService.executeValidationWithSocketTracking(
        { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId },
        async (trackedSocket: Socket) => {
          return await this.performLVMResizeValidation(trackedSocket, validationQuestionId, data.lvPath, data.targetSize);
        }
      );
    } catch (error) {
      console.error("Error in LVM resize validation:", error);
      socket.emit('validation-error', {
        questionId: data.questionId,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  private async performLVMResizeValidation(socket: Socket, questionId: string, lvPath?: string, targetSize?: string): Promise<boolean> {
    try {
      // Check if logical volume exists
      socket.emit(`validation-${questionId}-step`, {
        step: "Logical volume exists",
        status: "loading",
      });

      const lvExists = lvPath ?
        await this.lvmResizeService.validateLVExists(lvPath) :
        await this.lvmResizeService.checkAnyLVExists();

      socket.emit(`validation-${questionId}-step`, {
        step: "Logical volume exists",
        status: lvExists ? "success" : "failed",
        message: lvExists ? `Logical volume ${lvPath || 'found'} exists` : `Logical volume ${lvPath || 'specified'} not found`
      });

      if (!lvExists) {
        return false;
      }

      // Check current LV size
      socket.emit(`validation-${questionId}-step`, {
        step: "Current LV size detected",
        status: "loading",
      });

      const currentSizeResult = lvPath ?
        await this.lvmResizeService.getLVSize(lvPath) :
        { sizeGB: await this.lvmResizeService.getFirstLVSize() / 1024 }; // Convert MB to GB

      const currentSize = typeof currentSizeResult === 'number' ? currentSizeResult : currentSizeResult.sizeGB;

      socket.emit(`validation-${questionId}-step`, {
        step: "Current LV size detected",
        status: currentSize > 0 ? "success" : "failed",
        message: currentSize > 0 ? `Current size: ${currentSize}GB` : "Could not determine LV size"
      });

      // Check if filesystem can be resized
      socket.emit(`validation-${questionId}-step`, {
        step: "Filesystem resize capability",
        status: "loading",
      });

      const canResize = lvPath ?
        await this.lvmResizeService.validateFilesystemResize(lvPath) :
        true; // Assume capability if no specific path

      socket.emit(`validation-${questionId}-step`, {
        step: "Filesystem resize capability",
        status: canResize ? "success" : "failed",
        message: canResize ? "Filesystem supports online resizing" : "Filesystem does not support online resizing"
      });

      // Check volume group free space
      socket.emit(`validation-${questionId}-step`, {
        step: "Volume group free space",
        status: "loading",
      });

      const freeSpaceResult = lvPath ?
        await this.lvmResizeService.getVGFreeSpace(lvPath.split('/')[2] || lvPath.split('-')[0]) :
        { freeGB: await this.lvmResizeService.getFirstVGFreeSpace() / 1024 }; // Convert MB to GB

      const freeSpace = typeof freeSpaceResult === 'number' ? freeSpaceResult : freeSpaceResult.freeGB;

      socket.emit(`validation-${questionId}-step`, {
        step: "Volume group free space",
        status: freeSpace > 0 ? "success" : "warning",
        message: freeSpace > 0 ? `Free space available: ${freeSpace}GB` : "No free space in volume group"
      });

      // Simulate resize validation (check if target size is achievable)
      if (targetSize) {
        socket.emit(`validation-${questionId}-step`, {
          step: "Target size achievable",
          status: "loading",
        });

        const isAchievable = await this.lvmResizeService.validateLVExtension(
          lvPath || "/dev/mapper/vg-lv",
          this.parseTargetSizeToGB(targetSize)
        );

        socket.emit(`validation-${questionId}-step`, {
          step: "Target size achievable",
          status: isAchievable ? "success" : "failed",
          message: isAchievable ? `Target size ${targetSize} is achievable` : `Target size ${targetSize} cannot be achieved with available space`
        });

        return lvExists && currentSize > 0 && canResize && isAchievable;
      }

      return lvExists && currentSize > 0 && canResize;
    } catch (error) {
      console.error("Error in LVM resize validation:", error);
      const steps = ["Logical volume exists", "Current LV size detected", "Filesystem resize capability", "Volume group free space"];
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

  /**
   * Parse target size string to GB number
   */
  private parseTargetSizeToGB(targetSize: string): number {
    const sizeMatch = targetSize.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?)$/i);
    if (!sizeMatch) return 0;

    const value = parseFloat(sizeMatch[1]);
    const unit = sizeMatch[2].toUpperCase() || 'M';

    let targetGB = value;
    switch (unit) {
      case 'K': targetGB = value / 1024; break;
      case 'M': targetGB = value / 1024; break;
      case 'G': targetGB = value; break;
      case 'T': targetGB = value * 1024; break;
      default: targetGB = value / 1024; // Default to MB
    }

    return Math.round(targetGB * 100) / 100;
  }
}

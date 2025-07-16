import { Socket } from "socket.io";
import { ValidationTrackingService } from "../../../services/ValidationTrackingService";

export class LVMResizeController {
  private trackingService: ValidationTrackingService;

  constructor() {
    this.trackingService = new ValidationTrackingService();
  }

  // Socket tracking method for LVM resize validation
  handleLVMResizeValidationWithSocketTracking = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string, lvPath?: string, targetSize?: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

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
      
      const lvExists = await this.checkLogicalVolumeExists(lvPath);
      
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
      
      const currentSize = await this.getLogicalVolumeSize(lvPath);
      
      socket.emit(`validation-${questionId}-step`, {
        step: "Current LV size detected",
        status: currentSize > 0 ? "success" : "failed",
        message: currentSize > 0 ? `Current size: ${currentSize}MB` : "Could not determine LV size"
      });

      // Check if filesystem can be resized
      socket.emit(`validation-${questionId}-step`, {
        step: "Filesystem resize capability",
        status: "loading",
      });
      
      const canResize = await this.checkFilesystemResizeCapability(lvPath);
      
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
      
      const freeSpace = await this.getVolumeGroupFreeSpace(lvPath);
      
      socket.emit(`validation-${questionId}-step`, {
        step: "Volume group free space",
        status: freeSpace > 0 ? "success" : "warning",
        message: freeSpace > 0 ? `Free space available: ${freeSpace}MB` : "No free space in volume group"
      });

      // Simulate resize validation (check if target size is achievable)
      if (targetSize) {
        socket.emit(`validation-${questionId}-step`, {
          step: "Target size achievable",
          status: "loading",
        });
        
        const isAchievable = await this.validateTargetSize(lvPath, targetSize, freeSpace);
        
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

  // Helper methods for LVM resize validation
  private async checkLogicalVolumeExists(lvPath?: string): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      if (!lvPath) {
        // Check if any logical volumes exist
        exec('lvs --noheadings | wc -l', (error: any, stdout: string) => {
          if (error) {
            resolve(false);
          } else {
            const count = parseInt(stdout.trim());
            resolve(count > 0);
          }
        });
      } else {
        exec(`lvs ${lvPath} 2>/dev/null`, (error: any) => {
          resolve(!error);
        });
      }
    });
  }

  private async getLogicalVolumeSize(lvPath?: string): Promise<number> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      const command = lvPath ? 
        `lvs --noheadings --units m --nosuffix -o lv_size ${lvPath}` :
        `lvs --noheadings --units m --nosuffix -o lv_size | head -1`;
      
      exec(command, (error: any, stdout: string) => {
        if (error) {
          resolve(0);
        } else {
          const size = parseFloat(stdout.trim()) || 0;
          resolve(Math.round(size));
        }
      });
    });
  }

  private async checkFilesystemResizeCapability(lvPath?: string): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      if (!lvPath) {
        resolve(true); // Assume capability exists if no specific path
        return;
      }
      
      exec(`file -s ${lvPath} | grep -E "(ext[234]|xfs)"`, (error: any, stdout: string) => {
        if (error) {
          resolve(false);
        } else {
          // ext2/3/4 and xfs support online resizing
          resolve(stdout.trim().length > 0);
        }
      });
    });
  }

  private async getVolumeGroupFreeSpace(lvPath?: string): Promise<number> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      let command: string;
      if (lvPath) {
        // Extract VG name from LV path
        const vgName = lvPath.split('/')[2] || lvPath.split('-')[0];
        command = `vgs --noheadings --units m --nosuffix -o vg_free ${vgName}`;
      } else {
        command = `vgs --noheadings --units m --nosuffix -o vg_free | head -1`;
      }
      
      exec(command, (error: any, stdout: string) => {
        if (error) {
          resolve(0);
        } else {
          const freeSpace = parseFloat(stdout.trim()) || 0;
          resolve(Math.round(freeSpace));
        }
      });
    });
  }

  private async validateTargetSize(lvPath?: string, targetSize?: string, freeSpace?: number): Promise<boolean> {
    if (!targetSize) return true;
    
    // Parse target size (handle formats like "1G", "500M", etc.)
    const sizeMatch = targetSize.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?)$/i);
    if (!sizeMatch) return false;
    
    const value = parseFloat(sizeMatch[1]);
    const unit = sizeMatch[2].toUpperCase() || 'M';
    
    let targetMB = value;
    switch (unit) {
      case 'K': targetMB = value / 1024; break;
      case 'G': targetMB = value * 1024; break;
      case 'T': targetMB = value * 1024 * 1024; break;
      default: break; // M is default
    }
    
    const currentSize = await this.getLogicalVolumeSize(lvPath);
    const requiredSpace = targetMB - currentSize;
    
    return requiredSpace <= (freeSpace || 0);
  }
}

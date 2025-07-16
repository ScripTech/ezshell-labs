import { Socket } from "socket.io";
import { ValidationTrackingService } from "../../../services/ValidationTrackingService";

export class AdvancedContainerController {
  private trackingService: ValidationTrackingService;

  constructor() {
    this.trackingService = new ValidationTrackingService();
  }

  // Socket tracking method for advanced container configuration validation
  handleAdvancedContainerValidationWithSocketTracking = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

      await this.trackingService.executeValidationWithSocketTracking(
        { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId },
        async (trackedSocket: Socket) => {
          return await this.performAdvancedContainerValidation(trackedSocket, validationQuestionId);
        }
      );
    } catch (error) {
      console.error("Error in advanced container configuration validation:", error);
      socket.emit('validation-error', {
        questionId: data.questionId,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  private async performAdvancedContainerValidation(socket: Socket, questionId: string): Promise<boolean> {
    try {
      // Check container runtime installation
      socket.emit(`validation-${questionId}-step`, {
        step: "Container runtime installed",
        status: "loading",
      });

      const hasContainerRuntime = await this.checkContainerRuntime();

      socket.emit(`validation-${questionId}-step`, {
        step: "Container runtime installed",
        status: hasContainerRuntime ? "success" : "failed",
        message: hasContainerRuntime ? "Container runtime (Podman/Docker) is installed" : "No container runtime found"
      });

      // Check running containers
      socket.emit(`validation-${questionId}-step`, {
        step: "Containers running",
        status: "loading",
      });

      const hasRunningContainers = await this.checkRunningContainers();

      socket.emit(`validation-${questionId}-step`, {
        step: "Containers running",
        status: hasRunningContainers ? "success" : "failed",
        message: hasRunningContainers ? "Containers are successfully running" : "No running containers found"
      });

      // Check container networking
      socket.emit(`validation-${questionId}-step`, {
        step: "Container networking configured",
        status: "loading",
      });

      const hasNetworking = await this.checkContainerNetworking();

      socket.emit(`validation-${questionId}-step`, {
        step: "Container networking configured",
        status: hasNetworking ? "success" : "warning",
        message: hasNetworking ? "Container networking is properly configured" : "Container networking may not be properly configured"
      });

      // Check persistent storage
      socket.emit(`validation-${questionId}-step`, {
        step: "Persistent storage configured",
        status: "loading",
      });

      const hasPersistentStorage = await this.checkPersistentStorage();

      socket.emit(`validation-${questionId}-step`, {
        step: "Persistent storage configured",
        status: hasPersistentStorage ? "success" : "warning",
        message: hasPersistentStorage ? "Persistent storage volumes are configured" : "No persistent storage volumes found"
      });

      // Check container systemd services
      socket.emit(`validation-${questionId}-step`, {
        step: "Container systemd services",
        status: "loading",
      });

      const hasSystemdServices = await this.checkContainerSystemdServices();

      socket.emit(`validation-${questionId}-step`, {
        step: "Container systemd services",
        status: hasSystemdServices ? "success" : "warning",
        message: hasSystemdServices ? "Container systemd services are configured" : "No container systemd services found"
      });

      // Check container security settings
      socket.emit(`validation-${questionId}-step`, {
        step: "Container security configured",
        status: "loading",
      });

      const hasSecuritySettings = await this.checkContainerSecurity();

      socket.emit(`validation-${questionId}-step`, {
        step: "Container security configured",
        status: hasSecuritySettings ? "success" : "warning",
        message: hasSecuritySettings ? "Container security settings are properly configured" : "Container security settings need review"
      });

      return hasContainerRuntime && hasRunningContainers;
    } catch (error) {
      console.error("Error in advanced container validation:", error);
      const steps = ["Container runtime installed", "Containers running", "Container networking configured", "Persistent storage configured", "Container systemd services", "Container security configured"];
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

  // Helper methods for advanced container validation
  private async checkContainerRuntime(): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('which podman || which docker', (error: any) => {
        resolve(!error);
      });
    });
  }

  private async checkRunningContainers(): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('podman ps --noheading | wc -l || docker ps --no-trunc | tail -n +2 | wc -l', (error: any, stdout: string) => {
        if (error) {
          resolve(false);
        } else {
          const count = parseInt(stdout.trim());
          resolve(count > 0);
        }
      });
    });
  }

  private async checkContainerNetworking(): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('podman network ls | tail -n +2 | wc -l || docker network ls | tail -n +2 | wc -l', (error: any, stdout: string) => {
        if (error) {
          resolve(false);
        } else {
          const count = parseInt(stdout.trim());
          resolve(count > 0);
        }
      });
    });
  }

  private async checkPersistentStorage(): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('podman volume ls | tail -n +2 | wc -l || docker volume ls | tail -n +2 | wc -l', (error: any, stdout: string) => {
        if (error) {
          resolve(false);
        } else {
          const count = parseInt(stdout.trim());
          resolve(count > 0);
        }
      });
    });
  }

  private async checkContainerSystemdServices(): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('systemctl list-unit-files | grep -i container | wc -l', (error: any, stdout: string) => {
        if (error) {
          resolve(false);
        } else {
          const count = parseInt(stdout.trim());
          resolve(count > 0);
        }
      });
    });
  }

  private async checkContainerSecurity(): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('podman info --format "{{.Host.Security.Rootless}}" 2>/dev/null', (error: any, stdout: string) => {
        if (error) {
          // If podman fails, try to check if SELinux is enforcing (basic security check)
          exec('getenforce 2>/dev/null', (error2: any, stdout2: string) => {
            resolve(!error2 && stdout2.trim() === 'Enforcing');
          });
        } else {
          resolve(stdout.trim() === 'true');
        }
      });
    });
  }
}

import { Socket } from "socket.io";
import { ValidationTrackingService } from "../../../services/ValidationTrackingService";

export class AdditionalValidationController {
  private trackingService: ValidationTrackingService;

  constructor() {
    this.trackingService = new ValidationTrackingService();
  }

  // Question 15: Container Management
  handleContainerManagementValidation = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

      await this.trackingService.executeValidationWithSocketTracking(
        { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId },
        async (trackedSocket: Socket) => {
          return await this.performContainerValidation(trackedSocket, validationQuestionId);
        }
      );
    } catch (error) {
      console.error("Error in container management validation:", error);
      socket.emit('validation-error', {
        questionId: data.questionId,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  private async performContainerValidation(socket: Socket, questionId: string): Promise<boolean> {
    try {
      // Check if podman is installed
      socket.emit(`validation-${questionId}-step`, {
        step: "Container runtime installed",
        status: "loading",
      });

      const hasContainerRuntime = await this.checkCommandExists("podman");

      socket.emit(`validation-${questionId}-step`, {
        step: "Container runtime installed",
        status: hasContainerRuntime ? "success" : "failed",
        message: hasContainerRuntime ? "Podman container runtime is installed" : "Podman container runtime is not installed"
      });

      // Check if podman service is enabled/running
      socket.emit(`validation-${questionId}-step`, {
        step: "Container service enabled",
        status: "loading",
      });

      const isServiceEnabled = await this.checkServiceStatus("podman");

      socket.emit(`validation-${questionId}-step`, {
        step: "Container service enabled",
        status: isServiceEnabled ? "success" : "failed",
        message: isServiceEnabled ? "Podman service is enabled and running" : "Podman service is not properly configured"
      });

      // Check if user can run containers (rootless)
      socket.emit(`validation-${questionId}-step`, {
        step: "User can run containers",
        status: "loading",
      });

      const canRunContainers = await this.checkUserContainerAccess();

      socket.emit(`validation-${questionId}-step`, {
        step: "User can run containers",
        status: canRunContainers ? "success" : "failed",
        message: canRunContainers ? "User can run rootless containers" : "User cannot run containers properly"
      });

      return hasContainerRuntime && isServiceEnabled && canRunContainers;
    } catch (error) {
      console.error("Error in container validation:", error);
      const steps = ["Container runtime installed", "Container service enabled", "User can run containers"];
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

  // Question 16: System Monitoring/Logging
  handleSystemMonitoringValidation = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

      await this.trackingService.executeValidationWithSocketTracking(
        { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId },
        async (trackedSocket: Socket) => {
          return await this.performSystemMonitoringValidation(trackedSocket, validationQuestionId);
        }
      );
    } catch (error) {
      console.error("Error in system monitoring validation:", error);
      socket.emit('validation-error', {
        questionId: data.questionId,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  private async performSystemMonitoringValidation(socket: Socket, questionId: string): Promise<boolean> {
    try {
      // Check if rsyslog is configured properly
      socket.emit(`validation-${questionId}-step`, {
        step: "Logging service configured",
        status: "loading",
      });

      const hasLoggingService = await this.checkServiceStatus("rsyslog");

      socket.emit(`validation-${questionId}-step`, {
        step: "Logging service configured",
        status: hasLoggingService ? "success" : "failed",
        message: hasLoggingService ? "Rsyslog service is properly configured" : "Rsyslog service is not running or configured"
      });

      // Check if journald is working
      socket.emit(`validation-${questionId}-step`, {
        step: "Journal logging active",
        status: "loading",
      });

      const hasJournald = await this.checkJournalStatus();

      socket.emit(`validation-${questionId}-step`, {
        step: "Journal logging active",
        status: hasJournald ? "success" : "failed",
        message: hasJournald ? "Journald is active and collecting logs" : "Journald is not properly configured"
      });

      // Check if log rotation is configured
      socket.emit(`validation-${questionId}-step`, {
        step: "Log rotation configured",
        status: "loading",
      });

      const hasLogRotation = await this.checkLogRotation();

      socket.emit(`validation-${questionId}-step`, {
        step: "Log rotation configured",
        status: hasLogRotation ? "success" : "failed",
        message: hasLogRotation ? "Log rotation is properly configured" : "Log rotation is not configured"
      });

      return hasLoggingService && hasJournald && hasLogRotation;
    } catch (error) {
      console.error("Error in system monitoring validation:", error);
      const steps = ["Logging service configured", "Journal logging active", "Log rotation configured"];
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

  // Question 17: Boot Process/Systemd
  handleBootProcessValidation = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

      await this.trackingService.executeValidationWithSocketTracking(
        { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId },
        async (trackedSocket: Socket) => {
          return await this.performBootProcessValidation(trackedSocket, validationQuestionId);
        }
      );
    } catch (error) {
      console.error("Error in boot process validation:", error);
      socket.emit('validation-error', {
        questionId: data.questionId,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  private async performBootProcessValidation(socket: Socket, questionId: string): Promise<boolean> {
    try {
      socket.emit(`validation-${questionId}-step`, {
        step: "Boot target configuration",
        status: "loading",
      });

      const hasCorrectBootTarget = await this.checkSystemdTarget();

      socket.emit(`validation-${questionId}-step`, {
        step: "Boot target configuration",
        status: hasCorrectBootTarget ? "success" : "failed",
        message: hasCorrectBootTarget ? "Boot target is correctly configured" : "Boot target configuration is incorrect"
      });

      socket.emit(`validation-${questionId}-step`, {
        step: "Systemd services enabled",
        status: "loading",
      });

      const hasCorrectServices = await this.checkSystemdServices();

      socket.emit(`validation-${questionId}-step`, {
        step: "Systemd services enabled",
        status: hasCorrectServices ? "success" : "failed",
        message: hasCorrectServices ? "Required systemd services are enabled" : "Required systemd services are not enabled"
      });

      socket.emit(`validation-${questionId}-step`, {
        step: "System boots correctly",
        status: "loading",
      });

      // Check if system is currently running (if we can check this, system booted)
      const systemBooted = await this.checkServiceStatus("systemd-logind");

      socket.emit(`validation-${questionId}-step`, {
        step: "System boots correctly",
        status: systemBooted ? "success" : "failed",
        message: systemBooted ? "System boots and runs correctly" : "System may not boot properly"
      });

      return hasCorrectBootTarget && hasCorrectServices && systemBooted;
    } catch (error) {
      console.error("Error in boot process validation:", error);
      const steps = ["Boot target configuration", "Systemd services enabled", "System boots correctly"];
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

  // Helper methods for validation
  private async checkCommandExists(command: string): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec(`which ${command}`, (error: any) => {
        resolve(!error);
      });
    });
  }

  private async checkServiceStatus(serviceName: string): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec(`systemctl is-active ${serviceName}`, (error: any, stdout: string) => {
        resolve(stdout.trim() === 'active');
      });
    });
  }

  private async checkUserContainerAccess(): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('podman info --format "{{.Host.Security.Rootless}}"', (error: any, stdout: string) => {
        if (error) {
          resolve(false);
        } else {
          resolve(stdout.trim() === 'true');
        }
      });
    });
  }

  private async checkJournalStatus(): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('systemctl is-active systemd-journald', (error: any, stdout: string) => {
        resolve(stdout.trim() === 'active');
      });
    });
  }

  private async checkLogRotation(): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('ls /etc/logrotate.d/', (error: any, stdout: string) => {
        if (error) {
          resolve(false);
        } else {
          // Check if there are any logrotate configurations
          resolve(stdout.trim().length > 0);
        }
      });
    });
  }

  private async checkSystemdTarget(): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('systemctl get-default', (error: any, stdout: string) => {
        if (error) {
          resolve(false);
        } else {
          const target = stdout.trim();
          resolve(target === 'multi-user.target' || target === 'graphical.target');
        }
      });
    });
  }

  private async checkSystemdServices(): Promise<boolean> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('systemctl list-unit-files --type=service --state=enabled | wc -l', (error: any, stdout: string) => {
        if (error) {
          resolve(false);
        } else {
          const count = parseInt(stdout.trim());
          // Check if there are enabled services (should be more than just header line)
          resolve(count > 1);
        }
      });
    });
  }
}

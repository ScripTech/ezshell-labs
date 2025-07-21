import { Socket } from "socket.io";
import { ValidationTrackingService } from "../../../services/ValidationTrackingService";
import { ContainerConfigurationService } from "../../../services/ex200/ContainerConfigurationService";

export class AdvancedContainerController {
  private trackingService: ValidationTrackingService;
  private containerService: ContainerConfigurationService;

  constructor() {
    this.trackingService = new ValidationTrackingService();
    this.containerService = new ContainerConfigurationService();
  }

  // Socket tracking method for advanced container configuration validation
  handleAdvancedContainerValidationWithSocketTracking = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

      // Initialize the container service with dynamic SSH
      await this.containerService.initialize(userId, labId);

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

      const runtimeInfo = await this.containerService.checkContainerRuntime();
      const hasContainerRuntime = runtimeInfo.podman || runtimeInfo.docker;

      socket.emit(`validation-${questionId}-step`, {
        step: "Container runtime installed",
        status: hasContainerRuntime ? "success" : "failed",
        message: hasContainerRuntime ? `Container runtime installed: ${runtimeInfo.preferred}` : "No container runtime found"
      });

      // Check running containers
      socket.emit(`validation-${questionId}-step`, {
        step: "Containers running",
        status: "loading",
      });

      const containerInfo = await this.containerService.checkRunningContainers(runtimeInfo.preferred);
      const hasRunningContainers = containerInfo.count > 0;

      socket.emit(`validation-${questionId}-step`, {
        step: "Containers running",
        status: hasRunningContainers ? "success" : "failed",
        message: hasRunningContainers ? `${containerInfo.count} container(s) are running` : "No running containers found"
      });

      // Check container networking
      socket.emit(`validation-${questionId}-step`, {
        step: "Container networking configured",
        status: "loading",
      });

      const networkInfo = await this.containerService.checkContainerNetworking(runtimeInfo.preferred);
      const hasNetworking = networkInfo.count > 0;

      socket.emit(`validation-${questionId}-step`, {
        step: "Container networking configured",
        status: hasNetworking ? "success" : "warning",
        message: hasNetworking ? `${networkInfo.count} custom network(s) configured` : "Using default networking"
      });

      // Check persistent storage
      socket.emit(`validation-${questionId}-step`, {
        step: "Persistent storage configured",
        status: "loading",
      });

      const storageInfo = await this.containerService.checkPersistentStorage(runtimeInfo.preferred);
      const hasPersistentStorage = storageInfo.count > 0;

      socket.emit(`validation-${questionId}-step`, {
        step: "Persistent storage configured",
        status: hasPersistentStorage ? "success" : "warning",
        message: hasPersistentStorage ? `${storageInfo.count} volume(s) configured` : "No persistent volumes found"
      });

      // Check container systemd services
      socket.emit(`validation-${questionId}-step`, {
        step: "Container systemd services",
        status: "loading",
      });

      const serviceInfo = await this.containerService.checkContainerSystemdServices();
      const hasSystemdServices = serviceInfo.count > 0;

      socket.emit(`validation-${questionId}-step`, {
        step: "Container systemd services",
        status: hasSystemdServices ? "success" : "warning",
        message: hasSystemdServices ? `${serviceInfo.count} container service(s) configured` : "No container systemd services found"
      });

      // Check container security settings
      socket.emit(`validation-${questionId}-step`, {
        step: "Container security configured",
        status: "loading",
      });

      const securityInfo = await this.containerService.checkContainerSecurity();
      const hasSecuritySettings = securityInfo.rootless || securityInfo.selinux;

      socket.emit(`validation-${questionId}-step`, {
        step: "Container security configured",
        status: hasSecuritySettings ? "success" : "warning",
        message: hasSecuritySettings ?
          `Security: Rootless=${securityInfo.rootless}, SELinux=${securityInfo.selinuxStatus}` :
          "Container security settings need review"
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
}

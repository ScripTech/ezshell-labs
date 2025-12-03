import { dynamicSSHService } from "../../utils/dynamic-ssh-service";

export class ContainerConfigurationService {
  private userId?: string;
  private labId?: string;

  /**
   * Initialize the service with user and lab context
   */
  async initialize(userId: string, labId: string): Promise<boolean> {
    this.userId = userId;
    this.labId = labId;

    console.log(`🔧 Initializing ContainerConfigurationService for user ${userId}, lab ${labId}`);
    return await dynamicSSHService.connectToLab(userId, labId);
  }

  /**
   * Check if container runtime (Podman/Docker) is installed
   */
  async checkContainerRuntime(): Promise<{ podman: boolean; docker: boolean; preferred: string }> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      const podmanResult = await dynamicSSHService.executeCommand('which podman 2>/dev/null && echo "found"');
      const dockerResult = await dynamicSSHService.executeCommand('which docker 2>/dev/null && echo "found"');

      const podman = podmanResult.includes("found");
      const docker = dockerResult.includes("found");

      // Determine preferred runtime (Podman is preferred for RHEL-based systems)
      let preferred = "none";
      if (podman) preferred = "podman";
      else if (docker) preferred = "docker";

      return { podman, docker, preferred };
    } catch (error) {
      console.error("Error checking container runtime:", error);
      return { podman: false, docker: false, preferred: "none" };
    }
  }

  /**
   * Check running containers
   */
  async checkRunningContainers(runtime?: string): Promise<{ count: number; containers: string[] }> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      let command = "";
      if (runtime === "podman" || !runtime) {
        command = 'podman ps --format "{{.Names}}" 2>/dev/null || echo ""';
      } else if (runtime === "docker") {
        command = 'docker ps --format "{{.Names}}" 2>/dev/null || echo ""';
      }

      const result = await dynamicSSHService.executeCommand(command);
      const containers = result.split('\n').filter(line => line.trim().length > 0);

      return {
        count: containers.length,
        containers
      };
    } catch (error) {
      console.error("Error checking running containers:", error);
      return { count: 0, containers: [] };
    }
  }

  /**
   * Check container networking configuration
   */
  async checkContainerNetworking(runtime?: string): Promise<{ networks: string[]; count: number }> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      let command = "";
      if (runtime === "podman" || !runtime) {
        command = 'podman network ls --format "{{.Name}}" 2>/dev/null | grep -v "^podman$" || echo ""';
      } else if (runtime === "docker") {
        command = 'docker network ls --format "{{.Name}}" 2>/dev/null | grep -v "^bridge\\|host\\|none$" || echo ""';
      }

      const result = await dynamicSSHService.executeCommand(command);
      const networks = result.split('\n').filter(line => line.trim().length > 0);

      return {
        networks,
        count: networks.length
      };
    } catch (error) {
      console.error("Error checking container networking:", error);
      return { networks: [], count: 0 };
    }
  }

  /**
   * Check persistent storage (volumes)
   */
  async checkPersistentStorage(runtime?: string): Promise<{ volumes: string[]; count: number }> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      let command = "";
      if (runtime === "podman" || !runtime) {
        command = 'podman volume ls --format "{{.Name}}" 2>/dev/null || echo ""';
      } else if (runtime === "docker") {
        command = 'docker volume ls --format "{{.Name}}" 2>/dev/null || echo ""';
      }

      const result = await dynamicSSHService.executeCommand(command);
      const volumes = result.split('\n').filter(line => line.trim().length > 0);

      return {
        volumes,
        count: volumes.length
      };
    } catch (error) {
      console.error("Error checking persistent storage:", error);
      return { volumes: [], count: 0 };
    }
  }

  /**
   * Check container systemd services
   */
  async checkContainerSystemdServices(): Promise<{ services: string[]; count: number }> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      const result = await dynamicSSHService.executeCommand('systemctl list-unit-files --type=service | grep -i container | awk \'{print $1}\' || echo ""');
      const services = result.split('\n').filter(line => line.trim().length > 0);

      return {
        services,
        count: services.length
      };
    } catch (error) {
      console.error("Error checking container systemd services:", error);
      return { services: [], count: 0 };
    }
  }

  /**
   * Check container security configuration
   */
  async checkContainerSecurity(): Promise<{
    rootless: boolean;
    selinux: boolean;
    selinuxStatus: string;
    capabilities: string[];
  }> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      // Check rootless containers
      const rootlessResult = await dynamicSSHService.executeCommand('podman info --format "{{.Host.Security.Rootless}}" 2>/dev/null || echo "false"');
      const rootless = rootlessResult.trim() === "true";

      // Check SELinux status
      const selinuxResult = await dynamicSSHService.executeCommand('getenforce 2>/dev/null || echo "Disabled"');
      const selinuxStatus = selinuxResult.trim();
      const selinux = selinuxStatus === "Enforcing";

      // Check container capabilities (if rootless)
      let capabilities: string[] = [];
      if (rootless) {
        try {
          const capResult = await dynamicSSHService.executeCommand('podman info --format "{{.Host.Security.Capabilities}}" 2>/dev/null || echo ""');
          capabilities = capResult.split(',').filter(cap => cap.trim().length > 0);
        } catch (error) {
          // Capabilities check is optional
        }
      }

      return {
        rootless,
        selinux,
        selinuxStatus,
        capabilities
      };
    } catch (error) {
      console.error("Error checking container security:", error);
      return {
        rootless: false,
        selinux: false,
        selinuxStatus: "Unknown",
        capabilities: []
      };
    }
  }

  /**
   * Validate container image management
   */
  async validateContainerImages(runtime?: string): Promise<{ images: string[]; count: number }> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      let command = "";
      if (runtime === "podman" || !runtime) {
        command = 'podman images --format "{{.Repository}}:{{.Tag}}" 2>/dev/null || echo ""';
      } else if (runtime === "docker") {
        command = 'docker images --format "{{.Repository}}:{{.Tag}}" 2>/dev/null || echo ""';
      }

      const result = await dynamicSSHService.executeCommand(command);
      const images = result.split('\n').filter(line => line.trim().length > 0 && !line.includes("<none>"));

      return {
        images,
        count: images.length
      };
    } catch (error) {
      console.error("Error validating container images:", error);
      return { images: [], count: 0 };
    }
  }

  /**
   * Check container registry configuration
   */
  async checkContainerRegistry(): Promise<{ configured: boolean; registries: string[] }> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      // Check podman registries configuration
      const registriesResult = await dynamicSSHService.executeCommand('cat /etc/containers/registries.conf 2>/dev/null | grep "^\\[\\[registry\\]\\]" -A 2 | grep "location" | awk -F\'"\' \'{print $2}\' || echo ""');
      const registries = registriesResult.split('\n').filter(line => line.trim().length > 0);

      const configured = registries.length > 0;

      return {
        configured,
        registries
      };
    } catch (error) {
      console.error("Error checking container registry:", error);
      return { configured: false, registries: [] };
    }
  }

  /**
   * Validate container port mapping
   */
  async validateContainerPorts(runtime?: string): Promise<{ mappings: string[]; count: number }> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      let command = "";
      if (runtime === "podman" || !runtime) {
        command = 'podman ps --format "{{.Names}}:{{.Ports}}" 2>/dev/null | grep -v ":$" || echo ""';
      } else if (runtime === "docker") {
        command = 'docker ps --format "{{.Names}}:{{.Ports}}" 2>/dev/null | grep -v ":$" || echo ""';
      }

      const result = await dynamicSSHService.executeCommand(command);
      const mappings = result.split('\n').filter(line => line.trim().length > 0);

      return {
        mappings,
        count: mappings.length
      };
    } catch (error) {
      console.error("Error validating container ports:", error);
      return { mappings: [], count: 0 };
    }
  }

  /**
   * Check container health status
   */
  async checkContainerHealth(runtime?: string): Promise<{ healthy: number; unhealthy: number; total: number }> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      let command = "";
      if (runtime === "podman" || !runtime) {
        command = 'podman ps -a --format "{{.Status}}" 2>/dev/null || echo ""';
      } else if (runtime === "docker") {
        command = 'docker ps -a --format "{{.Status}}" 2>/dev/null || echo ""';
      }

      const result = await dynamicSSHService.executeCommand(command);
      const statuses = result.split('\n').filter(line => line.trim().length > 0);

      const healthy = statuses.filter(status => status.includes("Up")).length;
      const total = statuses.length;
      const unhealthy = total - healthy;

      return {
        healthy,
        unhealthy,
        total
      };
    } catch (error) {
      console.error("Error checking container health:", error);
      return { healthy: 0, unhealthy: 0, total: 0 };
    }
  }
}

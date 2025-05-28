import { IValidationResult, IValidationService } from "../../interfaces/IValidationService";
import { connectSSH, ssh, executeCommand } from "../../utils/ssh-service";

export class LimitRangeService implements IValidationService {
  private readonly validationSteps = [
    'Project Creation',
    'Pod Memory Limits',
    'Pod CPU Limits',
    'Container Memory Limits and Defaults',
    'Container CPU Limits and Defaults'
  ];

  private readonly limitConfig = {
    project: 'ex280-limits',
    pod: {
      memory: {
        min: '5Mi',
        max: '300Mi'
      },
      cpu: {
        min: '100m',
        max: '500m'
      }
    },
    container: {
      memory: {
        min: '10Mi',
        max: '200Mi',
        defaultRequest: '100Mi'
      },
      cpu: {
        min: '50m',
        max: '300m',
        defaultRequest: '100m'
      }
    }
  };

  async validate(): Promise<IValidationResult> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }

    try {
      const isConnected = await this.verifyOCPConnection();
      if (!isConnected) {
        return {
          success: false,
          message: "Failed to connect to OpenShift cluster",
          details: { error: "OpenShift connection failed" }
        };
      }

      const { success, details } = await this.validateLimitRanges();

      return {
        success,
        details,
        message: success
          ? "Limit ranges are correctly configured"
          : "Limit range configuration is incomplete or incorrect"
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Validation failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  getSteps(): string[] {
    return this.validationSteps;
  }

  private async validateLimitRanges(): Promise<{
    success: boolean;
    details: Record<string, boolean>;
  }> {
    const details: Record<string, boolean> = {
      projectExists: await this.validateProjectExists()
    };

    if (!details.projectExists) {
      return { success: false, details };
    }

    // Get limit range configuration
    const limitRangeYaml = await executeCommand(
      `oc get limitrange -n ${this.limitConfig.project} -o yaml`
    );

    // Validate pod limits
    details['pod_memory_limits'] = this.validateMemoryLimits(
      limitRangeYaml,
      'Pod',
      this.limitConfig.pod.memory
    );
    details['pod_cpu_limits'] = this.validateCPULimits(
      limitRangeYaml,
      'Pod',
      this.limitConfig.pod.cpu
    );

    // Validate container limits
    details['container_memory_limits'] = this.validateMemoryLimits(
      limitRangeYaml,
      'Container',
      this.limitConfig.container.memory
    );
    details['container_cpu_limits'] = this.validateCPULimits(
      limitRangeYaml,
      'Container',
      this.limitConfig.container.cpu
    );

    // Validate container defaults
    details['container_memory_default'] = this.validateDefaultRequest(
      limitRangeYaml,
      'Container',
      'memory',
      this.limitConfig.container.memory.defaultRequest
    );
    details['container_cpu_default'] = this.validateDefaultRequest(
      limitRangeYaml,
      'Container',
      'cpu',
      this.limitConfig.container.cpu.defaultRequest
    );

    const success = Object.values(details).every((result) => result === true);
    return { success, details };
  }

  private async validateProjectExists(): Promise<boolean> {
    try {
      const result = await executeCommand(`oc get project ${this.limitConfig.project}`);
      return result.includes(this.limitConfig.project);
    } catch (error) {
      console.error("Error validating project:", error);
      return false;
    }
  }

  private validateMemoryLimits(yaml: string, type: string, limits: { min: string; max: string }): boolean {
    const section = this.findLimitRangeSection(yaml, type);
    if (!section) return false;

    const hasMin = section.includes(`min: ${limits.min}`);
    const hasMax = section.includes(`max: ${limits.max}`);

    return hasMin && hasMax;
  }

  private validateCPULimits(yaml: string, type: string, limits: { min: string; max: string }): boolean {
    const section = this.findLimitRangeSection(yaml, type);
    if (!section) return false;

    const hasMin = section.includes(`min: ${limits.min}`);
    const hasMax = section.includes(`max: ${limits.max}`);

    return hasMin && hasMax;
  }

  private validateDefaultRequest(
    yaml: string,
    type: string,
    resource: string,
    defaultValue: string
  ): boolean {
    const section = this.findLimitRangeSection(yaml, type);
    if (!section) return false;

    return section.includes(`defaultRequest: ${defaultValue}`);
  }

  private findLimitRangeSection(yaml: string, type: string): string | null {
    const typeRegex = new RegExp(`type:\\s*${type}([\\s\\S]*?)(?=type:|$)`);
    const match = yaml.match(typeRegex);
    return match ? match[1] : null;
  }

  private async verifyOCPConnection(): Promise<boolean> {
    try {
      const ocVersion = await executeCommand('oc version');
      if (!ocVersion || ocVersion.trim() === '') {
        console.error("OpenShift CLI not available");
        return false;
      }

      const clusterInfo = await executeCommand('oc status');
      if (!clusterInfo || clusterInfo.includes("error")) {
        console.error("Failed to get cluster status");
        return false;
      }

      const whoami = await executeCommand('oc whoami');
      if (!whoami || whoami.trim() === '') {
        console.error("Not authenticated to OpenShift cluster");
        return false;
      }

      return true;
    } catch (error) {
      console.error("OCP Connection verification failed:", error);
      return false;
    }
  }
}

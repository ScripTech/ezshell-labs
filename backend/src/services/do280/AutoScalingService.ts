import { IValidationResult, IValidationService } from "../../interfaces/IValidationService";
import { connectSSH, ssh, executeCommand } from "../../utils/ssh-service";

export class AutoScalingService implements IValidationService {
  private readonly validationSteps = [
    'HPA Configuration',
    'Minimum Replicas',
    'Maximum Replicas',
    'CPU Target Utilization',
    'Resource Requests'
  ];

  private readonly config = {
    appName: 'ex280-app',
    hpa: {
      minReplicas: 4,
      maxReplicas: 10,
      targetCPUUtilization: 70
    },
    resources: {
      requests: {
        memory: '100Mi',
        cpu: '25m'
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

      const { success, details } = await this.validateAutoScaling();

      return {
        success,
        details,
        message: success
          ? "Autoscaling configuration is correct"
          : "Autoscaling configuration is incomplete or incorrect"
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

  private async validateAutoScaling(): Promise<{
    success: boolean;
    details: Record<string, boolean>;
  }> {
    const details: Record<string, boolean> = {};

    // Check HPA existence
    details['hpa_exists'] = await this.validateHPAExists();

    if (!details['hpa_exists']) {
      return { success: false, details };
    }

    // Check HPA configuration
    const hpaConfig = await this.getHPAConfig();
    if (hpaConfig) {
      details['min_replicas'] = hpaConfig.minReplicas === this.config.hpa.minReplicas;
      details['max_replicas'] = hpaConfig.maxReplicas === this.config.hpa.maxReplicas;
      details['target_cpu'] = hpaConfig.targetCPUUtilization === this.config.hpa.targetCPUUtilization;
    } else {
      details['min_replicas'] = false;
      details['max_replicas'] = false;
      details['target_cpu'] = false;
    }

    // Check resource requests
    details['resource_requests'] = await this.validateResourceRequests();

    const success = Object.values(details).every((result) => result === true);
    return { success, details };
  }

  private async validateHPAExists(): Promise<boolean> {
    try {
      const result = await executeCommand(`oc get hpa ${this.config.appName}`);
      return result.includes(this.config.appName);
    } catch (error) {
      console.error("Error validating HPA existence:", error);
      return false;
    }
  }

  private async getHPAConfig(): Promise<{
    minReplicas: number;
    maxReplicas: number;
    targetCPUUtilization: number;
  } | null> {
    try {
      const result = await executeCommand(`oc get hpa ${this.config.appName} -o json`);
      const hpa = JSON.parse(result);

      return {
        minReplicas: hpa.spec.minReplicas,
        maxReplicas: hpa.spec.maxReplicas,
        targetCPUUtilization: hpa.spec.targetCPUUtilizationPercentage
      };
    } catch (error) {
      console.error("Error getting HPA configuration:", error);
      return null;
    }
  }

  private async validateResourceRequests(): Promise<boolean> {
    try {
      const result = await executeCommand(
        `oc get deployment ${this.config.appName} -o json`
      );
      const deployment = JSON.parse(result);

      const container = deployment.spec.template.spec.containers[0];
      const requests = container.resources.requests;

      const cpuMatch = requests.cpu === this.config.resources.requests.cpu;
      const memoryMatch = requests.memory === this.config.resources.requests.memory;

      if (!cpuMatch) {
        console.log(`CPU request mismatch. Expected: ${this.config.resources.requests.cpu}, Found: ${requests.cpu}`);
      }
      if (!memoryMatch) {
        console.log(`Memory request mismatch. Expected: ${this.config.resources.requests.memory}, Found: ${requests.memory}`);
      }

      return cpuMatch && memoryMatch;
    } catch (error) {
      console.error("Error validating resource requests:", error);
      return false;
    }
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

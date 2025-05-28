import { IValidationResult, IValidationService } from "../../interfaces/IValidationService";
import { connectSSH, ssh, executeCommand } from "../../utils/ssh-service";

export class ScalingService implements IValidationService {
  private readonly validationSteps = [
    'Application Existence',
    'Replica Count',
    'Pod Health Status'
  ];

  private readonly config = {
    appName: 'ex280-app',
    requiredReplicas: 3
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

      const { success, details } = await this.validateScaling();

      return {
        success,
        details,
        message: success
          ? "Application scaling configuration is correct"
          : "Application scaling configuration is incomplete or incorrect"
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

  private async validateScaling(): Promise<{
    success: boolean;
    details: Record<string, boolean>;
  }> {
    const details: Record<string, boolean> = {};

    // Check if application exists
    details['app_exists'] = await this.validateApplicationExists();

    if (!details['app_exists']) {
      return { success: false, details };
    }

    // Check replica count
    details['replica_count'] = await this.validateReplicaCount();

    // Check pod health
    details['pods_healthy'] = await this.validatePodHealth();

    const success = Object.values(details).every((result) => result === true);
    return { success, details };
  }

  private async validateApplicationExists(): Promise<boolean> {
    try {
      const result = await executeCommand(`oc get deployment ${this.config.appName}`);
      return result.includes(this.config.appName);
    } catch (error) {
      console.error("Error validating application existence:", error);
      return false;
    }
  }

  private async validateReplicaCount(): Promise<boolean> {
    try {
      const result = await executeCommand(
        `oc get deployment ${this.config.appName} -o jsonpath='{.spec.replicas}'`
      );

      const currentReplicas = parseInt(result.trim(), 10);
      const hasCorrectReplicas = currentReplicas === this.config.requiredReplicas;

      if (!hasCorrectReplicas) {
        console.log(`Incorrect number of replicas. Expected: ${this.config.requiredReplicas}, Found: ${currentReplicas}`);
      }

      return hasCorrectReplicas;
    } catch (error) {
      console.error("Error validating replica count:", error);
      return false;
    }
  }

  private async validatePodHealth(): Promise<boolean> {
    try {
      // Get pod status for the deployment
      const result = await executeCommand(
        `oc get pods -l app=${this.config.appName} -o jsonpath='{.items[*].status.phase}'`
      );

      const podStatuses = result.split(' ');
      const runningPods = podStatuses.filter(status => status === 'Running');

      const allPodsRunning = runningPods.length === this.config.requiredReplicas;

      if (!allPodsRunning) {
        console.log(`Not all pods are running. Expected: ${this.config.requiredReplicas} running pods, Found: ${runningPods.length}`);
      }

      return allPodsRunning;
    } catch (error) {
      console.error("Error validating pod health:", error);
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

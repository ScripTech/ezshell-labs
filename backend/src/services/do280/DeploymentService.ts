import { IValidationResult, IValidationService } from "../../interfaces/IValidationService";
import { connectSSH, ssh, executeCommand } from "../../utils/ssh-service";

export class DeploymentService implements IValidationService {
  private readonly validationSteps = [
    'Project Existence',
    'Application Deployment',
    'Image Configuration',
    'Resource Limits',
    'Route Configuration'
  ];

  private readonly config = {
    projectName: 'ex280-demo',
    appName: 'ex280-app',
    image: 'rocky:latest',
    replicas: 2,
    resources: {
      limits: {
        cpu: '500m',
        memory: '512Mi'
      }
    },
    route: 'ex280-app.apps.cluster.example.com'
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

      const { success, details } = await this.validateDeployment();

      return {
        success,
        details,
        message: success
          ? "Application deployment is correctly configured"
          : "Application deployment configuration is incomplete or incorrect"
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

  private async validateDeployment(): Promise<{
    success: boolean;
    details: Record<string, boolean>;
  }> {
    const details: Record<string, boolean> = {};

    // Check project existence
    details['project_exists'] = await this.validateProjectExists();

    if (!details['project_exists']) {
      return { success: false, details };
    }

    // Check deployment exists
    details['deployment_exists'] = await this.validateDeploymentExists();

    if (!details['deployment_exists']) {
      return { success: false, details };
    }

    // Check image configuration
    details['correct_image'] = await this.validateImage();

    // Check resource limits
    details['resource_limits'] = await this.validateResourceLimits();

    // Check route configuration
    details['route_configured'] = await this.validateRoute();

    // Check replica count
    details['replica_count'] = await this.validateReplicaCount();

    const success = Object.values(details).every((result) => result === true);
    return { success, details };
  }

  private async validateProjectExists(): Promise<boolean> {
    try {
      const result = await executeCommand(`oc get project ${this.config.projectName}`);
      return result.includes(this.config.projectName);
    } catch (error) {
      console.error("Error validating project:", error);
      return false;
    }
  }

  private async validateDeploymentExists(): Promise<boolean> {
    try {
      const result = await executeCommand(
        `oc get deployment ${this.config.appName} -n ${this.config.projectName}`
      );
      return result.includes(this.config.appName);
    } catch (error) {
      console.error("Error validating deployment:", error);
      return false;
    }
  }

  private async validateImage(): Promise<boolean> {
    try {
      const result = await executeCommand(
        `oc get deployment ${this.config.appName} -n ${this.config.projectName} -o jsonpath='{.spec.template.spec.containers[0].image}'`
      );
      return result.includes(this.config.image);
    } catch (error) {
      console.error("Error validating image:", error);
      return false;
    }
  }

  private async validateResourceLimits(): Promise<boolean> {
    try {
      const result = await executeCommand(
        `oc get deployment ${this.config.appName} -n ${this.config.projectName} -o json`
      );
      const deployment = JSON.parse(result);

      const container = deployment.spec.template.spec.containers[0];
      const limits = container.resources.limits;

      const cpuMatch = limits.cpu === this.config.resources.limits.cpu;
      const memoryMatch = limits.memory === this.config.resources.limits.memory;

      if (!cpuMatch) {
        console.log(`CPU limit mismatch. Expected: ${this.config.resources.limits.cpu}, Found: ${limits.cpu}`);
      }
      if (!memoryMatch) {
        console.log(`Memory limit mismatch. Expected: ${this.config.resources.limits.memory}, Found: ${limits.memory}`);
      }

      return cpuMatch && memoryMatch;
    } catch (error) {
      console.error("Error validating resource limits:", error);
      return false;
    }
  }

  private async validateRoute(): Promise<boolean> {
    try {
      const result = await executeCommand(
        `oc get route ${this.config.appName} -n ${this.config.projectName} -o jsonpath='{.spec.host}'`
      );
      return result === this.config.route;
    } catch (error) {
      console.error("Error validating route:", error);
      return false;
    }
  }

  private async validateReplicaCount(): Promise<boolean> {
    try {
      const result = await executeCommand(
        `oc get deployment ${this.config.appName} -n ${this.config.projectName} -o jsonpath='{.spec.replicas}'`
      );

      const currentReplicas = parseInt(result.trim(), 10);
      const hasCorrectReplicas = currentReplicas === this.config.replicas;

      if (!hasCorrectReplicas) {
        console.log(`Incorrect number of replicas. Expected: ${this.config.replicas}, Found: ${currentReplicas}`);
      }

      return hasCorrectReplicas;
    } catch (error) {
      console.error("Error validating replica count:", error);
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

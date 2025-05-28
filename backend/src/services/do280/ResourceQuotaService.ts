import { IValidationResult, IValidationService } from "../../interfaces/IValidationService";
import { connectSSH, ssh, executeCommand } from "../../utils/ssh-service";

export class ResourceQuotaService implements IValidationService {
  private readonly validationSteps = [
    'Project Creation',
    'Pods Quota Configuration',
    'CPU Quota Configuration',
    'Services Quota Configuration',
    'Memory Quota Configuration',
    'Secrets Quota Configuration',
    'Replication Controllers Quota Configuration'
  ];

  private readonly quotaConfig = {
    project: 'ex280-quotas',
    resources: {
      pods: '3',
      cpu: '2',
      services: '6',
      memory: '1Gi',
      secrets: '5',
      replicationcontrollers: '6'
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

      const { success, details } = await this.validateQuotaConfiguration();

      return {
        success,
        details,
        message: success
          ? "Resource quota configuration is correct"
          : "Resource quota configuration is incomplete or incorrect"
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

  private async validateQuotaConfiguration(): Promise<{
    success: boolean;
    details: Record<string, boolean>;
  }> {
    const details: Record<string, boolean> = {
      projectExists: await this.validateProjectExists(),
    };

    // Validate each resource quota
    for (const [resource, limit] of Object.entries(this.quotaConfig.resources)) {
      details[`quota_${resource}`] = await this.validateResourceQuota(resource, limit);
    }

    const success = Object.values(details).every(result => result === true);
    return { success, details };
  }

  private async validateProjectExists(): Promise<boolean> {
    try {
      const result = await executeCommand(`oc get project ${this.quotaConfig.project}`);
      const exists = result.includes(this.quotaConfig.project);
      if (!exists) {
        console.log(`Project ${this.quotaConfig.project} not found`);
      }
      return exists;
    } catch (error) {
      console.error("Error validating project:", error);
      return false;
    }
  }

  private async validateResourceQuota(resource: string, limit: string): Promise<boolean> {
    try {
      const result = await executeCommand(
        `oc get resourcequota -n ${this.quotaConfig.project} -o yaml`
      );

      // Verify if the quota exists and has correct limit
      const hasQuota = result.includes(`${resource}:`);
      const hasCorrectLimit = result.includes(`${resource}: "${limit}"`);

      if (!hasQuota) {
        console.log(`Resource quota for ${resource} not found`);
        return false;
      }

      if (!hasCorrectLimit) {
        console.log(`Resource quota for ${resource} has incorrect limit. Expected: ${limit}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error validating ${resource} quota:`, error);
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

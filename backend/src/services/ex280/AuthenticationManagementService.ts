import { IValidationResult, IValidationService } from '../../interfaces/IValidationService';
import { connectSSH, ssh, executeCommand } from "../../utils/ssh-service";

export class AuthenticationManagementService implements IValidationService {
  private readonly validationSteps = [
    'HTPasswd Configuration',
    'OAuth Configuration',
    'Admin User Setup',
    'Developer User Setup',
    'Project Configuration',
    'Role Assignments'
  ];

  async validate(): Promise<IValidationResult> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }

    try {
      // Verify OCP connection first
      const isConnected = await this.verifyOCPConnection();
      if (!isConnected) {
        return {
          success: false,
          message: "Failed to connect to OpenShift cluster",
          details: { error: "OpenShift connection failed" }
        };
      }

      const { success, details } = await this.validateAllAuthenticationConfig();

      return {
        success,
        details,
        message: success
          ? "Authentication configuration is correct"
          : "Authentication configuration is incomplete or incorrect"
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

  private async validateAllAuthenticationConfig(): Promise<{
    success: boolean;
    details: Record<string, boolean>;
  }> {
    const details = {
      htpasswdSecret: await this.validateHtpasswdSecret(),
      oauthConfig: await this.validateOAuthConfig(),
      adminUser: await this.validateUserExists('admin-user'),
      adminUserRole: await this.validateClusterAdminRole('admin-user'),
      devUser: await this.validateUserExists('dev-user'),
      devProject: await this.validateProjectExists('dev-project'),
      devUserRole: await this.validateProjectAdminRole('dev-user', 'dev-project')
    };

    const success = Object.values(details).every(result => result === true);

    return { success, details };
  }

  async validateHtpasswdSecret(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand(
      "oc get secret htpasswd-secret -n openshift-config"
    );
    return result.includes("htpasswd-secret");
  }

  async validateOAuthConfig(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand('oc get oauth cluster -o yaml');
    return (
      result.includes("htpasswd-provider") &&
      result.includes("HTPasswd") &&
      result.includes("htpasswd-secret")
    );
  }

  async validateUserExists(username: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand(`oc get user ${username}`);
    return result.includes(username);
  }

  async validateUserLogin(username: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    // Check if user can authenticate
    const result = await executeCommand(`oc whoami --as ${username}`);
    return result.includes(username);
  }

  async validateClusterAdminRole(username: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand(
      `oc get clusterrolebindings -o wide | grep ${username}`
    );
    return result.includes('cluster-admin') && result.includes(username);
  }

  async validateProjectAdminRole(username: string, project: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand(`oc get rolebinding -n ${project} -o wide | grep ${username}`);
    return result.includes('admin') && result.includes(username);
  }

  async validateProjectExists(project: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand(`oc get project ${project}`);
    return result.includes(project);
  }

  private async verifyOCPConnection(): Promise<boolean> {
    try {
      // First check if oc CLI is available
      const ocVersion = await executeCommand('oc version');
      if (!ocVersion || ocVersion.trim() === '') {
        console.error("OpenShift CLI not available or not responding");
        return false;
      }

      // Try to get cluster info
      const clusterInfo = await executeCommand('oc status');
      if (!clusterInfo || clusterInfo.includes("error")) {
        console.error("Failed to get cluster status");
        return false;
      }

      // Check if we're authenticated
      const whoami = await executeCommand('oc whoami');
      if (!whoami || whoami.trim() === '') {
        console.error("Not authenticated to OpenShift cluster");
        return false;
      }

      console.log("OCP Connection verified:", {
        user: whoami.trim(),
        clusterInfo: clusterInfo.split('\n')[0]
      });

      return true;
    } catch (error) {
      console.error("OCP Connection verification failed:", error);
      return false;
    }
  }
}

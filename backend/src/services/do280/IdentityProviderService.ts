import { IValidationResult, IValidationService } from "../../interfaces/IValidationService";
import { connectSSH, ssh, executeCommand } from "../../utils/ssh-service";

export class IdentityProviderService implements IValidationService {
  private readonly validationSteps = [
    'HTPasswd Secret Configuration',
    'OAuth Provider Configuration',
    // Individual user validation steps
    'User bob Validation',
    'User qwerty Validation',
    'User john Validation',
    'User armstrong Validation',
    'User natasha Validation',
    'User harry Validation',
    'User susan Validation',
    // Authentication validation steps
    'User bob Authentication',
    'User qwerty Authentication',
    'User john Authentication',
    'User armstrong Authentication',
    'User natasha Authentication',
    'User harry Authentication',
    'User susan Authentication'
  ];

  private readonly userCredentials = [
    { username: 'bob', password: 'indionce' },
    { username: 'qwerty', password: 'catalog' },
    { username: 'john', password: 'john123' },
    { username: 'armstrong', password: 'natasha123' },
    { username: 'natasha', password: 'arthstrong' },
    { username: 'harry', password: 'harry123' },
    { username: 'susan', password: 'susuan123' }
  ];

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

      const { success, details } = await this.validateAllIdentityConfig();

      return {
        success,
        details,
        message: success
          ? "Identity provider configuration is correct"
          : "Identity provider configuration is incomplete or incorrect"
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

  private async validateAllIdentityConfig(): Promise<{
    success: boolean;
    details: Record<string, boolean>;
  }> {
    const details: Record<string, boolean> = {
      htpasswdSecret: await this.validateHtpasswdSecret(),
      oauthConfig: await this.validateOAuthConfig(),
    };

    // Add individual user existence validation
    for (const { username } of this.userCredentials) {
      details[`user_${username}_exists`] = await this.validateUserExists(username);
    }

    // Add individual user authentication validation
    for (const { username } of this.userCredentials) {
      details[`user_${username}_auth`] = await this.validateUserAuthentication(username);
    }

    const success = Object.values(details).every(result => result === true);
    return { success, details };
  }

  private async validateHtpasswdSecret(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand(
      "oc get secret ex280-secure -n openshift-config"
    );
    return result.includes("ex280-secure");
  }

  private async validateOAuthConfig(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand('oc get oauth cluster -o yaml');
    return (
      result.includes("ex280-secure") &&
      result.includes("HTPasswd") &&
      result.includes("ex280-secret-provider")
    );
  }

  private async validateUserExists(username: string): Promise<boolean> {
    try {
      const result = await executeCommand(`oc get user ${username}`);
      return result.includes(username);
    } catch (error) {
      console.log(`Error validating user ${username}:`, error);
      return false;
    }
  }

  private async validateUserAuthentication(username: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }

    // Find user credentials
    const user = this.userCredentials.find(u => u.username === username);
    if (!user) {
      console.error(`No credentials found for user: ${username}`);
      return false;
    }
    const password = user.password;

    // Sanitize username to prevent command injection
    if (!username || /[^a-zA-Z0-9-_@.]/.test(username)) {
      console.error(`Invalid username: ${username}`);
      return false;
    }

    // Use a temporary kubeconfig to avoid modifying the current session
    const tempKubeconfig = `/tmp/kubeconfig-${Date.now()}.yaml`;
    try {
      // Attempt login with oc login
      const loginCommand = `oc login -u "${username}" -p "${password}" "${process.env.OCP_SERVER ?? "https://api.emucanze.ezetsu.lab:6443"}"--insecure-skip-tls-verify=true`;
      await executeCommand(loginCommand);

      // Verify the user is authenticated
      const whoamiCommand = `oc whoami --kubeconfig="${tempKubeconfig}"`;
      const result = await executeCommand(whoamiCommand);

      // Check if the output exactly matches the username
      const isAuthenticated = result.trim() === username;
      if (isAuthenticated) {
        console.log(`User ${username} authenticated successfully`);
      } else {
        console.log(`User ${username} authentication failed: whoami output mismatch`);
      }
      return isAuthenticated;
    } catch (error: any) {
      console.error(`Error authenticating user ${username}:`, error.message || error);
      return false;
    } finally {
      // Clean up temporary kubeconfig
      await executeCommand(`rm -f "${tempKubeconfig}"`).catch(() => {
        console.warn(`Failed to delete temporary kubeconfig: ${tempKubeconfig}`);
      });
    }
  }

  private async verifyOCPConnection(): Promise<boolean> {
    try {
      const ocVersion = await executeCommand('oc version');
      if (!ocVersion || ocVersion.trim() === '') {
        console.error("OpenShift CLI not available or not responding");
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

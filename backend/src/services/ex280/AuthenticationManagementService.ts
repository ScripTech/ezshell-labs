import {
  connectSSH,
  ssh,
  executeCommand
} from "../../utils/ssh-service";

export class AuthenticationManagementService {
  async validateHtpasswdSecret(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand('oc get secret htpass-secret -n openshift-config');
    return result.includes('htpass-secret');
  }

  async validateOAuthConfig(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand('oc get oauth cluster -o yaml');
    return result.includes('htpasswd_provider') &&
           result.includes('HTPasswd') &&
           result.includes('htpass-secret');
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
    const result = await executeCommand(`oc get clusterrolebinding -o yaml | grep ${username}`);
    return result.includes('cluster-admin') && result.includes(username);
  }

  async validateProjectAdminRole(username: string, project: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand(`oc get rolebinding -n ${project} -o yaml | grep ${username}`);
    return result.includes('admin') && result.includes(username);
  }

  async validateProjectExists(project: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand(`oc get project ${project}`);
    return result.includes(project);
  }

  async validateAllAuthenticationConfig(): Promise<{
    success: boolean;
    details: {
      htpasswdSecret: boolean;
      oauthConfig: boolean;
      adminUser: boolean;
      devUser: boolean;
      adminUserRole: boolean;
      devProject: boolean;
      devUserRole: boolean;
    };
  }> {
    const htpasswdSecret = await this.validateHtpasswdSecret();
    const oauthConfig = await this.validateOAuthConfig();
    const adminUser = await this.validateUserExists('admin-user');
    const devUser = await this.validateUserExists('dev-user');
    const adminUserRole = await this.validateClusterAdminRole('admin-user');
    const devProject = await this.validateProjectExists('dev-project');
    const devUserRole = await this.validateProjectAdminRole('dev-user', 'dev-project');

    const success =
      htpasswdSecret &&
      oauthConfig &&
      adminUser &&
      devUser &&
      adminUserRole &&
      devProject &&
      devUserRole;

    return {
      success,
      details: {
        htpasswdSecret,
        oauthConfig,
        adminUser,
        devUser,
        adminUserRole,
        devProject,
        devUserRole
      }
    };
  }
}

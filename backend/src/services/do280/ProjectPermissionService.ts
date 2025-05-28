import { IValidationResult, IValidationService } from "../../interfaces/IValidationService";
import { connectSSH, ssh, executeCommand } from "../../utils/ssh-service";

export class ProjectPermissionService implements IValidationService {
  private readonly validationSteps = [
    'Project Creation',
    'Cluster Admin Rights',
    'Project Creation Rights',
    'View Role Permissions',
    'Developer Role Permissions',
    'Admin Role Permissions',
    'Kubeadmin Removal'
  ];

  private readonly projectConfigs = [
    'ex280-applo',
    'ex280-demo',
    'ex280-test'
  ];

  async validate(): Promise<IValidationResult> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }

    try {
      const { success, details } = await this.validateProjectPermissions();

      return {
        success,
        details,
        message: success
          ? "Project permissions are configured correctly"
          : "Project permissions configuration is incomplete or incorrect"
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

  private async validateProjectPermissions(): Promise<{
    success: boolean;
    details: Record<string, boolean>;
  }> {
    const details = {
      projectsExist: await this.validateProjects(),
      bobClusterAdmin: await this.validateClusterAdmin('bob'),
      johnProjectCreation: await this.validateProjectCreation('john'),
      qwertyNoProjectCreation: await this.validateNoProjectCreation('qwerty'),
      natashaViewerRoles: await this.validateViewerRoles('natasha', ['ex280-applo', 'ex280-test']),
      susanViewerRole: await this.validateViewerRole('susan', 'ex280-demo'),
      harryDeveloperRole: await this.validateDeveloperRole('harry', 'ex280-test'),
      armstrongAdminRole: await this.validateAdminRole('armstrong', 'ex280-applo'),
      kubeadminRemoved: await this.validateKubeadminRemoved()
    };

    const success = Object.values(details).every(result => result === true);
    return { success, details };
  }

  private async validateProjects(): Promise<boolean> {
    try {
      for (const project of this.projectConfigs) {
        const result = await executeCommand(`oc get project ${project}`);
        if (!result.includes(project)) {
          console.log(`Project ${project} not found`);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error("Error validating projects:", error);
      return false;
    }
  }

  private async validateClusterAdmin(username: string): Promise<boolean> {
    try {
      const result = await executeCommand(`oc get clusterrolebinding -o yaml | grep ${username}`);
      return result.includes('cluster-admin');
    } catch (error) {
      console.error(`Error validating cluster admin rights for ${username}:`, error);
      return false;
    }
  }

  private async validateProjectCreation(username: string): Promise<boolean> {
    try {
      const result = await executeCommand(`oc get clusterrolebinding -o yaml | grep ${username}`);
      return result.includes('self-provisioner');
    } catch (error) {
      console.error(`Error validating project creation rights for ${username}:`, error);
      return false;
    }
  }

  private async validateNoProjectCreation(username: string): Promise<boolean> {
    try {
      const result = await executeCommand(`oc get clusterrolebinding -o yaml | grep ${username}`);
      return !result.includes('self-provisioner');
    } catch (error) {
      console.error(`Error validating no project creation rights for ${username}:`, error);
      return false;
    }
  }

  private async validateViewerRoles(username: string, projects: string[]): Promise<boolean> {
    try {
      for (const project of projects) {
        const result = await executeCommand(`oc get rolebinding -n ${project} -o yaml | grep ${username}`);
        if (!result.includes('view')) {
          console.log(`User ${username} does not have viewer role in ${project}`);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error(`Error validating viewer roles for ${username}:`, error);
      return false;
    }
  }

  private async validateViewerRole(username: string, project: string): Promise<boolean> {
    try {
      const result = await executeCommand(`oc get rolebinding -n ${project} -o yaml | grep ${username}`);
      return result.includes('view');
    } catch (error) {
      console.error(`Error validating viewer role for ${username} in ${project}:`, error);
      return false;
    }
  }

  private async validateDeveloperRole(username: string, project: string): Promise<boolean> {
    try {
      const result = await executeCommand(`oc get rolebinding -n ${project} -o yaml | grep ${username}`);
      return result.includes('edit');
    } catch (error) {
      console.error(`Error validating developer role for ${username} in ${project}:`, error);
      return false;
    }
  }

  private async validateAdminRole(username: string, project: string): Promise<boolean> {
    try {
      const result = await executeCommand(`oc get rolebinding -n ${project} -o yaml | grep ${username}`);
      return result.includes('admin');
    } catch (error) {
      console.error(`Error validating admin role for ${username} in ${project}:`, error);
      return false;
    }
  }

  private async validateKubeadminRemoved(): Promise<boolean> {
    try {
      const result = await executeCommand('oc get user kubeadmin');
      return result.includes('not found');
    } catch (error) {
      // In this case, an error means the user doesn't exist, which is what we want
      return true;
    }
  }
}

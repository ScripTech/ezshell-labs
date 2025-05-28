import { IValidationResult, IValidationService } from "../../interfaces/IValidationService";
import { connectSSH, ssh, executeCommand } from "../../utils/ssh-service";

export class ProjectPermissionService implements IValidationService {
  private readonly validationSteps = [
    'Project Creation',
    'Cluster Admin Rights',
    'Project Creation Rights',
    'View Role Permissions',
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
      // Use oc command with a safe approach to list clusterrolebindings
      const cmd = `oc get clusterrolebinding -o jsonpath='{range .items[*]}{.metadata.name}{"\\t"}{.roleRef.name}{"\\t"}{range .subjects[*]}{.name}{" "}{end}{"\\n"}{end}' 2>/dev/null`;
      const result = await executeCommand(cmd);

      // Parse the output line by line
      const lines = result.trim().split("\n");
      for (const line of lines) {
        const [bindingName, roleName, subjects] = line.split("\t");
        if (roleName === "cluster-admin" && subjects.includes(username)) {
          console.log(
            `User ${username} has cluster-admin rights via ${bindingName}`
          );
          return true;
        }
      }

      console.log(`User ${username} does not have cluster-admin rights`);
      return false;
    } catch (error) {
      console.error(
        `Error validating cluster admin rights for ${username}:`, error
      );
      return false;
    }
  }

  private async validateProjectCreation(username: string): Promise<boolean> {
    try {
      // Use oc command with a safe approach to list clusterrolebindings
      const cmd = `oc get clusterrolebinding -o jsonpath='{range .items[*]}{.metadata.name}{"\\t"}{.roleRef.name}{"\\t"}{range .subjects[*]}{.name}{" "}{end}{"\\n"}{end}' 2>/dev/null`;
      const result = await executeCommand(cmd);
      // Parse the output line by line
      const lines = result.trim().split("\n");
      for (const line of lines) {
        const [bindingName, roleName, subjects] = line.split("\t");
        // console.log(Checking binding: ${bindingName}, Role: ${roleName}, Subjects: ${subjects}`);
        if (roleName === "self-provisioner" && subjects.includes(username)) {
          console.log(
            `User ${username} has self-provisioner rights via ${bindingName}`
          );
          return true;
        }
      }
      console.log(`User ${username} does not have self-provisioner rights`);
      return false;
    } catch (error) {
      console.error(
        `Error validating self-provisioner rights for ${username}:`,
        error
      );
      return false;
    }
  }

  private async validateNoProjectCreation(username: string): Promise<boolean> {
    try {
      // Use oc command with a safe approach to list clusterrolebindings
      const cmd = `oc get clusterrolebinding -o jsonpath='{range .items[*]}{.metadata.name}{"\\t"}{.roleRef.name}{"\\t"}{range .subjects[*]}{.name}{" "}{end}{"\\n"}{end}' 2>/dev/null`;
      const result = await executeCommand(cmd);
      // Parse the output line by line
      const lines = result.trim().split("\n");
      for (const line of lines) {
        const [bindingName, roleName, subjects] = line.split("\t");
        // console.log(Checking binding: ${bindingName}, Role: ${roleName}, Subjects: ${subjects}`);
        if (roleName === "self-provisioner" && subjects.includes(username)) {
          console.log(
            `User ${username} has self-provisioner rights via ${bindingName}`
          );
          return false;
        }
      }
      console.log(`User ${username} does not have self-provisioner rights`);
      return true;
    } catch (error) {
      console.error(
        `Error validating self-provisioner rights for ${username}:`,
        error
      );
      return false;
    }
  }

  private async validateViewerRoles(username: string, projects: string[]): Promise<boolean> {
    // Sanitize inputs to prevent command injection
  if (!username || /[^a-zA-Z0-9-_@.]/.test(username)) {
    console.error(`Invalid username: ${username}`);
    return false;
  }
  for (const project of projects) {
    if (!project || /[^a-zA-Z0-9-_]/.test(project)) {
      console.error(`Invalid project name: ${project}`);
      return false;
    }
  }

  try {
    for (const project of projects) {
      // Use oc command with jsonpath to safely retrieve RoleBindings
      const cmd = `oc get rolebinding -n ${project} -o jsonpath='{range .items[*]}{.metadata.name}{"\\t"}{.roleRef.name}{"\\t"}{range .subjects[*]}{.name}{" "}{end}{"\\n"}{end}' 2>/dev/null`;
      const result = await executeCommand(cmd);

      // Parse the output line by line
      const lines = result.trim().split('\n');
      let hasViewRole = false;

      for (const line of lines) {
        if (!line) continue;
        const [bindingName, roleName, subjectsStr] = line.split('\t');
        const subjects = subjectsStr.trim().split(' ').filter(s => s);

        console.log(`Checking binding: ${bindingName}, Role: ${roleName}, Subjects: ${subjectsStr}`);

        if (roleName === 'view' && subjects.includes(username)) {
          console.log(`User ${username} has viewer role in ${project} via ${bindingName}`);
          return true;
          break;
        }
      }

      if (!hasViewRole) {
        console.log(`User ${username} does not have viewer role in ${project}`);
        return false;
      }
    }
    return false;
  } catch (error) {
    console.error(`Error validating viewer roles for ${username}:`, error);
    return false;
  }
}

  private async validateViewerRole(username: string, project: string): Promise<boolean> {
    try {
      const cmd = `oc get rolebinding -n ${project} -o jsonpath='{range .items[*]}{.metadata.name}{"\\t"}{.roleRef.name}{"\\t"}{range .subjects[*]}{.name}{" "}{end}{"\\n"}{end}' 2>/dev/null`;
      const result = await executeCommand(cmd);

      // Parse the output line by line
      const lines = result.trim().split("\n");

      for (const line of lines) {
        if (!line) continue;
        const [bindingName, roleName, subjectsStr] = line.split("\t");
        const subjects = subjectsStr
          .trim()
          .split(" ")
          .filter((s) => s);

        console.log(
          `Checking binding: ${bindingName}, Role: ${roleName}, Subjects: ${subjectsStr}`
        );

        if (roleName === "view" && subjects.includes(username)) {
          console.log(
            `User ${username} has viewer role in ${project} via ${bindingName}`
          );
          return true;
        }
      }
      return false;
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
      const cmd = `oc get rolebinding -n ${project} -o jsonpath='{range .items[*]}{.metadata.name}{"\\t"}{.roleRef.name}{"\\t"}{range .subjects[*]}{.name}{" "}{end}{"\\n"}{end}' 2>/dev/null`;
      const result = await executeCommand(cmd);

      // Parse the output line by line
      const lines = result.trim().split("\n");

      for (const line of lines) {
        if (!line) continue;
        const [bindingName, roleName, subjectsStr] = line.split("\t");
        const subjects = subjectsStr
          .trim()
          .split(" ")
          .filter((s) => s);

        console.log(
          `Checking binding: ${bindingName}, Role: ${roleName}, Subjects: ${subjectsStr}`
        );

        if (roleName === "admin" && subjects.includes(username)) {
          console.log(
            `User ${username} has viewer role in ${project} via ${bindingName}`
          );
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error(
        `Error validating viewer role for ${username} in ${project}:`,
        error
      );
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

import { IValidationResult, IValidationService } from '../../interfaces/IValidationService';
import { connectSSH, ssh, executeCommand } from "../../utils/ssh-service";

export class GroupRoleManagementService implements IValidationService {
  private readonly validationSteps = [
    'Verify Group Creation',
    'Check Group Membership',
    'Validate Group Roles',
    'Test Project Access',
    'Check Resource Quotas'
  ];

  async validate(): Promise<IValidationResult> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }

    try {
      const { success, details } = await this.validateAllConfiguration();

      return {
        success,
        details,
        message: success
          ? "Group and role configuration is correct"
          : "Group and role configuration is incomplete or incorrect"
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

  private async validateAllConfiguration(): Promise<{
    success: boolean;
    details: Record<string, boolean>;
  }> {
    const details = {
      groups: await this.validateGroups(),
      memberships: await this.validateGroupMemberships(),
      projectAccess: await this.validateProjectAccess(),
      quotas: await this.validateResourceQuotas(),
      specialPermissions: await this.validateSpecialPermissions()
    };

    const success = Object.values(details).every(result => result === true);
    return { success, details };
  }

  private async validateGroups(): Promise<boolean> {
    const groups = ['development-team', 'operations-team', 'qa-team'];
    for (const group of groups) {
      const result = await executeCommand(`oc get group ${group}`);
      if (!result.includes(group)) return false;
    }
    return true;
  }

  private async validateGroupMemberships(): Promise<boolean> {
    const memberships = {
      'development-team': ['dev1-user', 'dev2-user'],
      'operations-team': ['ops1-user', 'ops2-user'],
      'qa-team': ['qa1-user', 'qa2-user']
    };

    for (const [group, users] of Object.entries(memberships)) {
      const result = await executeCommand(`oc get group ${group} -o yaml`);
      for (const user of users) {
        if (!result.includes(user)) return false;
      }
    }
    return true;
  }

  private async validateProjectAccess(): Promise<boolean> {
    const projectRoles = [
      { project: 'app-development', group: 'development-team', role: 'edit' },
      { project: 'app-production', group: 'operations-team', role: 'admin' },
      { project: 'app-testing', group: 'qa-team', role: 'view' }
    ];

    for (const { project, group, role } of projectRoles) {
      const result = await executeCommand(`oc get rolebinding -n ${project} -o yaml`);
      if (!result.includes(group) || !result.includes(role)) return false;
    }
    return true;
  }

  private async validateResourceQuotas(): Promise<boolean> {
    const quotas = [
      { project: 'app-development', pods: '10', cpu: '4', memory: '8Gi' },
      { project: 'app-production', pods: '20', cpu: '8', memory: '16Gi' },
      { project: 'app-testing', pods: '5', cpu: '2', memory: '4Gi' }
    ];

    for (const { project, pods, cpu, memory } of quotas) {
      const result = await executeCommand(`oc get quota -n ${project} -o yaml`);
      if (!result.includes(`pods: "${pods}"`) ||
          !result.includes(`cpu: "${cpu}"`) ||
          !result.includes(`memory: "${memory}"`)) {
        return false;
      }
    }
    return true;
  }

  private async validateSpecialPermissions(): Promise<boolean> {
    try {
      // Check build strategy permission
      const buildResult = await executeCommand(
        `oc get rolebinding -n app-development -o yaml | grep system:build-strategy-docker`
      );
      if (!buildResult.includes('development-team')) return false;

      // Check cluster reader access
      const readerResult = await executeCommand(
        `oc get clusterrolebinding -o yaml | grep cluster-reader`
      );
      if (!readerResult.includes('operations-team')) return false;

      // Check pod exec permission
      const execResult = await executeCommand(
        `oc get rolebinding -n app-testing -o yaml | grep system:pod-exec`
      );
      if (!execResult.includes('qa-team')) return false;

      return true;
    } catch (error: any) {
      console.warn(error)
      return false;
    }
  }
}

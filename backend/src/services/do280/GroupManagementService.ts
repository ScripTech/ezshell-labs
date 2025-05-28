import { IValidationResult, IValidationService } from "../../interfaces/IValidationService";
import { connectSSH, ssh, executeCommand } from "../../utils/ssh-service";

export class GroupManagementService implements IValidationService {
  private readonly validationSteps = [
    // Group creation steps
    "Group ex280-users Creation",
    "Group ex280-guests Creation",
    // Membership validation steps
    "User qwerty in ex280-guests",
    "User susan in ex280-users",
    "User harry in ex280-users",
    // Permission validation steps
    "ex280-users Edit Permission in ex280-test project",
    "ex280-guests View Permission in ex280-demo project",
  ];

  private readonly groupConfig = {
    "ex280-users": {
      members: ["susan", "harry"],
      project: "ex280-test",
      role: "edit",
    },
    "ex280-guests": {
      members: ["qwerty"],
      project: "ex280-demo",
      role: "view",
    },
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
          details: { error: "OpenShift connection failed" },
        };
      }

      const { success, details } = await this.validateGroupConfiguration();

      return {
        success,
        details,
        message: success
          ? "Group configuration is correct"
          : "Group configuration is incomplete or incorrect",
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Validation failed: ${error.message}`,
        details: { error: error.message },
      };
    }
  }

  getSteps(): string[] {
    return this.validationSteps;
  }

  private async validateGroupConfiguration(): Promise<{
    success: boolean;
    details: Record<string, boolean>;
  }> {
    const details: Record<string, boolean> = {};

    // Validate each group's existence
    for (const groupName of Object.keys(this.groupConfig)) {
      details[`group_${groupName}_exists`] =
        await this.validateGroupExists(groupName);
    }

    // Validate each user's membership
    for (const [groupName, config] of Object.entries(this.groupConfig)) {
      for (const member of config.members) {
        details[`user_${member}_in_${groupName}`] =
          await this.validateUserInGroup(member, groupName);
      }
    }

    // Validate each group's permissions
    for (const [groupName, config] of Object.entries(this.groupConfig)) {
      details[`group_${groupName}_${config.role}_in_${config.project}`] =
        await this.validateGroupPermission(
          groupName,
          config.project,
          config.role
        );
    }

    const success = Object.values(details).every((result) => result === true);
    return { success, details };
  }

  private async validateGroupExists(groupName: string): Promise<boolean> {
    try {
      const result = await executeCommand(`oc get group ${groupName}`);
      const exists = result.includes(groupName);
      if (!exists) {
        console.log(`Group ${groupName} not found`);
      }
      return exists;
    } catch (error) {
      console.error(`Error validating group ${groupName}:`, error);
      return false;
    }
  }

  private async validateUserInGroup(
    username: string,
    groupName: string
  ): Promise<boolean> {
    try {
      const result = await executeCommand(`oc get group ${groupName} -o yaml`);
      const isMember = result.includes(username);
      if (!isMember) {
        console.log(`User ${username} not found in group ${groupName}`);
      }
      return isMember;
    } catch (error) {
      console.error(
        `Error validating user ${username} in group ${groupName}:`,
        error
      );
      return false;
    }
  }

  private async validateGroupPermission(
    groupName: string,
    project: string,
    role: string
  ): Promise<boolean> {
    try {
      const result = await executeCommand(
        `oc get rolebinding -n ${project} -o yaml | grep ${groupName}`
      );
      const hasPermission = result.includes(role);
      if (!hasPermission) {
        console.log(
          `Group ${groupName} does not have ${role} role in ${project}`
        );
      }
      return hasPermission;
    } catch (error) {
      console.error(
        `Error validating ${role} permission for ${groupName} in ${project}:`,
        error
      );
      return false;
    }
  }

  private async verifyOCPConnection(): Promise<boolean> {
    try {
      const ocVersion = await executeCommand("oc version");
      if (!ocVersion || ocVersion.trim() === "") {
        console.error("OpenShift CLI not available");
        return false;
      }

      const clusterInfo = await executeCommand("oc status");
      if (!clusterInfo || clusterInfo.includes("error")) {
        console.error("Failed to get cluster status");
        return false;
      }

      const whoami = await executeCommand("oc whoami");
      if (!whoami || whoami.trim() === "") {
        console.error("Not authenticated to OpenShift cluster");
        return false;
      }

      console.log("OCP Connection verified:", {
        user: whoami.trim(),
        clusterInfo: clusterInfo.split("\n")[0],
      });

      return true;
    } catch (error) {
      console.error("OCP Connection verification failed:", error);
      return false;
    }
  }
}

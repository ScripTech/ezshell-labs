import { dynamicSSHService } from "../../utils/dynamic-ssh-service";

export class YumRepositoryValidationService {
  private userId?: string;
  private labId?: string;

  /**
   * Initialize the service with user and lab context
   */
  async initialize(userId: string, labId: string): Promise<boolean> {
    this.userId = userId;
    this.labId = labId;

    console.log(`🔧 Initializing YumRepositoryValidationService for user ${userId}, lab ${labId}`);
    return await dynamicSSHService.connectToLab(userId, labId);
  }

  async testSSHConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }
    return await dynamicSSHService.testConnection();
  }

  async validateRepoExist(): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand("test -f /etc/yum.repos.d/devops.repo && echo 'exists' || echo 'not found'");
    return result.trim() === 'exists';
  }

  async validateBaseOSRepo(): Promise<boolean> {
    try {
      if (!this.userId || !this.labId) {
        throw new Error('Service not initialized. Call initialize() first.');
      }

      if (!dynamicSSHService.isSSHConnected()) {
        const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
        if (!connected) {
          throw new Error('Failed to connect to lab instance');
        }
      }

      // First check if yum is available
      try {
        await dynamicSSHService.executeCommand("which yum");
      } catch (error) {
        console.log("yum not found, trying dnf instead");
        const result = await dynamicSSHService.executeCommand("dnf repolist | grep -i 'DevOps-BaseOS' || true");
        return result.toLowerCase().includes("DevOps-BaseOS".toLowerCase());
      }

      const result = await dynamicSSHService.executeCommand("yum repolist | grep -i 'DevOps-BaseOS' || true");
      return result.toLowerCase().includes("DevOps-BaseOS".toLowerCase());
    } catch (error) {
      console.error("Error validating BaseOS repo:", error);
      return false;
    }
  }

  async validateAppStreamRepo(): Promise<boolean> {
    try {
      if (!this.userId || !this.labId) {
        throw new Error('Service not initialized. Call initialize() first.');
      }

      if (!dynamicSSHService.isSSHConnected()) {
        const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
        if (!connected) {
          throw new Error('Failed to connect to lab instance');
        }
      }

      // First check if yum is available
      try {
        await dynamicSSHService.executeCommand("which yum");
      } catch (error) {
        console.log("yum not found, trying dnf instead");
        const result = await dynamicSSHService.executeCommand("dnf repolist | grep -i 'DevOps-AppStream' || true");
        return result.toLowerCase().includes("DevOps-AppStream".toLowerCase());
      }

      const result = await dynamicSSHService.executeCommand("yum repolist | grep -i 'DevOps-AppStream' || true");
      return result.toLowerCase().includes("DevOps-AppStream".toLowerCase());
    } catch (error) {
      console.error("Error validating AppStream repo:", error);
      return false;
    }
  }

  async validateRepoURLs(): Promise<boolean> {
    try {
      if (!this.userId || !this.labId) {
        throw new Error('Service not initialized. Call initialize() first.');
      }

      if (!dynamicSSHService.isSSHConnected()) {
        const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
        if (!connected) {
          throw new Error('Failed to connect to lab instance');
        }
      }

      // Check if the repo file exists
      const result = await dynamicSSHService.executeCommand("cat /etc/yum.repos.d/devops.repo 2>/dev/null || echo 'File not found'");

      if (result.includes("File not found")) {
        console.log("devops.repo file not found");
        return false;
      }

      return result.includes("http://content.example.com/rhel8.0/x86_64/dvd/BaseOs") &&
             result.includes("http://content.example.com/rhel8.0/x86_64/dvd/Appstream");
    } catch (error) {
      console.error("Error validating repo URLs:", error);
      return false;
    }
  }

  async validateYumRepository(): Promise<{ success: boolean; message: string }> {
    try {
      const reposValid = await this.validateRepoExist();
      const baseOSValid = await this.validateBaseOSRepo();
      const appStreamValid = await this.validateAppStreamRepo();
      const urlsValid = await this.validateRepoURLs();

      console.log("Validation results:", { baseOSValid, appStreamValid, urlsValid });

      if (reposValid && baseOSValid && appStreamValid && urlsValid) {
        return {
          success: true,
          message: "YUM repositories are configured correctly!",
        };
      } else {
        const issues = [];
        if (!baseOSValid) issues.push("BaseOS repository");
        if (!appStreamValid) issues.push("AppStream repository");
        if (!urlsValid) issues.push("Repository URLs");
        if (!reposValid) issues.push("devops.repo repository file");

        return {
          success: false,
          message: `YUM repository configuration issues found: ${issues.join(", ")}. Please check your settings.`,
        };
      }
    } catch (error) {
      console.error("Error during YUM repository validation:", error);
      return {
        success: false,
        message: `Validation failed due to error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

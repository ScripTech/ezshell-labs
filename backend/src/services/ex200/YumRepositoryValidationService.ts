import {
  connectSSH,
  ssh,
  executeCommand,
  testConnection
} from "../../utils/ssh-service";

export class YumRepositoryValidationService {
  async testSSHConnection(): Promise<{ success: boolean; message: string }> {
    return await testConnection();
  }

  async validateBaseOSRepo(): Promise<boolean> {
    try {
      if (!ssh.isConnected()) {
        await connectSSH();
      }

      // First check if yum is available
      try {
        await executeCommand("which yum");
      } catch (error) {
        console.log("yum not found, trying dnf instead");
        const result = await executeCommand("dnf repolist | grep -i 'baseos' || true");
        return result.toLowerCase().includes("baseos");
      }

      const result = await executeCommand("yum repolist | grep -i 'baseos' || true");
      return result.toLowerCase().includes("baseos");
    } catch (error) {
      console.error("Error validating BaseOS repo:", error);
      return false;
    }
  }

  async validateAppStreamRepo(): Promise<boolean> {
    try {
      if (!ssh.isConnected()) {
        await connectSSH();
      }

      // First check if yum is available
      try {
        await executeCommand("which yum");
      } catch (error) {
        console.log("yum not found, trying dnf instead");
        const result = await executeCommand("dnf repolist | grep -i 'appstream' || true");
        return result.toLowerCase().includes("appstream");
      }

      const result = await executeCommand("yum repolist | grep -i 'appstream' || true");
      return result.toLowerCase().includes("appstream");
    } catch (error) {
      console.error("Error validating AppStream repo:", error);
      return false;
    }
  }

  async validateRepoURLs(): Promise<boolean> {
    try {
      if (!ssh.isConnected()) {
        await connectSSH();
      }

      // Check if the repo file exists
      const result = await executeCommand("cat /etc/yum.repos.d/devops.repo 2>/dev/null || echo 'File not found'");

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
      const baseOSValid = await this.validateBaseOSRepo();
      const appStreamValid = await this.validateAppStreamRepo();
      const urlsValid = await this.validateRepoURLs();

      console.log("Validation results:", { baseOSValid, appStreamValid, urlsValid });

      if (baseOSValid && appStreamValid && urlsValid) {
        return { success: true, message: "YUM repositories are configured correctly!" };
      } else {
        const issues = [];
        if (!baseOSValid) issues.push("BaseOS repository");
        if (!appStreamValid) issues.push("AppStream repository");
        if (!urlsValid) issues.push("Repository URLs");

        return {
          success: false,
          message: `YUM repository configuration issues found: ${issues.join(", ")}. Please check your settings.`
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

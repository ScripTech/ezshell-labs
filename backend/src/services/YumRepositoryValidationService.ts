import {
  connectSSH,
  ssh,
  executeCommand
} from "../utils/ssh-service";

export class YumRepositoryValidationService {
  async validateBaseOSRepo(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand("yum repolist | grep 'BaseOS'");
    return result.includes("BaseOS");
  }

  async validateAppStreamRepo(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand("yum repolist | grep 'AppStream'");
    return result.includes("AppStream");
  }

  async validateRepoURLs(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand("cat /etc/yum.repos.d/*.repo");
    return result.includes("http://content.example.com/rhel8.0/x86_64/dvd/BaseOs") &&
           result.includes("http://content.example.com/rhel8.0/x86_64/dvd/Appstream");
  }

  async validateYumRepository(): Promise<{ success: boolean; message: string }> {
    const baseOSValid = await this.validateBaseOSRepo();
    const appStreamValid = await this.validateAppStreamRepo();
    const urlsValid = await this.validateRepoURLs();

    if (baseOSValid && appStreamValid && urlsValid) {
      return { success: true, message: "YUM repositories are configured correctly!" };
    } else {
      return { success: false, message: "YUM repository configuration is incorrect. Please check your settings." };
    }
  }
}

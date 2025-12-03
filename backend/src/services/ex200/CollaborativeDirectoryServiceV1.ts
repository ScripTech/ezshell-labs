import { dynamicSSHService } from "../../utils/dynamic-ssh-service";

export class CollaborativeDirectoryServiceV1 {
  private userId?: string;
  private labId?: string;

  constructor() {}

  /**
   * Initialize the service with user and lab context
   */
  async initialize(userId: string, labId: string): Promise<boolean> {
    this.userId = userId;
    this.labId = labId;

    console.log(`🔧 Initializing CollaborativeDirectoryServiceV1 for user ${userId}, lab ${labId}`);
    return await dynamicSSHService.connectToLab(userId, labId);
  }

  async validateDir(path: string): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand(`ls -ld ${path}`);
    return !result.includes("No such file or directory");
  }

  async validateGroupOwnership(path: string, group: string): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand(`ls -ld ${path} | grep ${group}`);
    return (
      !result.includes("No such file or directory") &&
      result.includes(`${group}`)
    );
  }

  async validateDirPermission(path: string, group: string): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand(`sudo ls -ld ${path} | grep ${group}`);
    return (
      !result.includes("Permission denied") &&
      result.includes(`${group}`) &&
      result.includes(`drwxrws--`)
    );
  }
}

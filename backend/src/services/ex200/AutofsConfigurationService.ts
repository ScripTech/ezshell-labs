import { dynamicSSHService } from "../../utils/dynamic-ssh-service";

export class AutofsConfigurationService {
  private userId?: string;
  private labId?: string;

  constructor() {}

  /**
   * Initialize the service with user and lab context
   */
  async initialize(userId: string, labId: string): Promise<boolean> {
    this.userId = userId;
    this.labId = labId;

    console.log(`🔧 Initializing AutofsConfigurationService for user ${userId}, lab ${labId}`);
    return await dynamicSSHService.connectToLab(userId, labId);
  }

  async validateNFSDir(user: string): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    let pathFile = "/etc/auto.master"
    let valContent = "/netdir\t/etc/auto.misc";
    const result = await dynamicSSHService.executeCommand(`grep ${valContent} ${pathFile}`)
    return result.includes(`${valContent}`);
  }

  async validateNFSexports(user: string): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand(
      "grep 'nfsuser' /etc/auto.misc"
    );
    return result.includes(
      "ezetsu.nfslab.com:/home/guests/nfsuser"
    );
  }

  // Home directories is writable
  async validateHomeWritable(user: string): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand("grep 'nfsuser' /etc/auto.misc");
    return result.includes(
      "nfsuser\t\t-fstype=nfs,rw"
    );
  }
}

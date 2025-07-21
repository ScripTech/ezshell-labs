import { dynamicSSHService } from "../../utils/dynamic-ssh-service";

export class LVMConfigurationService {
  private userId?: string;
  private labId?: string;

  /**
   * Initialize the service with user and lab context
   */
  async initialize(userId: string, labId: string): Promise<boolean> {
    this.userId = userId;
    this.labId = labId;

    console.log(`🔧 Initializing LVMConfigurationService for user ${userId}, lab ${labId}`);
    return await dynamicSSHService.connectToLab(userId, labId);
  }

  /**
   * Check if LVM tools are installed and available
   */
  async checkLVMInstallation(): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand('which lvm');
    return !result.includes("which: no lvm") && !result.includes("command not found");
  }

  /**
   * Check for physical volumes configuration
   */
  async checkPhysicalVolumes(): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand('pvs --noheadings 2>/dev/null | wc -l');
    if (result.includes("command not found")) {
      return false;
    }

    const count = parseInt(result.trim()) || 0;
    return count > 0;
  }

  /**
   * Check for volume groups configuration
   */
  async checkVolumeGroups(): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand('vgs --noheadings 2>/dev/null | wc -l');
    if (result.includes("command not found")) {
      return false;
    }

    const count = parseInt(result.trim()) || 0;
    return count > 0;
  }

  /**
   * Check for logical volumes configuration
   */
  async checkLogicalVolumes(): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand('lvs --noheadings 2>/dev/null | wc -l');
    if (result.includes("command not found")) {
      return false;
    }

    const count = parseInt(result.trim()) || 0;
    return count > 0;
  }

  /**
   * Validate specific volume group exists
   */
  async validateVolumeGroup(vgName: string): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand(`vgs ${vgName} 2>/dev/null`);
    return result.includes(vgName) && !result.includes("not found");
  }

  /**
   * Validate specific logical volume exists
   */
  async validateLogicalVolume(lvPath: string): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand(`lvs ${lvPath} 2>/dev/null`);
    return !result.includes("not found") && !result.includes("Failed to find");
  }

  /**
   * Check if logical volume is mounted
   */
  async checkLVMountStatus(lvPath: string, mountPoint?: string): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    if (mountPoint) {
      const result = await dynamicSSHService.executeCommand(`mount | grep "${mountPoint}"`);
      return result.includes(lvPath) || result.includes(mountPoint);
    } else {
      const result = await dynamicSSHService.executeCommand(`mount | grep "${lvPath}"`);
      return result.includes(lvPath);
    }
  }

  /**
   * Validate filesystem on logical volume
   */
  async validateLVFilesystem(lvPath: string, expectedFS: string = 'ext4'): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand(`blkid ${lvPath} 2>/dev/null`);
    return result.includes(`TYPE="${expectedFS}"`);
  }
}

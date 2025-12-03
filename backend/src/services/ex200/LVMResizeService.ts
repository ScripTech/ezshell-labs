import { dynamicSSHService } from "../../utils/dynamic-ssh-service";

export class LVMResizeService {
  private userId?: string;
  private labId?: string;

  /**
   * Initialize the service with user and lab context
   */
  async initialize(userId: string, labId: string): Promise<boolean> {
    this.userId = userId;
    this.labId = labId;

    console.log(`🔧 Initializing LVMResizeService for user ${userId}, lab ${labId}`);
    return await dynamicSSHService.connectToLab(userId, labId);
  }

  /**
   * Get logical volume size in MB and GB
   */
  async getLVSize(lvPath: string): Promise<{ sizeBytes: number; sizeGB: number }> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    const result = await dynamicSSHService.executeCommand(`lvs --noheadings --units b --nosuffix -o lv_size ${lvPath} 2>/dev/null`);
    if (!result || result.includes("not found")) {
      throw new Error(`Logical volume ${lvPath} not found`);
    }

    const sizeBytes = parseInt(result.trim());
    if (isNaN(sizeBytes)) {
      throw new Error(`Could not parse LV size for ${lvPath}`);
    }

    return {
      sizeBytes,
      sizeGB: Math.round((sizeBytes / (1024 * 1024 * 1024)) * 100) / 100
    };
  }

  /**
   * Get volume group free space
   */
  async getVGFreeSpace(vgName: string): Promise<{ freeBytes: number; freeGB: number }> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    const result = await dynamicSSHService.executeCommand(`vgs --noheadings --units b --nosuffix -o vg_free ${vgName} 2>/dev/null`);
    if (!result || result.includes("not found")) {
      throw new Error(`Volume group ${vgName} not found`);
    }

    const freeBytes = parseInt(result.trim());
    if (isNaN(freeBytes)) {
      throw new Error(`Could not parse VG free space for ${vgName}`);
    }

    return {
      freeBytes,
      freeGB: Math.round((freeBytes / (1024 * 1024 * 1024)) * 100) / 100
    };
  }

  /**
   * Check if extension is possible
   */
  async validateExtensionPossible(lvPath: string, extensionGB: number): Promise<boolean> {
    const vgName = lvPath.split('/')[2] || lvPath.split('-')[0];
    const freeSpace = await this.getVGFreeSpace(vgName);

    return freeSpace.freeGB >= extensionGB;
  }

  /**
   * Validate logical volume extension
   */
  async validateLVExtension(lvPath: string, expectedSizeGB: number, tolerance: number = 0.1): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    const currentSize = await this.getLVSize(lvPath);
    return Math.abs(currentSize.sizeGB - expectedSizeGB) <= tolerance;
  }

  /**
   * Validate filesystem resize
   */
  async validateFilesystemResize(mountPoint: string, expectedSizeGB?: number): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    const result = await dynamicSSHService.executeCommand(`df -BG ${mountPoint} | tail -1`);
    if (!result) {
      return false;
    }

    const parts = result.trim().split(/\s+/);
    if (parts.length < 2) {
      return false;
    }

    if (expectedSizeGB) {
      const currentSizeGB = parseInt(parts[1].replace('G', ''));
      const tolerance = expectedSizeGB * 0.05; // 5% tolerance
      return Math.abs(currentSizeGB - expectedSizeGB) <= tolerance;
    }

    return result.trim().length > 0;
  }

  /**
   * Validate logical volume reduction (if applicable)
   */
  async validateLVReduction(lvPath: string, expectedSizeGB: number, tolerance: number = 0.1): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    const currentSize = await this.getLVSize(lvPath);
    return Math.abs(currentSize.sizeGB - expectedSizeGB) <= tolerance;
  }

  /**
   * Check if unmounting was done properly before resize (for reduction)
   */
  async validateUnmountedBeforeResize(mountPoint: string): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      const result = await dynamicSSHService.executeCommand(`mount | grep ${mountPoint}`);
      // If mount point is not found in mount output, it's unmounted
      return !result || result.trim().length === 0;
    } catch (error) {
      console.error(`Error checking mount status for ${mountPoint}:`, error);
      return false;
    }
  }

  /**
   * Validate fsck was performed before reduction
   */
  async validateFsckPerformed(lvPath: string): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      // Check last fsck time in filesystem superblock
      const result = await dynamicSSHService.executeCommand(`tune2fs -l ${lvPath} 2>/dev/null | grep "Last checked"`);
      if (result && result.includes("Last checked")) {
        const lastChecked = new Date(result.split("Last checked:")[1].trim());
        const now = new Date();
        const timeDiff = now.getTime() - lastChecked.getTime();
        const hoursDiff = timeDiff / (1000 * 3600);

        // Check if fsck was run within the last 24 hours
        return hoursDiff <= 24;
      }
      return false;
    } catch (error) {
      console.error(`Error checking fsck status for ${lvPath}:`, error);
      return false;
    }
  }

  /**
   * Get physical volume information
   */
  async getPVInfo(pvPath: string): Promise<{ total: number; used: number; free: number }> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      const result = await dynamicSSHService.executeCommand(`pvs --noheadings --units g --nosuffix -o pv_size,pv_used,pv_free ${pvPath} 2>/dev/null`);
      if (!result) {
        throw new Error(`Physical volume ${pvPath} not found`);
      }

      const parts = result.trim().split(/\s+/);
      if (parts.length < 3) {
        throw new Error(`Invalid PV info format for ${pvPath}`);
      }

      return {
        total: parseFloat(parts[0]) || 0,
        used: parseFloat(parts[1]) || 0,
        free: parseFloat(parts[2]) || 0
      };
    } catch (error) {
      console.error(`Error getting PV info for ${pvPath}:`, error);
      return { total: 0, used: 0, free: 0 };
    }
  }

  /**
   * Validate backup exists before resize
   */
  async validateBackupExists(backupPath: string): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      const result = await dynamicSSHService.executeCommand(`test -f "${backupPath}" && echo "exists"`);
      return result.includes("exists");
    } catch (error) {
      console.error(`Error checking backup at ${backupPath}:`, error);
      return false;
    }
  }

  /**
   * Check if any logical volumes exist (helper method)
   */
  async checkAnyLVExists(): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      const result = await dynamicSSHService.executeCommand('lvs --noheadings 2>/dev/null | wc -l');
      const count = parseInt(result.trim());
      return count > 0;
    } catch (error) {
      console.error("Error checking for logical volumes:", error);
      return false;
    }
  }

  /**
   * Validate if logical volume exists
   */
  async validateLVExists(lvPath: string): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      const result = await dynamicSSHService.executeCommand(`lvs ${lvPath} 2>/dev/null && echo "exists"`);
      return result.includes("exists");
    } catch (error) {
      console.error(`Error checking LV ${lvPath}:`, error);
      return false;
    }
  }

  /**
   * Get size of first logical volume (helper method)
   */
  async getFirstLVSize(): Promise<number> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      const result = await dynamicSSHService.executeCommand('lvs --noheadings --units m --nosuffix -o lv_size | head -1');
      const size = parseFloat(result.trim()) || 0;
      return Math.round(size);
    } catch (error) {
      console.error("Error getting first LV size:", error);
      return 0;
    }
  }

  /**
   * Get free space of first volume group (helper method)
   */
  async getFirstVGFreeSpace(): Promise<number> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      const result = await dynamicSSHService.executeCommand('vgs --noheadings --units m --nosuffix -o vg_free | head -1');
      const freeSpace = parseFloat(result.trim()) || 0;
      return Math.round(freeSpace);
    } catch (error) {
      console.error("Error getting first VG free space:", error);
      return 0;
    }
  }
}

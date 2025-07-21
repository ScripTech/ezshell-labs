import { dynamicSSHService } from "../../utils/dynamic-ssh-service";

export class SwapConfigurationService {
  private userId?: string;
  private labId?: string;

  /**
   * Initialize the service with user and lab context
   */
  async initialize(userId: string, labId: string): Promise<boolean> {
    this.userId = userId;
    this.labId = labId;

    console.log(`🔧 Initializing SwapConfigurationService for user ${userId}, lab ${labId}`);
    return await dynamicSSHService.connectToLab(userId, labId);
  }

  /**
   * Check current swap status and usage
   */
  async checkSwapStatus(): Promise<{ active: boolean; total: number; used: number }> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand('free -m | grep Swap');
    if (result.includes("Swap:")) {
      const parts = result.trim().split(/\s+/);
      const total = parseInt(parts[1]) || 0;
      const used = parseInt(parts[2]) || 0;
      return {
        active: total > 0,
        total,
        used
      };
    }

    return { active: false, total: 0, used: 0 };
  }

  /**
   * Validate swap file exists and has correct size
   */
  async validateSwapFile(swapPath: string, expectedSizeMB?: number): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    // Check if swap file exists
    const existsResult = await dynamicSSHService.executeCommand(`test -f ${swapPath}`);
    if (existsResult.includes("No such file")) {
      return false;
    }

    // If expected size is provided, validate it
    if (expectedSizeMB) {
      const sizeResult = await dynamicSSHService.executeCommand(`ls -la ${swapPath} | awk '{print $5}'`);
      const sizeBytes = parseInt(sizeResult.trim()) || 0;
      const sizeMB = Math.round(sizeBytes / (1024 * 1024));

      // Allow 5% tolerance for size validation
      const tolerance = expectedSizeMB * 0.05;
      return Math.abs(sizeMB - expectedSizeMB) <= tolerance;
    }

    return true;
  }

  /**
   * Check if swap file/partition is properly formatted
   */
  async validateSwapFormat(swapPath: string): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand(`file ${swapPath} 2>/dev/null`);
    return result.includes("swap file") || result.includes("swap space");
  }

  /**
   * Check if swap is enabled/active
   */
  async validateSwapActive(swapPath?: string): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand('swapon --show');

    if (swapPath) {
      return result.includes(swapPath);
    }

    // Check if any swap is active
    return result.trim().length > 0 && !result.includes("No swap");
  }

  /**
   * Validate swap entry in /etc/fstab
   */
  async validateSwapFstab(swapPath: string): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand(`grep "${swapPath}" /etc/fstab 2>/dev/null`);
    return result.includes(swapPath) && result.includes("swap");
  }

  /**
   * Check swap priorities if multiple swap areas exist
   */
  async validateSwapPriority(swapPath: string, expectedPriority?: number): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand(`swapon --show=NAME,PRIO | grep "${swapPath}"`);

    if (!result.includes(swapPath)) {
      return false;
    }

    if (expectedPriority !== undefined) {
      const parts = result.trim().split(/\s+/);
      const priority = parseInt(parts[1]) || -1;
      return priority === expectedPriority;
    }

    return true;
  }

  /**
   * Validate swap performance/usage patterns
   */
  async validateSwapUsage(): Promise<{ swappiness: number; usage: number }> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    // Get swappiness value
    const swappinessResult = await dynamicSSHService.executeCommand('cat /proc/sys/vm/swappiness 2>/dev/null');
    const swappiness = parseInt(swappinessResult.trim()) || 60;

    // Get current swap usage
    const usageResult = await dynamicSSHService.executeCommand('free | grep Swap | awk \'{print ($3/$2)*100}\'');
    const usage = parseFloat(usageResult.trim()) || 0;

    return { swappiness, usage };
  }
}

import { dynamicSSHService } from "../../utils/dynamic-ssh-service";

export class VDOConfigurationService {
  private userId?: string;
  private labId?: string;

  /**
   * Initialize the service with user and lab context
   */
  async initialize(userId: string, labId: string): Promise<boolean> {
    this.userId = userId;
    this.labId = labId;

    console.log(`🔧 Initializing VDOConfigurationService for user ${userId}, lab ${labId}`);
    return await dynamicSSHService.connectToLab(userId, labId);
  }

  /**
   * Check if VDO tools are installed and available
   */
  async checkVDOInstallation(): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand('which vdo');
    return !result.includes("which: no vdo") && !result.includes("command not found");
  }

  /**
   * Check VDO service status
   */
  async checkVDOServiceStatus(): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand('systemctl is-active vdo 2>/dev/null');
    return result.trim() === 'active';
  }

  /**
   * Check for VDO volumes configuration
   */
  async checkVDOVolumes(): Promise<{ count: number; volumes: string[] }> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand('vdo list 2>/dev/null');

    if (result.includes("No VDO volumes") || result.includes("command not found")) {
      return { count: 0, volumes: [] };
    }

    const volumes = result.trim().split('\n').filter(line => line.trim() !== '');
    return { count: volumes.length, volumes };
  }

  /**
   * Validate specific VDO volume exists and is configured
   */
  async validateVDOVolume(volumeName: string): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand(`vdo status --name=${volumeName} 2>/dev/null`);
    return result.includes(volumeName) && !result.includes("not found");
  }

  /**
   * Check VDO compression status
   */
  async checkVDOCompression(volumeName?: string): Promise<{ enabled: boolean; savings?: number }> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const command = volumeName
      ? `vdo status --name=${volumeName} 2>/dev/null | grep -i compression`
      : 'vdo status 2>/dev/null | grep -i compression';

    const result = await dynamicSSHService.executeCommand(command);
    const enabled = result.includes("enabled") || result.includes("on");

    // Try to get compression savings if available
    if (enabled && volumeName) {
      const savingsResult = await dynamicSSHService.executeCommand(`vdostats --human-readable ${volumeName} 2>/dev/null | grep "savings"`);
      const savingsMatch = savingsResult.match(/(\d+\.?\d*)%/);
      const savings = savingsMatch ? parseFloat(savingsMatch[1]) : undefined;
      return { enabled, savings };
    }

    return { enabled };
  }

  /**
   * Check VDO deduplication status
   */
  async checkVDODeduplication(volumeName?: string): Promise<{ enabled: boolean; savings?: number }> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const command = volumeName
      ? `vdo status --name=${volumeName} 2>/dev/null | grep -i deduplication`
      : 'vdo status 2>/dev/null | grep -i deduplication';

    const result = await dynamicSSHService.executeCommand(command);
    const enabled = result.includes("enabled") || result.includes("on");

    // Try to get deduplication savings if available
    if (enabled && volumeName) {
      const savingsResult = await dynamicSSHService.executeCommand(`vdostats --human-readable ${volumeName} 2>/dev/null | grep "deduplication"`);
      const savingsMatch = savingsResult.match(/(\d+\.?\d*)%/);
      const savings = savingsMatch ? parseFloat(savingsMatch[1]) : undefined;
      return { enabled, savings };
    }

    return { enabled };
  }

  /**
   * Get VDO volume statistics
   */
  async getVDOStats(volumeName: string): Promise<{
    physicalSize: string;
    logicalSize: string;
    dataEfficiency: string;
    compression: string;
    deduplication: string;
  }> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand(`vdostats --human-readable ${volumeName} 2>/dev/null`);

    if (result.includes("not found")) {
      return {
        physicalSize: "unknown",
        logicalSize: "unknown",
        dataEfficiency: "unknown",
        compression: "unknown",
        deduplication: "unknown"
      };
    }

    // Parse the output for key metrics
    const physicalMatch = result.match(/physical blocks used\s*:\s*([^\n]+)/i);
    const logicalMatch = result.match(/logical blocks used\s*:\s*([^\n]+)/i);
    const efficiencyMatch = result.match(/data efficiency\s*:\s*([^\n]+)/i);
    const compressionMatch = result.match(/compression\s*:\s*([^\n]+)/i);
    const deduplicationMatch = result.match(/deduplication\s*:\s*([^\n]+)/i);

    return {
      physicalSize: physicalMatch?.[1]?.trim() || "unknown",
      logicalSize: logicalMatch?.[1]?.trim() || "unknown",
      dataEfficiency: efficiencyMatch?.[1]?.trim() || "unknown",
      compression: compressionMatch?.[1]?.trim() || "unknown",
      deduplication: deduplicationMatch?.[1]?.trim() || "unknown"
    };
  }

  /**
   * Validate VDO filesystem is mounted
   */
  async validateVDOMounted(volumeName: string, mountPoint?: string): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const devicePath = `/dev/mapper/${volumeName}`;

    if (mountPoint) {
      const result = await dynamicSSHService.executeCommand(`mount | grep "${mountPoint}"`);
      return result.includes(devicePath) || result.includes(mountPoint);
    } else {
      const result = await dynamicSSHService.executeCommand(`mount | grep "${devicePath}"`);
      return result.includes(devicePath);
    }
  }

  /**
   * Check VDO volume health and status
   */
  async validateVDOHealth(volumeName: string): Promise<{ healthy: boolean; status: string; errors: string[] }> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand(`vdo status --name=${volumeName} 2>/dev/null`);

    if (result.includes("not found")) {
      return { healthy: false, status: "not found", errors: ["Volume not found"] };
    }

    // Look for common status indicators
    const healthy = result.includes("online") && !result.includes("error") && !result.includes("failed");
    const statusMatch = result.match(/VDO status\s*:\s*([^\n]+)/i);
    const status = statusMatch?.[1]?.trim() || "unknown";

    // Extract any error messages
    const errors: string[] = [];
    if (result.includes("error")) {
      const errorLines = result.split('\n').filter(line => line.toLowerCase().includes('error'));
      errors.push(...errorLines);
    }

    return { healthy, status, errors };
  }

  /**
   * Validate VDO persistent configuration
   */
  async validateVDOPersistent(volumeName: string): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    // Check if VDO volume is configured to start at boot
    const result = await dynamicSSHService.executeCommand(`systemctl is-enabled vdo 2>/dev/null`);
    return result.trim() === 'enabled';
  }
}

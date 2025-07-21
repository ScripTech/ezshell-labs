import { dynamicSSHService } from "../../utils/dynamic-ssh-service";

export class NetworkConfigValidationService {
  private userId?: string;
  private labId?: string;

  /**
   * Initialize the service with user and lab context
   */
  async initialize(userId: string, labId: string): Promise<boolean> {
    this.userId = userId;
    this.labId = labId;

    console.log(`🔧 Initializing NetworkConfigValidationService for user ${userId}, lab ${labId}`);
    return await dynamicSSHService.connectToLab(userId, labId);
  }

  async validateIPAddress(): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand("ip addr show | grep 'inet 192.168.'");
    return result.includes("192.168.251.128/24");
  }

  async validateNetmask(): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand("ip addr show | grep 'inet 192.168.'");
    return result.includes("/24");
  }

  async validateGateway(): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand("ip route | grep default");
    return result.includes("192.168.251.128");
  }

  async validateDNS(): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand("cat /etc/resolv.conf");
    return result.includes("nameserver 192.168.251.2");
  }

  async validateHostname(): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand("hostname");
    return result.trim() === "ezetsu.lab.local";
  }

  async validateNetworkConfig(): Promise<{ success: boolean; message: string }> {
    const ipValid = await this.validateIPAddress();
    const netmaskValid = await this.validateNetmask();
    const gatewayValid = await this.validateGateway();
    const dnsValid = await this.validateDNS();
    const hostnameValid = await this.validateHostname();

    if (ipValid && netmaskValid && gatewayValid && dnsValid && hostnameValid) {
      return { success: true, message: "Network configuration is correct!" };
    } else {
      return { success: false, message: "Network configuration is incorrect. Please check all settings." };
    }
  }
}

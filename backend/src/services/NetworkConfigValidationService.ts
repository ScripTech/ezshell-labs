import {
  connectSSH,
  ssh,
  executeCommand
} from "../utils/ssh-service";

export class NetworkConfigValidationService {
  async validateIPAddress(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand("ip addr show | grep 'inet 172.25.'");
    return result.includes("172.25.X.11/24");
  }

  async validateNetmask(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand("ip addr show | grep 'inet 172.25.'");
    return result.includes("/24");
  }

  async validateGateway(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand("ip route | grep default");
    return result.includes("172.25.X.254");
  }

  async validateDNS(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand("cat /etc/resolv.conf");
    return result.includes("nameserver 172.25.254.254");
  }

  async validateHostname(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand("hostname");
    return result.trim() === "openssh-server";
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

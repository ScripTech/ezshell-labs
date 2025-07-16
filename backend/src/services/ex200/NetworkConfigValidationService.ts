import {
  connectSSH,
  ssh,
  executeCommand
} from "../../utils/ssh-service";

export class NetworkConfigValidationService {
  async validateIPAddress(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand("ip addr show | grep 'inet 192.168.'");
    return result.includes("192.168.251.128/24");
  }

  async validateNetmask(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand("ip addr show | grep 'inet 192.168.'");
    return result.includes("/24");
  }

  async validateGateway(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand("ip route | grep default");
    return result.includes("192.168.251.128");
  }

  async validateDNS(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand("cat /etc/resolv.conf");
    return result.includes("nameserver 192.168.251.2");
  }

  async validateHostname(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand("hostname");
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

import { connectSSH, ssh, executeCommand } from "../../utils/ssh-service";

export class SELinuxManagementService {
  async validateService(service: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand(`systemctl status ${service}`);
    return result.includes("httpd") && result.includes("active (running)");
  }

  async validateSemanagePort(port: number): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand("semanage port -l | grep http");
    return result.includes(`${port}`);
  }

  async validateByCurlTheService(port: number): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await ssh.execCommand(`curl http://localhost:${port}`);
    if (result.stderr.includes("Connection refused")) return false;
    return true;
  }
}

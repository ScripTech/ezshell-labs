import { connectSSH, ssh, executeCommand } from "../utils/ssh-service";

export class SELinuxManagementService {

  async validateService(service: string): Promise<boolean>{
    if(!ssh.isConnected()){
      await connectSSH();
    }
    const result = await executeCommand(`systemctl status | grep ${service}`);
    return result.includes("httpd") && result.includes("Active:");
  }

  async validateSemanagePort(port: number): Promise<boolean>{
     if (!ssh.isConnected()) {
       await connectSSH();
     }
     const result = await executeCommand("semanage port -l | grep http");
     return result.includes(`${port}`);
  }

  async validateByCurlTheService(port: number): Promise<boolean>{
     if (!ssh.isConnected()) {
       await connectSSH();
     }
     const result = await executeCommand(`curl http://localhost:${port}`);
     return !result.includes(`Connection refused`);
  }
}

import { connectSSH, ssh, executeCommand } from "../utils/ssh-service";

export class BasicValidationService {
  async tarValidation(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    try {
      const result = await ssh.execCommand(`test -f /root/myetcbackup.tar.bz2`);
      console.log(result);
      return result.code === 0;
    } catch (error) {
      console.error("Command exec error:", error);
      return false;
    }
  }
  async filePermissionsValidation(): Promise<boolean> {
    return false;
  }

  async filePermissionsValidation_OwnedBy(user: string): Promise<boolean> {
     if (!ssh.isConnected()) {
       await connectSSH();
     }
    try {
      const result = await executeCommand("ls -l /var/tmp | grep fstab");
      return result.includes("root root");
    } catch (error) {
      console.error("Command exec error:", error);
      return false;
    }
  }
  async filePermissionsValidation_BelongsTO(group: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    try {
      const result = await executeCommand("ls -l /var/tmp | grep fstab");
      return result.includes("root root");
    } catch (error) {
      console.error("Command exec error:", error);
      return false;
    }
  }
  async filePermissionsValidation_NotExec(): Promise<boolean> {
    return false;
  }
  async filePermissionsValidation_UserCanRead(user: string): Promise<boolean> {
    return false;
  }

  async timeSynchronizationValidation(): Promise<boolean> {
    return false;
  }
  async stringSearchValidation(): Promise<boolean> {
    return false;
  }
  async tunedProfileValidation(): Promise<boolean> {
    return false;
  }
}

import { connectSSH, ssh, executeCommand } from "../../utils/ssh-service";

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
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    try {
      const result = await executeCommand("ls -l /var/tmp/fstab");
      // Check if file is not executable (no x in permissions)
      return !result.includes("x");
    } catch (error) {
      console.error("Command exec error:", error);
      return false;
    }
  }
  async filePermissionsValidation_UserCanRead(user: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    try {
      // Check if user 'natasha' has ACL read/write permissions
      const aclResult = await executeCommand("getfacl /var/tmp/fstab");
      return aclResult.includes(`user:${user}:rw-`);
    } catch (error) {
      console.error("Command exec error:", error);
      return false;
    }
  }

  async timeSynchronizationValidation(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    try {
      // Check if chronyd service is active
      const serviceResult = await executeCommand("systemctl is-active chronyd");
      if (!serviceResult.trim().includes("active")) {
        return false;
      }

      // Check if configured with classroom.example.com
      const configResult = await executeCommand("grep -i 'classroom.example.com' /etc/chrony.conf || chrony sources 2>/dev/null | grep -i classroom || echo 'not found'");
      return !configResult.includes("not found");
    } catch (error) {
      console.error("Command exec error:", error);
      return false;
    }
  }
  async stringSearchValidation(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    try {
      // Check if /root/lines file exists and contains lines with "ich"
      const fileCheck = await executeCommand("test -f /root/lines && echo 'exists' || echo 'not found'");
      if (fileCheck.includes("not found")) {
        return false;
      }

      // Check if the file contains lines with "ich" from dictionary
      const linesResult = await executeCommand("cat /root/lines | head -10");
      const dictCheck = await executeCommand("grep 'ich' /usr/share/dict/words | head -5");

      // Simple validation: check if file has content and dict has "ich" words
      return linesResult.includes("ich") && dictCheck.includes("ich");
    } catch (error) {
      console.error("Command exec error:", error);
      return false;
    }
  }
  async tunedProfileValidation(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    try {
      // Check if tuned service is active
      const serviceResult = await executeCommand("systemctl is-active tuned");
      if (!serviceResult.trim().includes("active")) {
        return false;
      }

      // Check if a profile is active (should be recommended)
      const profileResult = await executeCommand("tuned-adm active");
      return profileResult.includes("recommended") || profileResult.includes("Current active profile:");
    } catch (error) {
      console.error("Command exec error:", error);
      return false;
    }
  }
}

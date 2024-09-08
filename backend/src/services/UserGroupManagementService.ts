import {
  connectSSH,
  ssh,
  executeCommand
} from "../utils/ssh-service";


export class UserGroupManagementService {
  async validateGroup(group: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand(`getent group | grep ${group}`);
    return result.includes(`${group}`);
  }

  async validateUser(username: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand(`getent passwd | grep ${username}`);
    return result.includes(`${username}`);
  }

  async validateUserGroup(username: string, group: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand(`id ${username} | grep ${group}`);
    return result.includes(`${username}`) && result.includes(`${group}`);
  }

  async validateNoInteractiveShell(username: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand(`getent passwd | grep ${username}`);
    return result.includes("/sbin/nologin");
  }
}

import { connectSSH, ssh, executeCommand } from "../utils/ssh-service";

export class CollaborativeDirectoryServiceV1 {
  constructor() {}

  async validateDir(path: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await ssh.execCommand(`ls -ld ${path}`);
    return result.code === 0;
  }

  async validateGroupOwnership(path: string, group: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand(`ls -ld ${path} | grep ${group}`);
    return (
      !result.includes("No such file or directory") &&
      result.includes(`${group}`)
    );
  }

  async validateDirPermission(path: string, group: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand(`l -l ${path} | grep ${group}`);
    return (
      !result.includes("No such file or directory") &&
      result.includes(`${group}`) &&
      result.includes(`rwxrwx---`)
    );
  }
}

import { connectSSH, ssh, executeCommand } from "../utils/ssh-service";

export class AutofsConfigurationService {
  constructor() {}

  async validateNFSDir(user: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    let pathFile = "/etc/auto.master"
    let valContent = "/netdir\t/etc/auto.misc";
    const result = await executeCommand(`grep ${valContent} ${pathFile}`)
    return result.includes(`${valContent}`);
  }

  async validateNFSexports(user: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand(
      "grep 'nfsuser' /etc/auto.misc"
    );
    return result.includes(
      "ezetsu.nfslab.com:/home/guests/nfsuser"
    );
  }
  // Home directories is writable
  async validateHomeWritable(user: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand("grep 'nfsuser' /etc/auto.misc");
    return result.includes(
      "nfsuser\t\t-fstype=nfs,rw"
    );
  }
}

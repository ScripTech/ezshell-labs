import { connectSSH, ssh, executeCommand } from "../../utils/ssh-service";

export class CronJobService {
  constructor() {}

  async validateUserCronJob(user: string, cronjob: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    const result = await executeCommand(`crontab -u ${user} -l`);
      return (
      result.includes(`*/1\t*\t*\t*\t*\tlogger "EX200 Testing"`)
    );
  }
}

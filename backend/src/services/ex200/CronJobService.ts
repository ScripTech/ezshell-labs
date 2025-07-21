import { dynamicSSHService } from "../../utils/dynamic-ssh-service";

export class CronJobService {
  private userId?: string;
  private labId?: string;

  constructor() {}

  /**
   * Initialize the service with user and lab context
   */
  async initialize(userId: string, labId: string): Promise<boolean> {
    this.userId = userId;
    this.labId = labId;

    console.log(`🔧 Initializing CronJobService for user ${userId}, lab ${labId}`);
    return await dynamicSSHService.connectToLab(userId, labId);
  }

  async validateUserCronJob(user: string, cronjob: string): Promise<boolean> {
    if (!this.userId || !this.labId) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (!dynamicSSHService.isSSHConnected()) {
      const connected = await dynamicSSHService.connectToLab(this.userId, this.labId);
      if (!connected) {
        throw new Error('Failed to connect to lab instance');
      }
    }

    const result = await dynamicSSHService.executeCommand(`crontab -u ${user} -l`);
    return (
      result.includes(`*/1\t*\t*\t*\t*\tlogger "EX200 Testing"`)
    );
  }
}

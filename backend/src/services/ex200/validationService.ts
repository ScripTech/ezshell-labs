import {
  validateFileExistence,
  validateFileContent,
  connectSSH,
  ssh
} from "../../utils/ssh-service";

export class ValidationService {
  async validateFileExistence(username: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    return validateFileExistence(username);
  }

  async validateFileContent(username: string): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    return validateFileContent(username);
  }

  async validateChallenge(
    username: string
  ): Promise<{ success: boolean; message: string }> {
    const fileExists = await this.validateFileExistence(username);
    const contentValid = await this.validateFileContent(username);

    if (fileExists && contentValid) {
      return { success: true, message: "Challenge completed successfully!" };
    } else {
      return { success: false, message: "Challenge failed." };
    }
  }
}

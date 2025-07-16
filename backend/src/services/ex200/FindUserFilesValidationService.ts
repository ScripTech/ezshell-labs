import { connectSSH, ssh, executeCommand } from "../../utils/ssh-service";
import * as fs from 'fs';
import * as path from 'path';

export class FindUserFilesValidationService {
  private readonly TASK_DIR = "/task-11/natashafiles";
  private readonly USER = "natasha";
  private readonly SCRIPT_NAME = "find-all-files.sh";
  private readonly VALIDATION_SCRIPT_PATH = "/frontend/storage/labs/EX200/scripts/question-11-find-user-files.sh";

  /**
   * Run the complete validation using the provided shell script
   */
  async runValidationScript(): Promise<{ success: boolean; output: string }> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    
    try {
      // First, copy the validation script to the remote system
      const copyResult = await ssh.execCommand(`cp ${this.VALIDATION_SCRIPT_PATH} /tmp/validation-script.sh && chmod +x /tmp/validation-script.sh`);
      
      if (copyResult.code !== 0) {
        console.error("Failed to copy validation script:", copyResult.stderr);
        return { success: false, output: "Failed to setup validation script" };
      }

      // Run the validation script
      const result = await ssh.execCommand('/tmp/validation-script.sh');
      
      return {
        success: result.code === 0,
        output: result.stdout + (result.stderr ? '\n' + result.stderr : '')
      };
    } catch (error) {
      console.error("Error running validation script:", error);
      return { success: false, output: `Validation script error: ${error}` };
    }
  }

  /**
   * Check if the find-all-files.sh script exists
   */
  async checkScriptExists(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }

    try {
      const result = await ssh.execCommand(`test -f ${this.SCRIPT_NAME}`);
      return result.code === 0;
    } catch (error) {
      console.error("Error checking script existence:", error);
      return false;
    }
  }

  /**
   * Validate that the script contains proper search criteria for user 'natasha'
   */
  async validateSearchCriteria(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }

    try {
      const result = await ssh.execCommand(`grep -q "find .* -user ${this.USER}" ${this.SCRIPT_NAME}`);
      return result.code === 0;
    } catch (error) {
      console.error("Error validating search criteria:", error);
      return false;
    }
  }

  /**
   * Check if the target directory exists
   */
  async checkTargetDirectory(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }

    try {
      const result = await ssh.execCommand(`test -d ${this.TASK_DIR}`);
      return result.code === 0;
    } catch (error) {
      console.error("Error checking target directory:", error);
      return false;
    }
  }

  /**
   * Validate that all files in the target directory are owned by 'natasha'
   */
  async validateFileOwnership(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }

    try {
      // Check if target directory exists first
      const dirExists = await this.checkTargetDirectory();
      if (!dirExists) {
        return false;
      }

      // Count files not owned by natasha
      const result = await ssh.execCommand(`find ${this.TASK_DIR} -not -user ${this.USER} | wc -l`);

      if (result.code !== 0) {
        return false;
      }

      const nonNatashaFiles = parseInt(result.stdout.trim());
      return nonNatashaFiles === 0;
    } catch (error) {
      console.error("Error validating file ownership:", error);
      return false;
    }
  }

  /**
   * Validate that file permissions are preserved during copy operation
   */
  async validatePermissionsPreservation(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }

    try {
      // Check if target directory exists first
      const dirExists = await this.checkTargetDirectory();
      if (!dirExists) {
        return false;
      }

      // Get original files owned by natasha (sample a few for performance)
      const originalFilesResult = await ssh.execCommand(`find / -user ${this.USER} -type f 2>/dev/null | head -n 5`);

      if (originalFilesResult.code !== 0) {
        return false;
      }

      const originalFiles = originalFilesResult.stdout.trim().split('\n').filter(f => f.trim() !== '');

      // Check permissions for each file
      for (const file of originalFiles) {
        if (file.trim() === '') continue;

        const relPath = file.substring(1); // Remove leading slash
        const copiedFile = `${this.TASK_DIR}/${relPath}`;

        // Check if copied file exists
        const copiedExists = await ssh.execCommand(`test -f "${copiedFile}"`);
        if (copiedExists.code !== 0) {
          continue; // Skip if copied file doesn't exist
        }

        // Compare permissions
        const originalPerms = await ssh.execCommand(`stat -c %a "${file}" 2>/dev/null`);
        const copiedPerms = await ssh.execCommand(`stat -c %a "${copiedFile}" 2>/dev/null`);

        if (originalPerms.code === 0 && copiedPerms.code === 0) {
          if (originalPerms.stdout.trim() !== copiedPerms.stdout.trim()) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error("Error validating permissions preservation:", error);
      return false;
    }
  }

  /**
   * Validate copy operation and directory structure maintenance
   */
  async validateCopyOperationAndStructure(): Promise<boolean> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }

    try {
      // Check if target directory exists first
      const dirExists = await this.checkTargetDirectory();
      if (!dirExists) {
        return false;
      }

      // Check if files exist in the target directory
      const copiedFilesResult = await ssh.execCommand(`find ${this.TASK_DIR} -type f | wc -l`);

      if (copiedFilesResult.code !== 0) {
        return false;
      }

      const copiedFilesCount = parseInt(copiedFilesResult.stdout.trim());
      if (copiedFilesCount === 0) {
        return false;
      }

      // Verify directory structure preservation
      const originalDirsResult = await ssh.execCommand(`find / -user ${this.USER} -type d 2>/dev/null | grep -v "^/task-11" | head -n 5`);

      if (originalDirsResult.code === 0) {
        const originalDirs = originalDirsResult.stdout.trim().split('\n').filter(d => d.trim() !== '');

        for (const dir of originalDirs) {
          if (dir.trim() === '') continue;

          const relPath = dir.substring(1); // Remove leading slash
          if (relPath === '') continue; // Skip root directory

          const copiedDir = `${this.TASK_DIR}/${relPath}`;
          const dirExistsResult = await ssh.execCommand(`test -d "${copiedDir}"`);

          if (dirExistsResult.code !== 0) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error("Error validating copy operation and structure:", error);
      return false;
    }
  }

  /**
   * Run the complete validation sequence (for debugging/testing)
   */
  async runCompleteValidation(): Promise<{
    scriptExists: boolean;
    searchCriteriaValid: boolean;
    targetDirExists: boolean;
    ownershipValid: boolean;
    permissionsPreserved: boolean;
    copyOperationValid: boolean;
    overallSuccess: boolean;
  }> {
    try {
      const scriptExists = await this.checkScriptExists();
      const searchCriteriaValid = await this.validateSearchCriteria();
      const targetDirExists = await this.checkTargetDirectory();
      const ownershipValid = await this.validateFileOwnership();
      const permissionsPreserved = await this.validatePermissionsPreservation();
      const copyOperationValid = await this.validateCopyOperationAndStructure();

      const overallSuccess = scriptExists && searchCriteriaValid && targetDirExists &&
                            ownershipValid && permissionsPreserved && copyOperationValid;

      return {
        scriptExists,
        searchCriteriaValid,
        targetDirExists,
        ownershipValid,
        permissionsPreserved,
        copyOperationValid,
        overallSuccess
      };
    } catch (error) {
      console.error("Error in complete validation:", error);
      return {
        scriptExists: false,
        searchCriteriaValid: false,
        targetDirExists: false,
        ownershipValid: false,
        permissionsPreserved: false,
        copyOperationValid: false,
        overallSuccess: false
      };
    }
  }
}

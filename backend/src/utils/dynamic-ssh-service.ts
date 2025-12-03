import { NodeSSH } from "node-ssh";
import { readFileSync } from "fs";
import { labProvisioningService } from '../services/LabProvisioningService';

/**
 * Dynamic SSH service that connects to lab-specific instances
 * This replaces the static ssh-service.ts for validation operations
 */
export class DynamicSSHService {
  private ssh: NodeSSH;
  private currentLabId?: string;
  private currentUserId?: string;
  private isConnected: boolean = false;

  constructor() {
    this.ssh = new NodeSSH();
  }

  /**
   * Connect to the lab instance for the given user and lab
   */
  async connectToLab(userId: string, labId: string): Promise<boolean> {
    try {
      // Check if dynamic labs are disabled - use local lab configuration
      if (process.env.DISABLE_DYNAMIC_LABS === 'true') {
        console.log(`🔧 Dynamic labs disabled - using local lab configuration for validation`);
        return await this.connectToLocalLab();
      }

      // If already connected to this lab for this user, reuse connection
      if (this.isConnected && this.currentLabId === labId && this.currentUserId === userId) {
        console.log(`🔄 Reusing existing SSH connection for user ${userId}, lab ${labId}`);
        return true;
      }

      // Disconnect any existing connection
      if (this.isConnected) {
        this.ssh.dispose();
        this.isConnected = false;
      }

      console.log(`🔗 Connecting to lab ${labId} for user ${userId}`);

      // Get lab connection details
      const connectionDetails = await labProvisioningService.getLabConnectionDetails(labId, userId);

      if (!connectionDetails) {
        console.error(`❌ No lab connection details found for user ${userId}, lab ${labId}`);
        return false;
      }

      console.log(`📋 Lab connection details:`, {
        host: connectionDetails.host,
        username: connectionDetails.username,
        instanceState: connectionDetails.instanceState,
        keyPairName: connectionDetails.keyPairName
      });

      // Validate instance is ready
      if (connectionDetails.instanceState !== 'running') {
        console.error(`❌ Instance not running (state: ${connectionDetails.instanceState})`);
        return false;
      }

      // Prepare connection options
      const connectOptions: any = {
        host: connectionDetails.host,
        port: connectionDetails.port,
        username: connectionDetails.username,
        tryKeyboard: false,
        readyTimeout: 30000, // 30 second timeout
      };

      // Try private key authentication first
      if (connectionDetails.privateKeyPath) {
        try {
          console.log(`🔑 Reading private key from: ${connectionDetails.privateKeyPath}`);
          const privateKey = readFileSync(connectionDetails.privateKeyPath, 'utf8');
          connectOptions.privateKey = privateKey;
          console.log(`✅ Using private key authentication for ${connectionDetails.host} (key size: ${privateKey.length} bytes)`);
        } catch (error) {
          console.warn(`⚠️ Could not read private key: ${error}. Trying password fallback.`);
          const password = process.env.LAB_SSH_PASSWORD || "password";
          connectOptions.password = password;
          console.log(`🔄 Falling back to password authentication`);
        }
      } else {
        // Use password authentication
        const password = process.env.LAB_SSH_PASSWORD || "password";
        connectOptions.password = password;
        console.log(`🔑 Using password authentication for ${connectionDetails.host}`);
      }

      // Connect to SSH
      await this.ssh.connect(connectOptions);

      this.isConnected = true;
      this.currentLabId = labId;
      this.currentUserId = userId;

      console.log(`✅ SSH connection established to lab ${labId} for user ${userId}`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to connect to lab ${labId} for user ${userId}:`, error);
      this.isConnected = false;
      this.currentLabId = undefined;
      this.currentUserId = undefined;
      return false;
    }
  }

  /**
   * Execute a command on the connected lab instance
   */
  async executeCommand(command: string): Promise<string> {
    if (!this.isConnected) {
      throw new Error('SSH not connected. Call connectToLab() first.');
    }

    try {
      console.log(`🔧 Executing command: ${command}`);
      const result = await this.ssh.execCommand(command);

      if (result.code === 0) {
        console.log(`✅ Command executed successfully`);
        return result.stdout;
      } else {
        console.log(`⚠️ Command failed with code ${result.code}. stderr: ${result.stderr}`);
        return result.stderr;
      }
    } catch (error) {
      console.error(`❌ Command execution error:`, error);
      throw error;
    }
  }

  /**
   * Check if SSH connection is active
   */
  isSSHConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get current lab and user info
   */
  getCurrentConnection(): { labId?: string; userId?: string } {
    return {
      labId: this.currentLabId,
      userId: this.currentUserId
    };
  }

  /**
   * Disconnect SSH connection
   */
  disconnect(): void {
    if (this.isConnected) {
      this.ssh.dispose();
      this.isConnected = false;
      this.currentLabId = undefined;
      this.currentUserId = undefined;
      console.log(`🔌 SSH connection disconnected`);
    }
  }

  /**
   * Test basic connectivity
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isConnected) {
        return { success: false, message: "SSH not connected" };
      }

      const result = await this.executeCommand("echo 'Dynamic SSH connection test successful'");

      if (result.includes("Dynamic SSH connection test successful")) {
        return { success: true, message: "Dynamic SSH connection is working properly" };
      } else {
        return { success: false, message: "SSH connection test failed - unexpected response" };
      }
    } catch (error) {
      return {
        success: false,
        message: `SSH connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Connect to local lab using environment variables (for development/testing)
   */
  private async connectToLocalLab(): Promise<boolean> {
    try {
      // Disconnect any existing connection
      if (this.isConnected) {
        this.ssh.dispose();
        this.isConnected = false;
      }

      console.log(`🏠 Connecting to local lab environment`);

      const connectOptions = {
        host: process.env.LAB_SSH_HOST || 'localhost',
        port: parseInt(process.env.LAB_SSH_PORT || '22'),
        username: process.env.LAB_SSH_USERNAME || 'lab-user',
        password: process.env.LAB_SSH_PASSWORD || 'password',
        tryKeyboard: false,
        readyTimeout: 30000, // 30 second timeout
      };

      console.log(`🔑 Connecting to local lab: ${connectOptions.username}@${connectOptions.host}:${connectOptions.port}`);

      // Connect to SSH
      await this.ssh.connect(connectOptions);

      this.isConnected = true;
      this.currentLabId = 'local-lab';
      this.currentUserId = 'local-user';

      console.log(`✅ Local lab SSH connection established`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to connect to local lab:`, error);
      this.isConnected = false;
      this.currentLabId = undefined;
      this.currentUserId = undefined;
      return false;
    }
  }
}

// Create a singleton instance for use across validation services
export const dynamicSSHService = new DynamicSSHService();

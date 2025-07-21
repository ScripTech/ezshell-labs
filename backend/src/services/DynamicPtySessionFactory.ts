import { AuthenticatedSocket } from '../middleware/socketAuth';
import { PtySession, PtySessionOptions } from '../terminal/PtySession';
import { labProvisioningService } from './LabProvisioningService';

export interface LabSessionRequest {
  labId: string;
  sessionId?: string;
  enrollmentId?: string;
  cols?: number;
  rows?: number;
}

export class DynamicPtySessionFactory {
  /**
   * Create a PTY session for a specific lab using provisioned AWS instance
   */
  static async createLabSession(
    socket: AuthenticatedSocket,
    request: LabSessionRequest
  ): Promise<PtySession | null> {
    const userId = socket.user?.sub;
    if (!userId) {
      socket.emit("stdout", "*** AUTH ERROR: User not authenticated ***\r\n");
      return null;
    }

    try {
      // Get lab connection details from the provisioning service
      let connectionDetails;

      if (request.enrollmentId) {
        connectionDetails = await labProvisioningService.getLabConnectionDetailsByEnrollment(request.enrollmentId);
      } else {
        connectionDetails = await labProvisioningService.getLabConnectionDetails(request.labId, userId);
      }

      if (!connectionDetails) {
        socket.emit("stdout", `*** LAB ERROR: No running instance found for lab ${request.labId} ***\r\n`);
        socket.emit("stdout", "*** Please ensure your lab is provisioned and running ***\r\n");
        return null;
      }

      console.log(`Creating lab session for user ${userId}, lab ${request.labId}:`);
      console.log(`- Host: ${connectionDetails.host}`);
      console.log(`- Key Pair: ${connectionDetails.keyPairName}`);
      console.log(`- Instance State: ${connectionDetails.instanceState}`);
      console.log(`- Private Key Path: "${connectionDetails.privateKeyPath}"`);
      console.log(`- Username: ${connectionDetails.username}`);

      // Check if instance is ready
      if (connectionDetails.instanceState !== 'running') {
        socket.emit("stdout", `*** LAB ERROR: Instance is not running (state: ${connectionDetails.instanceState}) ***\r\n`);
        return null;
      }

      if (!connectionDetails.host) {
        socket.emit("stdout", "*** LAB ERROR: Instance has no public IP address ***\r\n");
        return null;
      }

      // Create PTY session options
      const ptyOptions: PtySessionOptions = {
        type: "ssh",
        cols: request.cols || 80,
        rows: request.rows || 60,
        sshConfig: {
          host: connectionDetails.host,
          port: connectionDetails.port,
          username: connectionDetails.username,
          privateKeyPath: connectionDetails.privateKeyPath,
          // Always provide a password fallback
          password: process.env.LAB_SSH_PASSWORD || "password"
        }
      };

      console.log(`SSH Config - Key: "${connectionDetails.privateKeyPath}", Password: ${ptyOptions.sshConfig!.password ? 'provided' : 'not provided'}`);

      // Create and return the PTY session
      const ptySession = new PtySession(socket, ptyOptions);

      socket.emit("stdout", `*** Connected to lab ${request.labId} (${connectionDetails.host}) ***\r\n`);
      socket.emit("stdout", `*** Instance: ${connectionDetails.instanceState} | Key: ${connectionDetails.keyPairName} ***\r\n`);

      return ptySession;

    } catch (error) {
      console.error(`Error creating lab session for ${request.labId}:`, error);
      socket.emit("stdout", `*** LAB SESSION ERROR: ${error instanceof Error ? error.message : 'Unknown error'} ***\r\n`);
      return null;
    }
  }

  /**
   * Create a fallback local session (for development/testing)
   */
  static createLocalSession(socket: AuthenticatedSocket, cols: number = 80, rows: number = 60): PtySession {
    const ptyOptions: PtySessionOptions = {
      type: "local",
      cols,
      rows,
      cwd: process.env.HOME
    };

    return new PtySession(socket, ptyOptions);
  }

  /**
   * Create a session with static SSH configuration (legacy support)
   */
  static createStaticSshSession(
    socket: AuthenticatedSocket,
    host: string,
    username: string,
    password: string,
    cols: number = 80,
    rows: number = 60
  ): PtySession {
    const ptyOptions: PtySessionOptions = {
      type: "ssh",
      cols,
      rows,
      sshConfig: {
        host,
        port: 22,
        username,
        password
      }
    };

    return new PtySession(socket, ptyOptions);
  }

  /**
   * Check if a lab is ready for connection
   */
  static async isLabReady(labId: string, userId: string): Promise<boolean> {
    try {
      return await labProvisioningService.isLabReady(labId, userId);
    } catch (error) {
      console.error('Error checking lab readiness:', error);
      return false;
    }
  }

  /**
   * Get lab connection status for debugging
   */
  static async getLabStatus(labId: string, userId: string): Promise<any> {
    try {
      const details = await labProvisioningService.getLabConnectionDetails(labId, userId);
      return {
        ready: details !== null,
        details: details || null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        ready: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
}

export { DynamicPtySessionFactory as PtySessionFactory };

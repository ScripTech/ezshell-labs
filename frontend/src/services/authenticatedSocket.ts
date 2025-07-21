import { io, Socket } from 'socket.io-client';
import { getSession } from 'next-auth/react';

class AuthenticatedSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private currentLabId?: string;
  private currentSessionId?: string;

  /**
   * Get authentication token for socket connection
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const session = await getSession();
      if (!session?.user) {
        console.warn('No active session found');
        return null;
      }

      // Get the JWT token from the session
      // Note: We need to make sure the frontend exposes the JWT token
      const response = await fetch('/api/auth/token');
      if (!response.ok) {
        console.error('Failed to get auth token');
        return null;
      }

      const data = await response.json();
      console.log('Token response from API:', data);

      if (!data.token) {
        console.error('No token in response:', data);
        return null;
      }

      console.log('Using token for socket connection:', data.token);
      return data.token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Connect to the backend with authentication and optional lab parameters
   */
  async connect(labId: string, sessionId?: string): Promise<Socket | null> {
    // If lab parameters changed, force reconnection
    if (this.socket?.connected && (labId !== this.currentLabId || sessionId !== this.currentSessionId)) {
      console.log('Lab parameters changed, reconnecting...', {
        oldLab: this.currentLabId,
        newLab: labId,
        oldSession: this.currentSessionId,
        newSession: sessionId
      });
      this.disconnect();
    }

    if (this.socket?.connected) {
      return this.socket;
    }

    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.error('Cannot connect to socket: No authentication token');
        return null;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

      // Store current lab parameters
      this.currentLabId = labId;
      this.currentSessionId = sessionId;

      // Build connection options with lab parameters
      const connectionOptions: any = {
        auth: {
          token
        },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
      };

      // Add lab parameters to query if provided
      if (labId || sessionId) {
        connectionOptions.query = {};
        if (labId) connectionOptions.query.lab = labId;
        if (sessionId) connectionOptions.query.session = sessionId;

        console.log('Connecting to socket with lab parameters:', connectionOptions.query);
      } else {
        console.log('Connecting to socket without lab parameters (fallback mode)');
      }

      this.socket = io(backendUrl, connectionOptions);

      this.setupEventHandlers();
      return this.socket;
    } catch (error) {
      console.error('Socket connection error:', error);
      return null;
    }
  }

  /**
   * Setup event handlers for the socket connection
   */
  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to backend with authentication');
      if (this.currentLabId) {
        console.log(`🧪 Connected to lab: ${this.currentLabId}`);
      }
      this.reconnectAttempts = 0;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);

      if (error.message.includes('Authentication')) {
        console.warn('Authentication failed - redirecting to login');
        // Optionally redirect to login page
        window.location.href = '/auth/login';
      }
    });

    // Lab-specific event handlers
    this.socket.on('lab-connection-status', (data) => {
      console.log('🔗 Lab connection status:', data);
    });

    this.socket.on('lab-status', (data) => {
      console.log('📊 Lab status:', data);
    });

    this.socket.on('lab-ready', (data) => {
      console.log('✅ Lab ready status:', data);
    });

    this.socket.on('lab-status-error', (data) => {
      console.error('❌ Lab status error:', data);
    });

    this.socket.on('lab-ready-error', (data) => {
      console.error('❌ Lab ready error:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('🔌 Disconnected from backend:', reason);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected to backend (attempt ${attemptNumber})`);
    });

    this.socket.on('reconnect_error', (error) => {
      this.reconnectAttempts++;
      console.error(`❌ Reconnection failed (${this.reconnectAttempts}/${this.maxReconnectAttempts}):`, error);

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached. Please refresh the page.');
      }
    });
  }

  /**
   * Connect to a specific lab environment
   */
  async connectToLab(labId: string, sessionId?: string): Promise<Socket | null> {
    console.log(`🧪 Connecting to lab: ${labId}${sessionId ? ` with session: ${sessionId}` : ''}`);
    return this.connect(labId, sessionId);
  }

  /**
   * Get the current socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Get current lab connection info
   */
  getCurrentLabInfo(): { labId?: string; sessionId?: string } {
    return {
      labId: this.currentLabId,
      sessionId: this.currentSessionId
    };
  }

  /**
   * Check lab status
   */
  async checkLabStatus(labId: string): Promise<void> {
    const socket = await this.connect(labId);
    if (!socket) {
      throw new Error('Cannot check lab status: No socket connection');
    }

    socket.emit('check-lab-status', { labId });
  }

  /**
   * Check if lab is ready
   */
  async checkLabReady(labId: string): Promise<void> {
    const socket = await this.connect(labId);
    if (!socket) {
      throw new Error('Cannot check lab readiness: No socket connection');
    }

    socket.emit('check-lab-ready', { labId });
  }

  /**
   * Validate a task with authentication
   */
  async validateTask(taskId: string, labId: string, sessionData?: any): Promise<void> {
    const socket = await this.connect(labId);
    if (!socket) {
      throw new Error('Cannot validate task: No socket connection');
    }

    socket.emit('validate-task', {
      taskId,
      labId,
      sessionData
    });
  }

  /**
   * Request progress summary
   */
  async requestProgressSummary(labId: string): Promise<void> {
    const socket = await this.connect(labId);
    if (!socket) {
      throw new Error('Cannot request progress: No socket connection');
    }

    socket.emit('request-progress-summary', { labId });
  }

  /**
   * Send terminal command for tracking
   */
  async trackTerminalCommand(command: string, output?: string, exitCode?: number): Promise<void> {
    const socket = await this.connect("labId");
    if (!socket) return;

    socket.emit('terminal-command', {
      command,
      output,
      exitCode
    });
  }

  /**
   * Disconnect the socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    // Reset lab parameters
    this.currentLabId = undefined;
    this.currentSessionId = undefined;
    console.log('🔌 Disconnected from socket and cleared lab parameters');
  }
}

// Create a singleton instance
export const authenticatedSocketService = new AuthenticatedSocketService();

// Export the class for direct usage if needed
export { AuthenticatedSocketService };

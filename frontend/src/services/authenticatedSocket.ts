import { io, Socket } from 'socket.io-client';
import { getSession } from 'next-auth/react';

class AuthenticatedSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

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
   * Connect to the backend with authentication
   */
  async connect(): Promise<Socket | null> {
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

      this.socket = io(backendUrl, {
        auth: {
          token
        },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
      });

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
   * Get the current socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Validate a task with authentication
   */
  async validateTask(taskId: string, labId: string, sessionData?: any): Promise<void> {
    const socket = await this.connect();
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
    const socket = await this.connect();
    if (!socket) {
      throw new Error('Cannot request progress: No socket connection');
    }

    socket.emit('request-progress-summary', { labId });
  }

  /**
   * Send terminal command for tracking
   */
  async trackTerminalCommand(command: string, output?: string, exitCode?: number): Promise<void> {
    const socket = await this.connect();
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
  }
}

// Create a singleton instance
export const authenticatedSocketService = new AuthenticatedSocketService();

// Export the class for direct usage if needed
export { AuthenticatedSocketService };

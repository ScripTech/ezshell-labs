import { io, Socket } from 'socket.io-client';

export interface ProgressSession {
  id: string;
  userId: string;
  labId: string;
  enrollmentId: string;
  sessionName?: string;
  startedAt: Date;
  lastActiveAt: Date;
  endedAt?: Date;
  status: string;
  totalTimeSpent: number;
  currentTaskId?: string;
  overallProgress: string;
  metadata?: any;
}

export interface TaskAttempt {
  id: string;
  userId: string;
  taskId: string;
  sessionId: string;
  attemptNumber: number;
  startedAt: Date;
  completedAt?: Date;
  timeSpent: number;
  score: string;
  maxPossibleScore: string;
  status: 'in_progress' | 'completed' | 'failed' | 'abandoned';
  validationResult?: any;
  errors?: any;
  hintsUsed: number;
  metadata?: any;
}

export interface ValidationStep {
  id: string;
  attemptId: string;
  stepName: string;
  stepNumber: number;
  stepDescription?: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  startedAt: Date;
  completedAt?: Date;
  executionTime: number;
  output?: string;
  expectedOutput?: string;
  score: string;
  maxScore: string;
  errorMessage?: string;
  metadata?: any;
}

export interface LearningInsights {
  totalTimeSpent: number;
  averageTaskTime: number;
  completionRate: number;
  averageScore: number;
  strugglingTopics: string[];
  strongTopics: string[];
  streak: number;
  milestones: any[];
}

export interface RealTimeAnalytics {
  activeUsers: number;
  sessionsInProgress: number;
  tasksBeingAttempted: number;
  averageSessionTime: number;
  topStrugglingTopics: string[];
  recentCompletions: any[];
}

export interface ValidationStepProgress {
  stepId: string;
  stepName: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  progress: number;
  totalSteps: number;
  currentScore?: number;
  result?: any;
  error?: string;
}

export class EnhancedLabService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private currentSession: ProgressSession | null = null;
  private currentAttempt: TaskAttempt | null = null;
  private listeners = new Map<string, Function[]>();

  constructor(private serverUrl: string = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/ws') {
    this.connect();
  }

  private connect() {
    if (this.socket?.connected) return;

    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to Enhanced Lab Server');
      this.emit('connection-status', { connected: true });
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from Enhanced Lab Server');
      this.emit('connection-status', { connected: false });
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 Connection error:', error);
      this.emit('connection-error', error);
    });

    // Authentication events
    this.socket.on('authentication-error', (data) => {
      console.error('🔴 Authentication failed:', data.message);
      this.emit('authentication-error', data);
    });

    // Lab session events
    this.socket.on('lab-session-started', (data) => {
      console.log('🚀 Lab session started:', data);
      this.emit('lab-session-started', data);
    });

    this.socket.on('lab-session-error', (data) => {
      console.error('🔴 Lab session error:', data);
      this.emit('lab-session-error', data);
    });

    // Task attempt events
    this.socket.on('task-attempt-started', (data) => {
      console.log('🎯 Task attempt started:', data);
      this.emit('task-attempt-started', data);
    });

    this.socket.on('task-attempt-error', (data) => {
      console.error('🔴 Task attempt error:', data);
      this.emit('task-attempt-error', data);
    });

    // Enhanced validation events
    this.socket.on('validation-enhanced-start', (data) => {
      console.log('🔄 Enhanced validation started:', data);
      this.emit('validation-enhanced-start', data);
    });

    this.socket.on('validation-step-progress', (data: ValidationStepProgress) => {
      console.log('⏳ Validation step progress:', data);
      this.emit('validation-step-progress', data);
    });

    this.socket.on('validation-step-complete', (data: ValidationStepProgress) => {
      console.log('✅ Validation step complete:', data);
      this.emit('validation-step-complete', data);
    });

    this.socket.on('validation-enhanced-complete', (data) => {
      console.log('🎉 Enhanced validation complete:', data);
      this.emit('validation-enhanced-complete', data);
    });

    this.socket.on('validation-error', (data) => {
      console.error('🔴 Validation error:', data);
      this.emit('validation-error', data);
    });

    // Learning insights events
    this.socket.on('learning-insights', (data: LearningInsights) => {
      console.log('📊 Learning insights received:', data);
      this.emit('learning-insights', data);
    });

    this.socket.on('insights-error', (data) => {
      console.error('🔴 Insights error:', data);
      this.emit('insights-error', data);
    });

    // Hint events
    this.socket.on('hint-provided', (data) => {
      console.log('💡 Hint provided:', data);
      this.emit('hint-provided', data);
    });

    this.socket.on('hint-error', (data) => {
      console.error('🔴 Hint error:', data);
      this.emit('hint-error', data);
    });

    // Real-time analytics events
    this.socket.on('real-time-analytics', (data: RealTimeAnalytics) => {
      console.log('📈 Real-time analytics:', data);
      this.emit('real-time-analytics', data);
    });

    this.socket.on('dashboard-update', (data) => {
      this.emit('dashboard-update', data);
    });

    // Admin events
    this.socket.on('user-session-started', (data) => {
      this.emit('user-session-started', data);
    });
  }

  // Public API methods
  authenticate(userId: string, token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      this.userId = userId;

      const timeout = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, 10000);

      this.once('authentication-error', (error: any) => {
        clearTimeout(timeout);
        reject(new Error(error.message));
      });

      // Authentication success is implied by no error
      setTimeout(() => {
        clearTimeout(timeout);
        resolve();
      }, 1000);

      this.socket.emit('user-authenticate', { userId, token });
    });
  }

  startLabSession(labId: string, enrollmentId: string): Promise<{ sessionId: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected || !this.userId) {
        reject(new Error('Not connected or authenticated'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Lab session start timeout'));
      }, 15000);

      this.once("lab-session-started", (data: any) => {
        clearTimeout(timeout);
        resolve(data);
      });

      this.once("lab-session-error", (error: any) => {
        clearTimeout(timeout);
        reject(new Error(error.message));
      });

      this.socket.emit('start-lab-session', {
        userId: this.userId,
        labId,
        enrollmentId,
      });
    });
  }

  startTaskAttempt(taskId: string): Promise<{ attemptId: string; attemptNumber: number }> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected || !this.userId) {
        reject(new Error('Not connected or authenticated'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Task attempt start timeout'));
      }, 10000);

      this.once("task-attempt-started", (data: any) => {
        clearTimeout(timeout);
        this.currentAttempt = { ...data, taskId } as TaskAttempt;
        resolve(data);
      });

      this.once("task-attempt-error", (error: any) => {
        clearTimeout(timeout);
        reject(new Error(error.message));
      });

      this.socket.emit('start-task-attempt', {
        userId: this.userId,
        taskId,
      });
    });
  }

  validateTaskEnhanced(
    taskId: string,
    attemptId: string,
    validationData: any
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected || !this.userId) {
        reject(new Error('Not connected or authenticated'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Enhanced validation timeout'));
      }, 60000); // 1 minute timeout for complex validations

      this.once("validation-enhanced-complete", (data: any) => {
        clearTimeout(timeout);
        resolve();
      });

      this.once("validation-error", (error: any) => {
        clearTimeout(timeout);
        reject(new Error(error.message || "Validation failed"));
      });

      this.socket.emit('validate-task-enhanced', {
        userId: this.userId,
        taskId,
        attemptId,
        validationData,
      });
    });
  }

  getLearningInsights(labId: string): Promise<LearningInsights> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected || !this.userId) {
        reject(new Error('Not connected or authenticated'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Learning insights timeout'));
      }, 10000);

      this.once("learning-insights", (data: any) => {
        clearTimeout(timeout);
        resolve(data);
      });

      this.once("insights-error", (error: any) => {
        clearTimeout(timeout);
        reject(new Error(error.message));
      });

      this.socket.emit('get-learning-insights', {
        userId: this.userId,
        labId,
      });
    });
  }

  requestHint(taskId: string, attemptId?: string): Promise<{ hint: string; hintsUsed: number }> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected || !this.userId) {
        reject(new Error('Not connected or authenticated'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Hint request timeout'));
      }, 10000);

      this.once("hint-provided", (data: any) => {
        clearTimeout(timeout);
        resolve(data);
      });

      this.once("hint-error", (error: any) => {
        clearTimeout(timeout);
        reject(new Error(error.message));
      });

      this.socket.emit('request-hint', {
        userId: this.userId,
        taskId,
        attemptId,
      });
    });
  }

  trackCommandExecution(command: string, output?: string, exitCode?: number): void {
    if (!this.socket?.connected || !this.userId) return;

    this.socket.emit('command-executed', {
      userId: this.userId,
      command,
      output,
      exitCode,
    });
  }

  subscribeToAdminAnalytics(isAdmin: boolean = false): void {
    if (!this.socket?.connected || !this.userId) return;

    this.socket.emit('subscribe-admin-analytics', {
      userId: this.userId,
      isAdmin,
    });
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  once(event: string, callback: Function): void {
    const wrappedCallback = (...args: any[]) => {
      this.off(event, wrappedCallback);
      callback(...args);
    };
    this.on(event, wrappedCallback);
  }

  off(event: string, callback?: Function): void {
    if (!this.listeners.has(event)) return;

    if (callback) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.listeners.delete(event);
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event callback for ${event}:`, error);
      }
    });
  }

  // Progress and task management
  async startProgress(labId: string, userId: string): Promise<{ sessionId: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected || !this.userId) {
        reject(new Error('Not connected or authenticated'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Start progress timeout'));
      }, 10000);

      this.once('progress-started', (data: { sessionId: string }) => {
        clearTimeout(timeout);
        resolve(data);
      });

      this.socket.emit('start-progress', {
        labId,
        userId: this.userId,
      });
    });
  }

  async startTask(taskId: string, sessionId: string): Promise<{ attemptId: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected || !this.userId) {
        reject(new Error('Not connected or authenticated'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Start task timeout'));
      }, 10000);

      this.once('task-started', (data: { attemptId: string }) => {
        clearTimeout(timeout);
        resolve(data);
      });

      this.socket.emit('start-task', {
        taskId,
        sessionId,
        userId: this.userId,
      });
    });
  }

  // Terminal methods
  sendTerminalCommand(command: string, sessionId?: string, taskId?: string): void {
    if (!this.socket?.connected || !this.userId) {
      throw new Error('Not connected or authenticated');
    }

    this.socket.emit('terminal-command', {
      command,
      sessionId,
      userId: this.userId,
      labId: sessionId, // Assuming sessionId maps to labId
      taskId,
      timestamp: new Date(),
    });
  }

  requestAutoComplete(partial: string, sessionId?: string, currentPath?: string): void {
    if (!this.socket?.connected || !this.userId) {
      throw new Error('Not connected or authenticated');
    }

    this.socket.emit('terminal-autocomplete', {
      partial,
      sessionId,
      userId: this.userId,
      currentPath,
    });
  }

  // Session management
  async joinLabSession(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected || !this.userId) {
        reject(new Error('Not connected or authenticated'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Join session timeout'));
      }, 10000);

      this.once('session-joined', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.socket.emit('join-lab-session', {
        sessionId,
        userId: this.userId,
      });
    });
  }

  // Admin analytics methods
  requestAdminAnalytics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected || !this.userId) {
        reject(new Error('Not connected or authenticated'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Admin analytics request timeout'));
      }, 10000);

      this.once('admin-analytics-update', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.socket.emit('admin-request-analytics', {
        timeRange,
        requestedAt: new Date(),
      });
    });
  }

  requestUserAnalytics(userId: string, timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected || !this.userId) {
        reject(new Error('Not connected or authenticated'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('User analytics request timeout'));
      }, 10000);

      this.once('admin-user-analytics-update', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.socket.emit('admin-request-user-analytics', {
        userId,
        timeRange,
        requestedAt: new Date(),
      });
    });
  }

  requestLabAnalytics(labId: string, timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected || !this.userId) {
        reject(new Error('Not connected or authenticated'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Lab analytics request timeout'));
      }, 10000);

      this.once('admin-lab-analytics-update', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.socket.emit('admin-request-lab-analytics', {
        labId,
        timeRange,
        requestedAt: new Date(),
      });
    });
  }

  // Getters
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  get currentUserId(): string | null {
    return this.userId;
  }

  get currentLabSession(): ProgressSession | null {
    return this.currentSession;
  }

  get currentTaskAttempt(): TaskAttempt | null {
    return this.currentAttempt;
  }

  // Cleanup
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
    this.userId = null;
    this.currentSession = null;
    this.currentAttempt = null;
  }
}

// Export singleton instance
export const enhancedLabService = new EnhancedLabService();

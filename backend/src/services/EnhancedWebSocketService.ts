import { Server as SocketIOServer, Socket } from 'socket.io';
import { progressService } from './ProgressService';
import { ValidationTaskService } from './ValidationTaskService';

export interface EnhancedWebSocketEvent {
  type: 'lab-session-start' | 'lab-session-end' | 'task-attempt-start' | 'task-attempt-progress' |
        'task-attempt-complete' | 'validation-step-start' | 'validation-step-progress' |
        'validation-step-complete' | 'learning-insights' | 'real-time-analytics' |
        'hint-request' | 'command-executed' | 'error-occurred';
  userId: string;
  sessionId?: string;
  taskId?: string;
  attemptId?: string;
  stepId?: string;
  data: any;
  timestamp: Date;
  metadata?: any;
}

export interface RealTimeAnalytics {
  activeUsers: number;
  sessionsInProgress: number;
  tasksBeingAttempted: number;
  averageSessionTime: number;
  topStrugglingTopics: string[];
  recentCompletions: any[];
}

export class EnhancedWebSocketService {
  private io: SocketIOServer;
  private validationService: ValidationTaskService;
  private activeConnections = new Map<string, Socket>();
  private userSessions = new Map<string, string>(); // userId -> sessionId
  private analyticsCache: RealTimeAnalytics | null = null;
  private analyticsTimer: NodeJS.Timeout | null = null;

  constructor(io: SocketIOServer, validationService: ValidationTaskService) {
    this.io = io;
    this.validationService = validationService;
    this.setupEventHandlers();
    this.startAnalyticsUpdates();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`WebSocket client connected: ${socket.id}`);

      // Store connection
      socket.on('user-authenticate', async (data: { userId: string, token?: string }) => {
        try {
          // TODO: Validate token if needed
          this.activeConnections.set(data.userId, socket);
          socket.join(`user-${data.userId}`);

          // Send current analytics to new user
          if (this.analyticsCache) {
            socket.emit('real-time-analytics', this.analyticsCache);
          }

          console.log(`User ${data.userId} authenticated on socket ${socket.id}`);
        } catch (error) {
          socket.emit('authentication-error', { message: 'Authentication failed' });
        }
      });

      // Lab session management
      socket.on('start-lab-session', async (data: { userId: string, labId: string, enrollmentId: string }) => {
        try {
          const session = await progressService.startLabSession(data.userId, data.labId, data.enrollmentId);
          this.userSessions.set(data.userId, session.id);

          // Log the event
          await progressService.logRealtimeEvent(
            data.userId,
            session.id,
            'lab-session-start',
            { labId: data.labId, enrollmentId: data.enrollmentId },
            socket.id
          );

          socket.emit('lab-session-started', {
            sessionId: session.id,
            message: 'Lab session started successfully'
          });

          // Broadcast to admin dashboards
          this.io.to('admin').emit('user-session-started', {
            userId: data.userId,
            labId: data.labId,
            sessionId: session.id,
            timestamp: new Date()
          });

        } catch (error) {
          socket.emit('lab-session-error', { message: 'Failed to start lab session' });
        }
      });

      // Task attempt management
      socket.on('start-task-attempt', async (data: { userId: string, taskId: string }) => {
        try {
          const sessionId = this.userSessions.get(data.userId);
          if (!sessionId) {
            socket.emit('task-attempt-error', { message: 'No active lab session' });
            return;
          }

          const attempt = await progressService.startTaskAttempt(data.userId, data.taskId, sessionId);

          // Log the event
          await progressService.logRealtimeEvent(
            data.userId,
            sessionId,
            'task-attempt-start',
            { taskId: data.taskId, attemptId: attempt.id },
            socket.id
          );

          socket.emit('task-attempt-started', {
            attemptId: attempt.id,
            attemptNumber: attempt.attemptNumber,
            message: 'Task attempt started'
          });

        } catch (error) {
          socket.emit('task-attempt-error', { message: 'Failed to start task attempt' });
        }
      });

      // Enhanced validation with real-time step tracking
      socket.on('validate-task-enhanced', async (data: {
        userId: string,
        taskId: string,
        attemptId: string,
        validationData: any
      }) => {
        try {
          const sessionId = this.userSessions.get(data.userId);
          if (!sessionId) {
            socket.emit('validation-error', { message: 'No active lab session' });
            return;
          }

          // Create validation step tracking
          const steps = await this.createValidationSteps(data.attemptId, data.validationData);

          // Emit validation start
          socket.emit('validation-enhanced-start', {
            attemptId: data.attemptId,
            totalSteps: steps.length,
            steps: steps.map(s => ({ id: s.id, name: s.stepName, order: s.stepOrder }))
          });

          // Execute validation with step-by-step updates
          let completedSteps = 0;
          let overallScore = 0;

          for (const step of steps) {
            // Update step to running (we'll log this as metadata instead)
            socket.emit('validation-step-progress', {
              stepId: step.id,
              stepName: step.stepName,
              status: 'running',
              progress: completedSteps,
              totalSteps: steps.length
            });

            try {
              // Execute the actual validation logic
              const executor = this.validationService.getExecutor(data.taskId);
              if (executor) {
                const validationContext = {
                  taskId: data.taskId,
                  userId: data.userId,
                  labId: 'EX200', // TODO: Get from session
                  sessionData: data.validationData
                };

                // Create a validation step for the executor
                const validationStep = {
                  id: step.id,
                  type: 'network-validation',
                  method: step.stepName,
                  params: data.validationData,
                  description: `Validation step: ${step.stepName}`,
                  weight: 1
                };

                const stepResult = await executor.executeStep(validationStep, validationContext);

                // Update step with result
                await progressService.updateValidationStep(
                  step.id,
                  stepResult.success ? "passed" : "failed",
                  stepResult.success
                    ? undefined
                    : `Validation failed: Score ${stepResult.score}/${stepResult.maxScore}`
                );

                completedSteps++;
                if (stepResult.success) {
                  overallScore += stepResult.score || 0;
                }

                // Emit step completion
                socket.emit('validation-step-complete', {
                  stepId: step.id,
                  stepName: step.stepName,
                  status: stepResult.success ? 'success' : 'failed',
                  result: stepResult,
                  progress: completedSteps,
                  totalSteps: steps.length,
                  currentScore: overallScore
                });

              } else {
                await progressService.updateValidationStep(step.id, 'failed', undefined, 'Executor not found');
                socket.emit('validation-step-complete', {
                  stepId: step.id,
                  status: 'failed',
                  error: 'Validation executor not found'
                });
              }

            } catch (stepError: any) {
              const errorMessage = stepError?.message || 'Unknown validation error';
              await progressService.updateValidationStep(
                step.id,
                "failed",
                undefined,
                errorMessage
              );
              socket.emit('validation-step-complete', {
                stepId: step.id,
                status: 'failed',
                error: errorMessage
              });
            }
          }

          // Complete the task attempt
          const finalScore = (overallScore / steps.length).toFixed(2);
          const status = completedSteps === steps.length && overallScore > 0 ? 'completed' : 'failed';

          await progressService.completeTaskAttempt(
            data.attemptId,
            finalScore,
            status,
            { steps, overallScore, completedSteps }
          );

          // Emit final validation result
          socket.emit('validation-enhanced-complete', {
            attemptId: data.attemptId,
            status,
            finalScore,
            completedSteps,
            totalSteps: steps.length,
            message: status === 'completed' ? 'Task completed successfully!' : 'Task validation failed'
          });

          // Log completion event
          await progressService.logRealtimeEvent(
            data.userId,
            sessionId,
            'task-attempt-complete',
            { attemptId: data.attemptId, status, score: finalScore },
            socket.id
          );

        } catch (error: any) {
          socket.emit('validation-error', {
            message: 'Validation failed',
            error: error?.message || 'Unknown error occurred'
          });
        }
      });

      // Learning insights request
      socket.on('get-learning-insights', async (data: { userId: string, labId: string }) => {
        try {
          const insights = await progressService.getLearningInsights(data.userId, data.labId);
          socket.emit('learning-insights', insights);
        } catch (error) {
          socket.emit('insights-error', { message: 'Failed to get learning insights' });
        }
      });

      // Hint request tracking
      socket.on('request-hint', async (data: { userId: string, taskId: string, attemptId?: string }) => {
        try {
          const sessionId = this.userSessions.get(data.userId);
          if (sessionId && data.attemptId) {
            await progressService.logRealtimeEvent(
              data.userId,
              sessionId,
              'hint-request',
              { taskId: data.taskId, attemptId: data.attemptId },
              socket.id
            );
          }

          // TODO: Implement hint logic
          socket.emit('hint-provided', {
            hint: 'Check your network configuration and ensure all services are running.',
            hintsUsed: 1 // TODO: Track from database
          });
        } catch (error) {
          socket.emit('hint-error', { message: 'Failed to provide hint' });
        }
      });

      // Command execution tracking
      socket.on('command-executed', async (data: {
        userId: string,
        command: string,
        output?: string,
        exitCode?: number
      }) => {
        try {
          const sessionId = this.userSessions.get(data.userId);
          if (sessionId) {
            await progressService.logRealtimeEvent(
              data.userId,
              sessionId,
              'command-executed',
              { command: data.command, output: data.output, exitCode: data.exitCode },
              socket.id
            );
          }
        } catch (error) {
          console.error('Failed to log command execution:', error);
        }
      });

      // Admin analytics subscription
      socket.on('subscribe-admin-analytics', (data: { userId: string, isAdmin: boolean }) => {
        if (data.isAdmin) {
          socket.join('admin');
          if (this.analyticsCache) {
            socket.emit('real-time-analytics', this.analyticsCache);
          }
        }
      });

      // Disconnect handling
      socket.on('disconnect', async () => {
        console.log(`WebSocket client disconnected: ${socket.id}`);

        // Find and remove user connection
        for (const [userId, userSocket] of this.activeConnections.entries()) {
          if (userSocket.id === socket.id) {
            this.activeConnections.delete(userId);

            // End active session if exists
            const sessionId = this.userSessions.get(userId);
            if (sessionId) {
              await progressService.endActiveSession(userId, 'unknown');
              this.userSessions.delete(userId);
            }
            break;
          }
        }
      });
    });
  }

  private async createValidationSteps(attemptId: string, validationData: any): Promise<any[]> {
    const steps = [
      { name: 'network-interface-check', order: 1 },
      { name: 'ip-configuration-check', order: 2 },
      { name: 'firewall-rules-check', order: 3 },
      { name: 'service-status-check', order: 4 },
      { name: 'connectivity-test', order: 5 }
    ];

    const createdSteps = [];
    for (const stepConfig of steps) {
      const step = await progressService.trackValidationStep(
        attemptId,
        stepConfig.name,
        stepConfig.order,
        'pending'
      );
      createdSteps.push(step);
    }

    return createdSteps;
  }

  private startAnalyticsUpdates() {
    this.analyticsTimer = setInterval(async () => {
      try {
        const analytics = await this.calculateRealTimeAnalytics();
        this.analyticsCache = analytics;

        // Broadcast to all admin users
        this.io.to('admin').emit('real-time-analytics', analytics);

        // Broadcast to all connected users (simplified version)
        this.io.emit('dashboard-update', {
          activeUsers: analytics.activeUsers,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Failed to update analytics:', error);
      }
    }, 10000); // Update every 10 seconds
  }

  private async calculateRealTimeAnalytics(): Promise<RealTimeAnalytics> {
    // TODO: Implement comprehensive analytics calculation
    return {
      activeUsers: this.activeConnections.size,
      sessionsInProgress: this.userSessions.size,
      tasksBeingAttempted: 0, // TODO: Calculate from database
      averageSessionTime: 0, // TODO: Calculate from database
      topStrugglingTopics: [], // TODO: Calculate from analytics
      recentCompletions: [] // TODO: Get recent completions
    };
  }

  public getUserSession(userId: string): string | undefined {
    return this.userSessions.get(userId);
  }

  public broadcastToUser(userId: string, event: string, data: any) {
    const socket = this.activeConnections.get(userId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  public broadcastToAllUsers(event: string, data: any) {
    this.io.emit(event, data);
  }

  public getActiveUserCount(): number {
    return this.activeConnections.size;
  }

  public cleanup() {
    if (this.analyticsTimer) {
      clearInterval(this.analyticsTimer);
    }
  }
}

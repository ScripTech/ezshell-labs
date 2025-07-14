import { db } from '../db';
import {
  labProgressSessions,
  taskAttempts,
  validationSteps,
  learningAnalytics,
  realtimeEvents
} from '../db/schemas/ProgressSchema';
import { labEnrollments, labTasks } from '../db/schemas/LabSchema';
import { eq, and, desc, avg, sum, count } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface ProgressSession {
  id: string;
  userId: string;
  labId: string;
  enrollmentId: string;
  sessionName?: string;
  startedAt: Date;
  lastActiveAt: Date;
  endedAt?: Date;
  status: string; // active, paused, completed, abandoned
  totalTimeSpent: number;
  currentTaskId?: string;
  overallProgress: string; // decimal as string
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
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
  score: string; // decimal as string
  maxPossibleScore: string; // decimal as string
  status: 'in_progress' | 'completed' | 'failed' | 'abandoned';
  validationResult?: any;
  errors?: any;
  hintsUsed: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidationStep {
  id: string;
  attemptId: string;
  stepName: string;
  stepNumber: number; // stepOrder renamed to match schema
  stepDescription?: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  startedAt: Date;
  completedAt?: Date;
  executionTime: number; // duration renamed to match schema
  output?: string;
  expectedOutput?: string;
  score: string; // decimal as string
  maxScore: string; // decimal as string
  errorMessage?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
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

export class ProgressService {

  /**
   * Start a new lab progress session
   */
  async startLabSession(userId: string, labId: string, enrollmentId: string): Promise<ProgressSession> {
    // End any existing active sessions for this user/lab
    await this.endActiveSession(userId, labId);

    const sessionId = uuidv4();

    const [session] = await db.insert(labProgressSessions).values({
      id: sessionId,
      userId,
      labId,
      enrollmentId,
      sessionName: `${labId}-Session-${Date.now()}`,
      startedAt: new Date(),
      lastActiveAt: new Date(),
      status: 'active',
      totalTimeSpent: 0,
      overallProgress: '0.00',
      metadata: {},
    }).returning();

    return session as ProgressSession;
  }

  /**
   * End the current active session
   */
  async endActiveSession(userId: string, labId: string): Promise<void> {
    const activeSessions = await db
      .select()
      .from(labProgressSessions)
      .where(
        and(
          eq(labProgressSessions.userId, userId),
          eq(labProgressSessions.labId, labId),
          eq(labProgressSessions.status, 'active')
        )
      );

    for (const session of activeSessions) {
      await db
        .update(labProgressSessions)
        .set({
          endedAt: new Date(),
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(labProgressSessions.id, session.id));
    }
  }

  /**
   * Start a new task attempt
   */
  async startTaskAttempt(
    userId: string,
    taskId: string,
    sessionId: string
  ): Promise<TaskAttempt> {
    // Get the current attempt number for this user/task
    const existingAttempts = await db
      .select({ count: count() })
      .from(taskAttempts)
      .where(
        and(
          eq(taskAttempts.userId, userId),
          eq(taskAttempts.taskId, taskId)
        )
      );

    const attemptNumber = (existingAttempts[0]?.count || 0) + 1;
    const attemptId = uuidv4();

    const [attempt] = await db.insert(taskAttempts).values({
      id: attemptId,
      userId,
      taskId,
      sessionId,
      attemptNumber,
      startedAt: new Date(),
      timeSpent: 0,
      score: "0.00",
      maxPossibleScore: "100.00",
      status: 'in_progress',
      hintsUsed: 0,
      validationResult: {},
      errors: [],
      metadata: {},
    }).returning();

    // Update session to track current task
    await db
      .update(labProgressSessions)
      .set({
        currentTaskId: taskId,
        updatedAt: new Date(),
      })
      .where(eq(labProgressSessions.id, sessionId));

    return attempt as TaskAttempt;
  }

  /**
   * Complete a task attempt
   */
  async completeTaskAttempt(
    attemptId: string,
    score: string,
    status: 'completed' | 'failed' | 'abandoned',
    validationResult?: any,
    errors?: any
  ): Promise<void> {
    const endTime = new Date();

    // Get the attempt to calculate time spent
    const [attempt] = await db
      .select()
      .from(taskAttempts)
      .where(eq(taskAttempts.id, attemptId));

    if (!attempt || !attempt.startedAt) {
      throw new Error('Task attempt not found or missing start time');
    }

    const timeSpent = Math.floor((endTime.getTime() - attempt.startedAt.getTime()) / 1000);

    await db
      .update(taskAttempts)
      .set({
        completedAt: endTime,
        timeSpent,
        score,
        status,
        validationResult,
        errors,
        updatedAt: endTime,
      })
      .where(eq(taskAttempts.id, attemptId));

    // Update session progress if task completed successfully
    if (status === 'completed' && attempt.sessionId) {
      const [session] = await db
        .select()
        .from(labProgressSessions)
        .where(eq(labProgressSessions.id, attempt.sessionId));

      if (session) {
        await db
          .update(labProgressSessions)
          .set({
            totalTimeSpent: (session.totalTimeSpent || 0) + timeSpent,
            lastActiveAt: endTime,
            updatedAt: endTime,
          })
          .where(eq(labProgressSessions.id, attempt.sessionId));
      }
    }
  }

  /**
   * Track validation step progress
   */
  async trackValidationStep(
    attemptId: string,
    stepName: string,
    stepNumber: number,
    status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped',
    output?: string,
    errorMessage?: string,
    metadata?: any
  ): Promise<ValidationStep> {
    const stepId = uuidv4();
    const now = new Date();

    const [step] = await db.insert(validationSteps).values({
      id: stepId,
      attemptId,
      stepName,
      stepNumber,
      status,
      startedAt: now,
      completedAt: status !== 'running' && status !== 'pending' ? now : undefined,
      executionTime: 0,
      output,
      score: "0.00",
      maxScore: "10.00",
      errorMessage,
      metadata,
    }).returning();

    return step as ValidationStep;
  }

  /**
   * Update validation step status
   */
  async updateValidationStep(
    stepId: string,
    status: 'passed' | 'failed' | 'skipped',
    output?: string,
    errorMessage?: string
  ): Promise<void> {
    const endTime = new Date();

    // Get the step to calculate execution time
    const [step] = await db
      .select()
      .from(validationSteps)
      .where(eq(validationSteps.id, stepId));

    if (!step || !step.startedAt) {
      throw new Error('Validation step not found or missing start time');
    }

    const executionTime = endTime.getTime() - step.startedAt.getTime();

    await db
      .update(validationSteps)
      .set({
        status,
        completedAt: endTime,
        executionTime,
        output,
        errorMessage,
        updatedAt: endTime,
      })
      .where(eq(validationSteps.id, stepId));
  }

  /**
   * Get user's learning analytics and insights
   */
  async getLearningInsights(userId: string, labId: string): Promise<LearningInsights> {
    // Get all task attempts for this user/lab
    const attempts = await db
      .select({
        timeSpent: taskAttempts.timeSpent,
        score: taskAttempts.score,
        status: taskAttempts.status,
        taskId: taskAttempts.taskId,
      })
      .from(taskAttempts)
      .innerJoin(labTasks, eq(taskAttempts.taskId, labTasks.id))
      .where(
        and(
          eq(taskAttempts.userId, userId),
          eq(labTasks.labId, labId)
        )
      );

    if (attempts.length === 0) {
      return {
        totalTimeSpent: 0,
        averageTaskTime: 0,
        completionRate: 0,
        averageScore: 0,
        strugglingTopics: [],
        strongTopics: [],
        streak: 0,
        milestones: [],
      };
    }

    const totalTimeSpent = attempts.reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0);
    const averageTaskTime = totalTimeSpent / attempts.length;
    const completedAttempts = attempts.filter(attempt => attempt.status === 'completed');
    const completionRate = (completedAttempts.length / attempts.length) * 100;
    const averageScore = completedAttempts.length > 0
      ? completedAttempts.reduce((sum, attempt) => {
          const score = attempt.score ? parseFloat(attempt.score) : 0;
          return sum + score;
        }, 0) / completedAttempts.length
      : 0;

    // Analyze struggling vs strong topics (simplified logic)
    const taskPerformance = new Map<string, { scores: number[], attempts: number }>();

    attempts.forEach(attempt => {
      const taskId = attempt.taskId;
      if (!taskId) return; // Skip if taskId is null

      if (!taskPerformance.has(taskId)) {
        taskPerformance.set(taskId, { scores: [], attempts: 0 });
      }

      const performance = taskPerformance.get(taskId)!;
      performance.attempts++;
      if (attempt.status === 'completed' && attempt.score) {
        performance.scores.push(parseFloat(attempt.score));
      }
    });

    const strugglingTopics: string[] = [];
    const strongTopics: string[] = [];

    taskPerformance.forEach((performance, taskId) => {
      const avgScore = performance.scores.length > 0
        ? performance.scores.reduce((a, b) => a + b, 0) / performance.scores.length
        : 0;

      if (avgScore < 70 || performance.attempts > 3) {
        strugglingTopics.push(taskId);
      } else if (avgScore >= 90 && performance.attempts <= 2) {
        strongTopics.push(taskId);
      }
    });

    return {
      totalTimeSpent,
      averageTaskTime,
      completionRate,
      averageScore,
      strugglingTopics,
      strongTopics,
      streak: 0, // TODO: Calculate based on daily activity
      milestones: [], // TODO: Implement milestone tracking
    };
  }

  /**
   * Get current active session for user
   */
  async getActiveSession(userId: string, labId: string): Promise<ProgressSession | null> {
    const [session] = await db
      .select()
      .from(labProgressSessions)
      .where(
        and(
          eq(labProgressSessions.userId, userId),
          eq(labProgressSessions.labId, labId),
          eq(labProgressSessions.status, 'active')
        )
      )
      .limit(1);

    return session as ProgressSession || null;
  }

  /**
   * Log real-time event for WebSocket tracking
   */
  async logRealtimeEvent(
    userId: string,
    sessionId: string,
    eventType: string,
    eventData: any,
    sourceIP?: string,
    metadata?: any
  ): Promise<void> {
    await db.insert(realtimeEvents).values({
      id: uuidv4(),
      userId,
      sessionId,
      eventType,
      eventData,
      sourceIP,
      metadata,
      timestamp: new Date(),
    });
  }

  /**
   * Get recent real-time events for analysis
   */
  async getRecentEvents(
    userId: string,
    sessionId: string,
    limit: number = 50
  ): Promise<any[]> {
    return await db
      .select()
      .from(realtimeEvents)
      .where(
        and(
          eq(realtimeEvents.userId, userId),
          eq(realtimeEvents.sessionId, sessionId)
        )
      )
      .orderBy(desc(realtimeEvents.timestamp))
      .limit(limit);
  }
}

export const progressService = new ProgressService();

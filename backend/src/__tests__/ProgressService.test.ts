import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { progressService } from '../services/ProgressService';
import { db } from '../db';
import {
  labProgressSessions,
  taskAttempts,
  validationSteps,
  realtimeEvents
} from '../db/schemas/ProgressSchema';
import { labs, labTasks, labEnrollments } from '../db/schemas/LabSchema';
import { users } from '../db/schemas/UserSchema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

describe('Progress Service Integration Tests', () => {
  let testUserId: string;
  let testLabId: string;
  let testTaskId: string;
  let testEnrollmentId: string;

  beforeEach(async () => {
    // Create test data
    testUserId = uuidv4();
    testLabId = uuidv4();
    testTaskId = uuidv4();
    testEnrollmentId = uuidv4();

    // Insert test user
    await db.insert(users).values({
      id: testUserId,
      email: `test+${testUserId}+${uuidv4()}+${Date.now()}+${Math.random().toString(36).substring(2, 15)}+${process.hrtime.bigint()}+${Math.random()}@example.com`,
      name: 'Test User',
      role: 'user',
    });

    // Insert test lab
    await db.insert(labs).values({
      id: testLabId,
      name: 'EX200 Network Configuration Lab',
      description: 'Practice network configuration tasks',
      duration: 60,
    });

    // Insert test task
    await db.insert(labTasks).values({
      id: testTaskId,
      labId: testLabId,
      order: 1,
      title: 'Configure Network Interface',
      description: 'Set up eth0 interface with static IP',
      difficulty: 'medium',
      points: 100,
      validationSteps: JSON.stringify(['check-interface', 'verify-ip', 'test-connectivity']),
    });

    // Insert test enrollment
    await db.insert(labEnrollments).values({
      id: testEnrollmentId,
      userId: testUserId,
      labId: testLabId,
      status: 'enrolled',
      progress: 0,
    });
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(realtimeEvents);
    await db.delete(validationSteps);
    await db.delete(taskAttempts);
    await db.delete(labProgressSessions);
    await db.delete(labTasks);
    await db.delete(labEnrollments);
    await db.delete(labs);
    await db.delete(users);
  });

  describe('Lab Session Management', () => {
    it('should start a new lab session successfully', async () => {
      const session = await progressService.startLabSession(
        testUserId,
        testLabId,
        testEnrollmentId
      );

      expect(session).toBeDefined();
      expect(session.userId).toBe(testUserId);
      expect(session.labId).toBe(testLabId);
      expect(session.enrollmentId).toBe(testEnrollmentId);

    });

    it('should end existing active sessions when starting new one', async () => {
      // Start first session
      const session1 = await progressService.startLabSession(
        testUserId,
        testLabId,
        testEnrollmentId
      );

      // Start second session (should end the first one)
      const session2 = await progressService.startLabSession(
        testUserId,
        testLabId,
        testEnrollmentId
      );

      expect(session2.id).not.toBe(session1.id);

      // Check that first session is now inactive
      const activeSession = await progressService.getActiveSession(testUserId, testLabId);
      expect(activeSession?.id).toBe(session2.id);
    });

    it('should get active session for user', async () => {
      const session = await progressService.startLabSession(
        testUserId,
        testLabId,
        testEnrollmentId
      );

      const activeSession = await progressService.getActiveSession(testUserId, testLabId);
      expect(activeSession?.id).toBe(session.id);
    });
  });

  describe('Task Attempt Management', () => {
    let sessionId: string;

    beforeEach(async () => {
      const session = await progressService.startLabSession(
        testUserId,
        testLabId,
        testEnrollmentId
      );
      sessionId = session.id;
    });

    it('should start a task attempt successfully', async () => {
      const attempt = await progressService.startTaskAttempt(
        testUserId,
        testTaskId,
        sessionId
      );

      expect(attempt).toBeDefined();
      expect(attempt.userId).toBe(testUserId);
      expect(attempt.taskId).toBe(testTaskId);
      expect(attempt.sessionId).toBe(sessionId);
      expect(attempt.attemptNumber).toBe(1);
      expect(attempt.status).toBe('in_progress');
      expect(attempt.score).toBe('0.00');
    });

    it('should increment attempt number for multiple attempts', async () => {
      const attempt1 = await progressService.startTaskAttempt(
        testUserId,
        testTaskId,
        sessionId
      );

      const attempt2 = await progressService.startTaskAttempt(
        testUserId,
        testTaskId,
        sessionId
      );

      expect(attempt1.attemptNumber).toBe(1);
      expect(attempt2.attemptNumber).toBe(2);
    });

    it('should complete a task attempt successfully', async () => {
      const attempt = await progressService.startTaskAttempt(
        testUserId,
        testTaskId,
        sessionId
      );

      await progressService.completeTaskAttempt(
        attempt.id,
        '85.50',
        'completed',
        { steps: ['check-interface', 'verify-ip'], results: ['pass', 'pass'] },
        null
      );

      // Verify the attempt was updated
      const [updatedAttempt] = await db
        .select()
        .from(taskAttempts)
        .where(eq(taskAttempts.id, attempt.id));

      expect(updatedAttempt.status).toBe('completed');
      expect(updatedAttempt.score).toBe('85.50');
      expect(updatedAttempt.completedAt).toBeDefined();
      expect(updatedAttempt.timeSpent).toBeGreaterThan(0);
    });
  });

  describe('Validation Step Tracking', () => {
    let attemptId: string;

    beforeEach(async () => {
      const session = await progressService.startLabSession(
        testUserId,
        testLabId,
        testEnrollmentId
      );
      const attempt = await progressService.startTaskAttempt(
        testUserId,
        testTaskId,
        session.id
      );
      attemptId = attempt.id;
    });

    it('should track validation steps with proper ordering', async () => {
      const step1 = await progressService.trackValidationStep(
        attemptId,
        'check-interface',
        1,
        'pending'
      );

      const step2 = await progressService.trackValidationStep(
        attemptId,
        'verify-ip',
        2,
        'running'
      );

      expect(step1.stepName).toBe('check-interface');
      expect(step1.status).toBe('pending');

      expect(step2.stepName).toBe('verify-ip');
      expect(step2.status).toBe('running');
    });

    it('should update validation step status with duration calculation', async () => {
      const step = await progressService.trackValidationStep(
        attemptId,
        'check-interface',
        1,
        'pending'
      );

      // Wait a moment to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await progressService.updateValidationStep(
        step.id,
        'passed',
        JSON.stringify({ interfaceStatus: 'up', ipAddress: '192.168.1.100' }),
        undefined
      );

      const [updatedStep] = await db
        .select()
        .from(validationSteps)
        .where(eq(validationSteps.id, step.id));

      expect(updatedStep.status).toBe('success');
      expect(updatedStep.output).toEqual({
        interfaceStatus: 'up',
        ipAddress: '192.168.1.100'
      });
    });
  });

  describe('Learning Analytics', () => {
    let sessionId: string;

    beforeEach(async () => {
      const session = await progressService.startLabSession(
        testUserId,
        testLabId,
        testEnrollmentId
      );
      sessionId = session.id;
    });

    it('should calculate learning insights from task attempts', async () => {
      // Create multiple task attempts with different outcomes
      const attempt1 = await progressService.startTaskAttempt(testUserId, testTaskId, sessionId);
      await progressService.completeTaskAttempt(attempt1.id, '95.00', 'completed');

      const attempt2 = await progressService.startTaskAttempt(testUserId, testTaskId, sessionId);
      await progressService.completeTaskAttempt(attempt2.id, '60.00', 'failed');

      const attempt3 = await progressService.startTaskAttempt(testUserId, testTaskId, sessionId);
      await progressService.completeTaskAttempt(attempt3.id, '85.00', 'completed');

      const insights = await progressService.getLearningInsights(testUserId, testLabId);

      expect(insights.totalTimeSpent).toBeGreaterThan(0);
      expect(insights.averageTaskTime).toBeGreaterThan(0);
      expect(insights.completionRate).toBe(66.67); // 2 out of 3 completed
      expect(insights.averageScore).toBe(90); // (95 + 85) / 2
    });

    it('should return default insights for users with no attempts', async () => {
      const insights = await progressService.getLearningInsights(testUserId, testLabId);

      expect(insights.totalTimeSpent).toBe(0);
      expect(insights.averageTaskTime).toBe(0);
      expect(insights.completionRate).toBe(0);
      expect(insights.averageScore).toBe(0);
      expect(insights.strugglingTopics).toEqual([]);
      expect(insights.strongTopics).toEqual([]);
    });
  });

  describe('Real-time Event Logging', () => {
    let sessionId: string;

    beforeEach(async () => {
      const session = await progressService.startLabSession(
        testUserId,
        testLabId,
        testEnrollmentId
      );
      sessionId = session.id;
    });

    it('should log real-time events successfully', async () => {
      await progressService.logRealtimeEvent(
        testUserId,
        sessionId,
        'task-attempt-start',
        { taskId: testTaskId, difficulty: 'medium' },
        'socket-123',
        { userAgent: 'test-browser' }
      );

      const events = await progressService.getRecentEvents(testUserId, sessionId, 10);

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('task-attempt-start');
      expect(events[0].socketId).toBe('socket-123');
      expect(events[0].eventData).toEqual({
        taskId: testTaskId,
        difficulty: 'medium'
      });
    });

    it('should retrieve recent events in correct order', async () => {
      // Log multiple events
      await progressService.logRealtimeEvent(
        testUserId,
        sessionId,
        'event-1',
        { order: 1 }
      );

      await progressService.logRealtimeEvent(
        testUserId,
        sessionId,
        'event-2',
        { order: 2 }
      );

      await progressService.logRealtimeEvent(
        testUserId,
        sessionId,
        'event-3',
        { order: 3 }
      );

      const events = await progressService.getRecentEvents(testUserId, sessionId, 5);

      expect(events).toHaveLength(3);
      // Events should be in descending order (most recent first)
      expect(events[0].eventType).toBe('event-3');
      expect(events[1].eventType).toBe('event-2');
      expect(events[2].eventType).toBe('event-1');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing task attempt gracefully', async () => {
      await expect(
        progressService.completeTaskAttempt(
          'non-existent-id',
          '100.00',
          'completed'
        )
      ).rejects.toThrow('Task attempt not found');
    });

    it('should handle missing validation step gracefully', async () => {
      await expect(
        progressService.updateValidationStep(
          'non-existent-id',
          'passed'
        )
      ).rejects.toThrow('Validation step not found');
    });
  });
});

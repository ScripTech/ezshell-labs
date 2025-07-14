import { Router } from 'express';
import { progressService } from '../services/ProgressService';

const router = Router();

/**
 * Start a new lab session
 * POST /api/progress/sessions/start
 */
router.post('/sessions/start', async (req, res) => {
  try {
    const { userId, labId, enrollmentId } = req.body;

    if (!userId || !labId || !enrollmentId) {
      return res.status(400).json({
        error: 'Missing required fields: userId, labId, enrollmentId'
      });
    }

    const session = await progressService.startLabSession(userId, labId, enrollmentId);

    res.json({
      success: true,
      data: session,
      message: 'Lab session started successfully'
    });
  } catch (error) {
    console.error('Failed to start lab session:', error);
    res.status(500).json({
      error: 'Failed to start lab session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get active session for user
 * GET /api/progress/sessions/active/:userId/:labId
 */
router.get('/sessions/active/:userId/:labId', async (req, res) => {
  try {
    const { userId, labId } = req.params;

    const session = await progressService.getActiveSession(userId, labId);

    res.json({
      success: true,
      data: session,
      hasActiveSession: !!session
    });
  } catch (error) {
    console.error('Failed to get active session:', error);
    res.status(500).json({
      error: 'Failed to get active session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get learning insights for user
 * GET /api/progress/insights/:userId/:labId
 */
router.get('/insights/:userId/:labId', async (req, res) => {
  try {
    const { userId, labId } = req.params;

    const insights = await progressService.getLearningInsights(userId, labId);

    res.json({
      success: true,
      data: insights,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get learning insights:', error);
    res.status(500).json({
      error: 'Failed to get learning insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get real-time events for session
 * GET /api/progress/events/:userId/:sessionId
 */
router.get('/events/:userId/:sessionId', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const events = await progressService.getRecentEvents(userId, sessionId, limit);

    res.json({
      success: true,
      data: events,
      count: events.length,
      limit
    });
  } catch (error) {
    console.error('Failed to get real-time events:', error);
    res.status(500).json({
      error: 'Failed to get real-time events',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Start a task attempt
 * POST /api/progress/attempts/start
 */
router.post('/attempts/start', async (req, res) => {
  try {
    const { userId, taskId, sessionId } = req.body;

    if (!userId || !taskId || !sessionId) {
      return res.status(400).json({
        error: 'Missing required fields: userId, taskId, sessionId'
      });
    }

    const attempt = await progressService.startTaskAttempt(userId, taskId, sessionId);

    res.json({
      success: true,
      data: attempt,
      message: 'Task attempt started successfully'
    });
  } catch (error) {
    console.error('Failed to start task attempt:', error);
    res.status(500).json({
      error: 'Failed to start task attempt',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Complete a task attempt
 * POST /api/progress/attempts/:attemptId/complete
 */
router.post('/attempts/:attemptId/complete', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { score, status, validationResults, errorLogs } = req.body;

    if (!score || !status) {
      return res.status(400).json({
        error: 'Missing required fields: score, status'
      });
    }

    await progressService.completeTaskAttempt(
      attemptId,
      score,
      status,
      validationResults,
      errorLogs
    );

    res.json({
      success: true,
      message: 'Task attempt completed successfully'
    });
  } catch (error) {
    console.error('Failed to complete task attempt:', error);
    res.status(500).json({
      error: 'Failed to complete task attempt',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Log a real-time event
 * POST /api/progress/events/log
 */
router.post('/events/log', async (req, res) => {
  try {
    const { userId, sessionId, eventType, eventData, socketId, metadata } = req.body;

    if (!userId || !sessionId || !eventType) {
      return res.status(400).json({
        error: 'Missing required fields: userId, sessionId, eventType'
      });
    }

    await progressService.logRealtimeEvent(
      userId,
      sessionId,
      eventType,
      eventData,
      socketId,
      metadata
    );

    res.json({
      success: true,
      message: 'Event logged successfully'
    });
  } catch (error) {
    console.error('Failed to log event:', error);
    res.status(500).json({
      error: 'Failed to log event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get dashboard analytics (admin only)
 * GET /api/progress/analytics/dashboard
 */
router.get('/analytics/dashboard', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware

    // This would be calculated by the EnhancedWebSocketService
    const analytics = {
      activeUsers: 0, // Will be populated from EnhancedWebSocketService
      sessionsInProgress: 0,
      tasksBeingAttempted: 0,
      averageSessionTime: 0,
      topStrugglingTopics: [],
      recentCompletions: [],
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: analytics,
      message: 'Dashboard analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Failed to get dashboard analytics:', error);
    res.status(500).json({
      error: 'Failed to get dashboard analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

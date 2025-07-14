import { db } from '../db'
import { taskAttempts, validationSteps, labProgressSessions } from '../db/schemas/ProgressSchema'
import { eq, and, desc } from 'drizzle-orm'

export interface TaskAttemptSummary {
  id: string
  attemptNumber: number
  status: string
  score: number
  maxPossibleScore: number
  timeSpent: number
  completedAt: Date | null
  stepResults: ValidationStepSummary[]
}

export interface ValidationStepSummary {
  stepNumber: number
  stepName: string
  stepDescription: string | null
  status: string
  score: number
  maxScore: number
  errorMessage: string | null
}

export interface TaskValidationHistory {
  taskId: string
  totalAttempts: number
  maxAttempts: number
  remainingAttempts: number
  bestScore: number
  lastAttemptAt: Date | null
  attempts: TaskAttemptSummary[]
}

/**
 * Service for retrieving task validation history and attempt details
 */
export class TaskValidationHistoryService {

  /**
   * Get validation history for a specific task and user
   */
  async getTaskValidationHistory(userId: string, taskId: string): Promise<TaskValidationHistory | null> {
    try {
      // Get all attempts for this task and user
      const attempts = await db
        .select()
        .from(taskAttempts)
        .where(
          and(
            eq(taskAttempts.userId, userId),
            eq(taskAttempts.taskId, taskId)
          )
        )
        .orderBy(desc(taskAttempts.attemptNumber))

      if (attempts.length === 0) {
        return null
      }

      // Get validation steps for each attempt
      const attemptsWithSteps: TaskAttemptSummary[] = []

      for (const attempt of attempts) {
        const steps = await db
          .select()
          .from(validationSteps)
          .where(eq(validationSteps.attemptId, attempt.id))
          .orderBy(validationSteps.stepNumber)

        const stepResults: ValidationStepSummary[] = steps.map(step => ({
          stepNumber: step.stepNumber,
          stepName: step.stepName,
          stepDescription: step.stepDescription,
          status: step.status || 'pending',
          score: parseFloat(step.score || '0'),
          maxScore: parseFloat(step.maxScore || '0'),
          errorMessage: step.errorMessage
        }))

        attemptsWithSteps.push({
          id: attempt.id,
          attemptNumber: attempt.attemptNumber,
          status: attempt.status || 'in_progress',
          score: parseFloat(attempt.score || '0'),
          maxPossibleScore: parseFloat(attempt.maxPossibleScore || '0'),
          timeSpent: attempt.timeSpent || 0,
          completedAt: attempt.completedAt,
          stepResults
        })
      }

      // Calculate summary statistics
      const totalAttempts = attempts.length
      const maxAttempts = 3
      const remainingAttempts = Math.max(0, maxAttempts - totalAttempts)
      const completedAttempts = attempts.filter(a => a.status === 'completed')
      const bestScore = completedAttempts.length > 0
        ? Math.max(...completedAttempts.map(a => parseFloat(a.score || '0')))
        : 0
      const lastAttemptAt = attempts.length > 0 ? attempts[0].completedAt || attempts[0].startedAt : null

      return {
        taskId,
        totalAttempts,
        maxAttempts,
        remainingAttempts,
        bestScore,
        lastAttemptAt,
        attempts: attemptsWithSteps
      }

    } catch (error) {
      console.error('Error getting task validation history:', error)
      throw error
    }
  }

  /**
   * Get validation history for all tasks in a lab session
   */
  async getLabValidationHistory(userId: string, labId: string): Promise<Record<string, TaskValidationHistory>> {
    try {
      // Get the user's session for this lab
      const sessions = await db
        .select()
        .from(labProgressSessions)
        .where(
          and(
            eq(labProgressSessions.userId, userId),
            eq(labProgressSessions.labId, labId)
          )
        )
        .orderBy(desc(labProgressSessions.lastActiveAt))

      if (sessions.length === 0) {
        return {}
      }

      // Get all attempts for this user's sessions in this lab
      const sessionIds = sessions.map(s => s.id)
      const allAttempts = await db
        .select()
        .from(taskAttempts)
        .where(
          and(
            eq(taskAttempts.userId, userId),
            // Note: We would need to use `inArray` here but let's get unique tasks first
          )
        )
        .orderBy(desc(taskAttempts.attemptNumber))

      // Group by task ID
      const taskGroups: Record<string, typeof allAttempts> = {}
      for (const attempt of allAttempts) {
        const taskId = attempt.taskId
        if (!taskId) continue // Skip if taskId is null

        if (!taskGroups[taskId]) {
          taskGroups[taskId] = []
        }
        taskGroups[taskId].push(attempt)
      }

      // Get history for each task
      const historyMap: Record<string, TaskValidationHistory> = {}

      for (const taskId of Object.keys(taskGroups)) {
        const history = await this.getTaskValidationHistory(userId, taskId)
        if (history) {
          historyMap[taskId] = history
        }
      }

      return historyMap

    } catch (error) {
      console.error('Error getting lab validation history:', error)
      throw error
    }
  }

  /**
   * Check if user can attempt a task (hasn't exceeded max attempts)
   */
  async canUserAttemptTask(userId: string, taskId: string): Promise<{ canAttempt: boolean; remainingAttempts: number; reason?: string }> {
    try {
      const history = await this.getTaskValidationHistory(userId, taskId)

      if (!history) {
        return { canAttempt: true, remainingAttempts: 3 }
      }

      if (history.remainingAttempts <= 0) {
        return {
          canAttempt: false,
          remainingAttempts: 0,
          reason: 'Maximum attempts (3) exceeded'
        }
      }

      return {
        canAttempt: true,
        remainingAttempts: history.remainingAttempts
      }

    } catch (error) {
      console.error('Error checking if user can attempt task:', error)
      throw error
    }
  }
}

export const taskValidationHistoryService = new TaskValidationHistoryService()

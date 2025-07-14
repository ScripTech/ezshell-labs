'use server'

import { db } from "@/db"
import { labTaskProgress, labTasks, labEnrollments } from "@/db/schemas/LabSchema"
import { eq, and } from "drizzle-orm"
import { v4 as uuidv4 } from "uuid"

export interface ValidationStep {
  id: string
  description: string
  passed: boolean
  points: number
  errorMessage?: string
}

export interface ValidationResult {
  stepResults: ValidationStep[]
  totalScore: number
  maxScore: number
  passed: boolean
  attemptNumber: number
  remainingAttempts: number
}

export interface TaskProgressData {
  id: string
  userId: string
  labTaskId: string
  labEnrollmentId: string
  score: number
  completed: boolean
  attempts: number
  maxAttempts: number
  remainingAttempts: number
  canAttempt: boolean
  lastAttemptAt: Date | null
  validationResults: any[]
}

export class TaskValidationService {

  /**
   * Get current progress for a user's task
   */
  async getTaskProgress(userId: string, labTaskId: string, labEnrollmentId: string): Promise<TaskProgressData | null> {
    try {
      const progress = await db
        .select()
        .from(labTaskProgress)
        .where(
          and(
            eq(labTaskProgress.userId, userId),
            eq(labTaskProgress.labTaskId, labTaskId),
            eq(labTaskProgress.labEnrollmentId, labEnrollmentId)
          )
        )
        .limit(1)

      if (progress.length === 0) {
        return null
      }

      const record = progress[0]
      const attempts = record.attempts ?? 0
      const maxAttempts = record.maxAttempts ?? 3
      const score = record.score ?? 0
      const completed = record.completed ?? false
      const remainingAttempts = maxAttempts - attempts
      
      return {
        id: record.id,
        userId: record.userId!,
        labTaskId: record.labTaskId!,
        labEnrollmentId: record.labEnrollmentId!,
        score,
        completed,
        attempts,
        maxAttempts,
        remainingAttempts,
        canAttempt: remainingAttempts > 0 && !completed,
        lastAttemptAt: record.lastAttemptAt,
        validationResults: record.validationResults as any[] || []
      }
    } catch (error) {
      console.error('Error getting task progress:', error)
      throw new Error('Failed to get task progress')
    }
  }

  /**
   * Initialize progress record for a task if it doesn't exist
   */
  async initializeTaskProgress(userId: string, labTaskId: string, labEnrollmentId: string): Promise<TaskProgressData> {
    try {
      const existingProgress = await this.getTaskProgress(userId, labTaskId, labEnrollmentId)
      
      if (existingProgress) {
        return existingProgress
      }

      const progressId = uuidv4()
      
      await db.insert(labTaskProgress).values({
        id: progressId,
        userId,
        labTaskId,
        labEnrollmentId,
        score: 0,
        completed: false,
        attempts: 0,
        maxAttempts: 3,
        validationResults: [],
        createdAt: new Date(),
        updatedAt: new Date()
      })

      return {
        id: progressId,
        userId,
        labTaskId,
        labEnrollmentId,
        score: 0,
        completed: false,
        attempts: 0,
        maxAttempts: 3,
        remainingAttempts: 3,
        canAttempt: true,
        lastAttemptAt: null,
        validationResults: []
      }
    } catch (error) {
      console.error('Error initializing task progress:', error)
      throw new Error('Failed to initialize task progress')
    }
  }

  /**
   * Calculate score based on validation steps
   */
  private calculateScore(validationSteps: ValidationStep[], maxPoints: number): number {
    if (validationSteps.length === 0) return 0
    
    const totalPossiblePoints = validationSteps.reduce((sum, step) => sum + step.points, 0)
    const earnedPoints = validationSteps
      .filter(step => step.passed)
      .reduce((sum, step) => sum + step.points, 0)
    
    // Calculate percentage and apply to max points for this task
    const percentage = totalPossiblePoints > 0 ? earnedPoints / totalPossiblePoints : 0
    return Math.round(percentage * maxPoints)
  }

  /**
   * Record a validation attempt
   */
  async recordValidationAttempt(
    userId: string,
    labTaskId: string,
    labEnrollmentId: string,
    validationSteps: ValidationStep[]
  ): Promise<ValidationResult> {
    try {
      // Get current progress
      let progress = await this.getTaskProgress(userId, labTaskId, labEnrollmentId)
      
      if (!progress) {
        progress = await this.initializeTaskProgress(userId, labTaskId, labEnrollmentId)
      }

      // Check if user can still attempt
      if (!progress.canAttempt) {
        throw new Error(`Maximum attempts (${progress.maxAttempts}) reached for this task`)
      }

      if (progress.completed) {
        throw new Error('Task is already completed')
      }

      // Get task details for max points
      const task = await db
        .select()
        .from(labTasks)
        .where(eq(labTasks.id, labTaskId))
        .limit(1)

      if (task.length === 0) {
        throw new Error('Task not found')
      }

      const maxPoints = task[0].points
      const newAttempts = progress.attempts + 1
      const score = this.calculateScore(validationSteps, maxPoints)
      const allStepsPassed = validationSteps.every(step => step.passed)
      const isCompleted = allStepsPassed || newAttempts >= progress.maxAttempts

      // Prepare validation result for storage
      const validationResult = {
        attemptNumber: newAttempts,
        timestamp: new Date().toISOString(),
        steps: validationSteps,
        score,
        passed: allStepsPassed
      }

      // Update existing validation results
      const updatedValidationResults = [...progress.validationResults, validationResult]

      // Update progress record
      await db
        .update(labTaskProgress)
        .set({
          attempts: newAttempts,
          score: Math.max(progress.score, score), // Keep best score
          completed: isCompleted && allStepsPassed,
          completedAt: isCompleted && allStepsPassed ? new Date() : null,
          lastAttemptAt: new Date(),
          validationResults: updatedValidationResults,
          updatedAt: new Date()
        })
        .where(eq(labTaskProgress.id, progress.id))

      const remainingAttempts = progress.maxAttempts - newAttempts

      return {
        stepResults: validationSteps,
        totalScore: score,
        maxScore: maxPoints,
        passed: allStepsPassed,
        attemptNumber: newAttempts,
        remainingAttempts
      }

    } catch (error) {
      console.error('Error recording validation attempt:', error)
      throw error
    }
  }

  /**
   * Get validation history for a task
   */
  async getValidationHistory(userId: string, labTaskId: string, labEnrollmentId: string): Promise<any[]> {
    try {
      const progress = await this.getTaskProgress(userId, labTaskId, labEnrollmentId)
      return progress?.validationResults || []
    } catch (error) {
      console.error('Error getting validation history:', error)
      throw new Error('Failed to get validation history')
    }
  }

  /**
   * Reset task progress (admin function)
   */
  async resetTaskProgress(userId: string, labTaskId: string, labEnrollmentId: string): Promise<void> {
    try {
      await db
        .update(labTaskProgress)
        .set({
          attempts: 0,
          score: 0,
          completed: false,
          completedAt: null,
          lastAttemptAt: null,
          validationResults: [],
          updatedAt: new Date()
        })
        .where(
          and(
            eq(labTaskProgress.userId, userId),
            eq(labTaskProgress.labTaskId, labTaskId),
            eq(labTaskProgress.labEnrollmentId, labEnrollmentId)
          )
        )
    } catch (error) {
      console.error('Error resetting task progress:', error)
      throw new Error('Failed to reset task progress')
    }
  }
}

export const taskValidationService = new TaskValidationService()

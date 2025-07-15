import { Socket } from 'socket.io'
import { db } from '../db'
import { taskAttempts, validationSteps, labProgressSessions } from '../db/schemas/ProgressSchema'
import { labEnrollments } from '../db/schemas/LabSchema'
import { eq, and, desc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export interface ValidationStepResult {
  id: string
  description: string
  passed: boolean
  points: number
  errorMessage?: string
}

export interface SocketStepResult {
  step: string
  status: string
  message?: string
}

export interface ValidationContext {
  socket: Socket;
  questionId: string;
  validationQuestionId: string;
  userId: string;
  labId: string;
  labEnrollmentId: string;
  sessionId?: string;
}

/**
 * Service to integrate validation tracking with existing validation controllers
 * Uses direct database access instead of HTTP calls to frontend API
 */
export class ValidationTrackingService {
  private currentAttemptSteps: Map<string, SocketStepResult[]> = new Map()

  /**
   * Start tracking validation steps for a specific attempt
   */
  startStepTracking(attemptId: string) {
    this.currentAttemptSteps.set(attemptId, [])
  }

  /**
   * Add a validation step result to the current tracking (deprecated - use updateOrAddStepResult)
   */
  addStepResult(attemptId: string, stepResult: SocketStepResult) {
    this.updateOrAddStepResult(attemptId, stepResult)
  }

  /**
   * Complete step tracking and save to database
   */
  async completeStepTracking(attemptId: string) {
    const steps = this.currentAttemptSteps.get(attemptId) || []

    if (steps.length > 0) {
      await this.saveSocketSteps(attemptId, steps)
    }

    // Clean up tracking
    this.currentAttemptSteps.delete(attemptId)
  }

  /**
   * Get or create enrollment for user and lab
   */
  private async getOrCreateEnrollment(userId: string, labId: string): Promise<string> {
    try {
      // Try to find existing enrollment
      const existingEnrollment = await db
        .select()
        .from(labEnrollments)
        .where(
          and(
            eq(labEnrollments.userId, userId),
            eq(labEnrollments.labId, labId)
          )
        )
        .limit(1)

      if (existingEnrollment.length > 0) {
        return existingEnrollment[0].id
      }

      // Create new enrollment if none exists
      const enrollmentId = uuidv4()
      const newEnrollment = {
        id: enrollmentId,
        userId,
        labId,
        enrolledAt: new Date(),
        status: 'in_progress' as const,
        progress: 0
      }

      await db.insert(labEnrollments).values(newEnrollment)
      console.log(`Created new enrollment: ${enrollmentId} for user ${userId} and lab ${labId}`)

      return enrollmentId
    } catch (error) {
      console.error('Error getting or creating enrollment:', error)
      throw error
    }
  }

  /**
   * Get or create current lab session for the user
   */
  private async getCurrentSession(userId: string, labId: string, enrollmentId?: string) {
    try {
      // Get or create enrollment if not provided
      const actualEnrollmentId = enrollmentId || await this.getOrCreateEnrollment(userId, labId)

      // Try to find an active session
      const existingSessions = await db
        .select()
        .from(labProgressSessions)
        .where(
          and(
            eq(labProgressSessions.userId, userId),
            eq(labProgressSessions.labId, labId),
            eq(labProgressSessions.enrollmentId, actualEnrollmentId),
            eq(labProgressSessions.status, 'active')
          )
        )
        .orderBy(desc(labProgressSessions.lastActiveAt))
        .limit(1)

      if (existingSessions.length > 0) {
        // Update last active time
        const session = existingSessions[0]
        // Skip updating for now to avoid TypeScript issues
        return session
      }

      // Create new session if none exists
      const newSessionId = uuidv4()
      const defaultExpiryTime = new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours default
      const newSession = {
        id: newSessionId,
        userId,
        labId,
        enrollmentId: actualEnrollmentId,
        sessionName: `Session-${Date.now()}`,
        expiresAt: defaultExpiryTime, // Required field from frontend schema
        startedAt: new Date(),
        lastActiveAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.insert(labProgressSessions).values(newSession)
      console.log(`Created new session: ${newSessionId} for enrollment ${actualEnrollmentId}`)

      return newSession
    } catch (error) {
      console.error('Error getting or creating session:', error)
      throw error
    }
  }

  /**
   * Get the current attempt number for a task
   */
  private async getNextAttemptNumber(sessionId: string, taskId: string, userId: string): Promise<number> {
    const existingAttempts = await db
      .select()
      .from(taskAttempts)
      .where(
        and(
          eq(taskAttempts.sessionId, sessionId),
          eq(taskAttempts.taskId, taskId),
          eq(taskAttempts.userId, userId)
        )
      )
      .orderBy(desc(taskAttempts.attemptNumber))
      .limit(1)

    return existingAttempts.length > 0 ? existingAttempts[0].attemptNumber + 1 : 1
  }

  /**
   * Create a new task attempt record
   */
  private async createTaskAttempt(sessionId: string, taskId: string, userId: string, attemptNumber: number) {
    const attemptId = uuidv4()
    const attempt = {
      id: attemptId,
      sessionId,
      taskId,
      userId,
      attemptNumber,
      status: 'in_progress' as const,
      startedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await db.insert(taskAttempts).values(attempt)
    return attempt
  }

  /**
   * Save validation step results to database
   */
  private async saveValidationSteps(attemptId: string, stepResults: ValidationStepResult[]) {
    const steps = stepResults.map((result, index) => ({
      id: uuidv4(),
      attemptId,
      stepNumber: index + 1,
      stepName: result.id,
      stepDescription: result.description,
      status: result.passed ? 'passed' as const : 'failed' as const,
      startedAt: new Date(),
      completedAt: new Date(),
      score: result.passed ? result.points.toString() : '0',
      maxScore: result.points.toString(),
      errorMessage: result.errorMessage || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    if (steps.length > 0) {
      await db.insert(validationSteps).values(steps)
    }
  }

  /**
   * Save socket-emitted validation steps to database
   */
  private async saveSocketSteps(attemptId: string, socketSteps: SocketStepResult[]) {
    const steps = socketSteps.map((result, index) => ({
      id: uuidv4(),
      attemptId,
      stepNumber: index + 1,
      stepName: result.step.toLowerCase().replace(/\s+/g, '_'),
      stepDescription: result.step,
      status: this.mapSocketStatusToDbStatus(result.status),
      startedAt: new Date(),
      completedAt: new Date(),
      score: result.status === 'success' ? '10' : '0',
      maxScore: '10',
      errorMessage: result.message || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    if (steps.length > 0) {
      await db.insert(validationSteps).values(steps)
      console.log(`Saved ${steps.length} socket steps for attempt ${attemptId}`)
    }
  }

  /**
   * Map socket status to database status
   */
  private mapSocketStatusToDbStatus(socketStatus: string): 'passed' | 'failed' | 'pending' {
    switch (socketStatus) {
      case 'success':
        return 'passed'
      case 'failed':
      case 'error':
        return 'failed'
      case 'loading':
      default:
        return 'pending'
    }
  }

  /**
   * Update task attempt with final results
   */
  private async updateTaskAttempt(
    attemptId: string,
    results: ValidationStepResult[],
    totalPoints: number,
    maxPoints: number,
    passed: boolean
  ) {
    // Update task attempt with minimal fields to avoid TypeScript issues
    await db
      .update(taskAttempts)
      .set({
        score: totalPoints.toString(),
        maxPossibleScore: maxPoints.toString(),
        validationResult: {
          totalSteps: results.length,
          passedSteps: results.filter(r => r.passed).length,
          results: results
        }
      })
      .where(eq(taskAttempts.id, attemptId))
  }

  /**
   * Execute validation steps and track results using direct database access
   */
  async executeValidationWithTracking(
    context: ValidationContext,
    validationSteps: (() => Promise<ValidationStepResult>)[]
  ): Promise<void> {
    try {
      const { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId } = context

      // Emit validation start
      socket.emit("validation-start", { validationQuestionId });

      // Get current session (assuming labId can be extracted from context or passed separately)
      // For now, we'll extract it from questionId or pass it explicitly
      // const labId = this.extractLabIdFromQuestionId(questionId)
      console.log(
        `Extracted lab ID from question ID: ${userId} - ${labId} - ${questionId} - ${labEnrollmentId}`
      );
      const session = await this.getCurrentSession(userId, labId, labEnrollmentId)

      // Get next attempt number
      const attemptNumber = await this.getNextAttemptNumber(session.id, questionId, userId)

      // Check if user has exceeded max attempts (3)
      if (attemptNumber > 3) {
        socket.emit("validation-attempts-reached", {
          questionId,
          error: "Maximum attempts (3) exceeded for this task",
        });
        return
      }

      // Create new task attempt
      const attempt = await this.createTaskAttempt(session.id, questionId, userId, attemptNumber)

      // Start tracking steps for this attempt
      this.startStepTracking(attempt.id)

      // Execute all validation steps
      const results: ValidationStepResult[] = []

      for (const stepFunction of validationSteps) {
        try {
          const result = await stepFunction()
          results.push(result)

          // Emit step result in real-time
          socket.emit('validation-step-result', {
            questionId,
            stepId: result.id,
            passed: result.passed,
            description: result.description,
            points: result.points,
            errorMessage: result.errorMessage
          })

          // Add step result to tracking
          this.addStepResult(attempt.id, {
            step: result.description,
            status: result.passed ? 'success' : 'failed',
            message: result.errorMessage
          })
        } catch (error) {
          console.error('Validation step failed:', error)
          results.push({
            id: `step-${results.length + 1}`,
            description: 'Validation step failed',
            passed: false,
            points: 0,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          })

          // Add failed step to tracking
          this.addStepResult(attempt.id, {
            step: `step-${results.length + 1}`,
            status: 'failed',
            message: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      // Calculate final results
      const totalSteps = results.length
      const passedSteps = results.filter(r => r.passed).length
      const totalPoints = results.reduce((sum, r) => sum + (r.passed ? r.points : 0), 0)
      const maxPoints = results.reduce((sum, r) => sum + r.points, 0)
      const passed = passedSteps === totalSteps

      try {
        // Save validation steps to database
        await this.saveValidationSteps(attempt.id, results)

        // Update task attempt with final results
        await this.updateTaskAttempt(attempt.id, results, totalPoints, maxPoints, passed)

        // Calculate progressive scoring based on attempt number
        const progressiveScore = this.calculateProgressiveScore(totalPoints, maxPoints, attemptNumber)

        // Emit final validation result
        socket.emit('validation-completed', {
          questionId,
          passed,
          totalSteps,
          passedSteps,
          totalPoints,
          maxPoints,
          progressiveScore,
          results,
          tracking: {
            attemptNumber,
            remainingAttempts: Math.max(0, 3 - attemptNumber),
            totalScore: progressiveScore,
            sessionId: session.id,
            attemptId: attempt.id
          }
        })
      } catch (dbError) {
        console.error('Error saving validation results to database:', dbError)

        // Still emit results even if database save fails
        socket.emit('validation-completed', {
          questionId,
          passed,
          totalSteps,
          passedSteps,
          totalPoints,
          maxPoints,
          results,
          tracking: {
            attemptNumber,
            remainingAttempts: Math.max(0, 3 - attemptNumber),
            totalScore: totalPoints
          },
          trackingError: 'Failed to save validation tracking to database'
        })
      } finally {
        // Complete step tracking
        await this.completeStepTracking(attempt.id)
      }

    } catch (error) {
      console.error('Validation execution failed:', error)
      context.socket.emit('validation-error', {
        questionId: context.questionId,
        error: 'Validation failed due to system error'
      })
    }
  }

  /**
   * Enhanced validation execution that tracks individual socket steps
   * This method should be used by validation controllers to track each step
   */
  async executeValidationWithSocketTracking(
    context: ValidationContext,
    validationFunction: (trackedSocket: Socket) => Promise<boolean>
  ): Promise<void> {
    try {
      const { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId } = context

      // Emit validation start
      socket.emit("validation-start", { validationQuestionId });

      console.log(
        `Starting socket-tracked validation: ${userId} - ${labId} - ${questionId} - ${labEnrollmentId}`
      );

      // Get current session
      const session = await this.getCurrentSession(userId, labId, labEnrollmentId)

      // Get next attempt number
      const attemptNumber = await this.getNextAttemptNumber(session.id, questionId, userId)

      // Check if user has exceeded max attempts (3)
      if (attemptNumber > 3) {
        socket.emit("validation-attempts-reached", {
          questionId,
          error: "Maximum attempts (3) exceeded for this task",
        });
        return
      }

      // Create new task attempt
      const attempt = await this.createTaskAttempt(session.id, questionId, userId, attemptNumber)

      // Start step tracking for this attempt
      this.startStepTracking(attempt.id)

      // Create a tracked socket that intercepts step emissions
      const trackedSocket = this.createTrackedSocket(socket, attempt.id, validationQuestionId)

      // Execute the validation function with the tracked socket
      let overallSuccess = false
      try {
        overallSuccess = await validationFunction(trackedSocket)
      } catch (error) {
        console.error('Validation function failed:', error)
        overallSuccess = false
      }

      // Complete step tracking and save to database
      await this.completeStepTracking(attempt.id)

      // Get the tracked steps for final calculation
      const trackedSteps = this.currentAttemptSteps.get(attempt.id) || []
      const totalSteps = trackedSteps.length
      const passedSteps = trackedSteps.filter(step => step.status === 'success').length
      const totalPoints = passedSteps * 10 // 10 points per passed step
      const maxPoints = totalSteps * 10

      // Update task attempt with final results
      await this.updateTaskAttempt(attempt.id, [], totalPoints, maxPoints, overallSuccess)

      // Calculate progressive scoring based on attempt number
      const progressiveScore = this.calculateProgressiveScore(totalPoints, maxPoints, attemptNumber)

      // Emit final validation result
      socket.emit('validation-completed', {
        questionId,
        passed: overallSuccess,
        totalSteps,
        passedSteps,
        totalPoints,
        maxPoints,
        progressiveScore,
        results: trackedSteps.map(step => ({
          id: step.step.toLowerCase().replace(/\s+/g, '_'),
          description: step.step,
          passed: step.status === 'success',
          points: step.status === 'success' ? 10 : 0,
          errorMessage: step.message
        })),
        tracking: {
          attemptNumber,
          remainingAttempts: Math.max(0, 3 - attemptNumber),
          totalScore: progressiveScore,
          sessionId: session.id,
          attemptId: attempt.id
        }
      })

    } catch (error) {
      console.error('Socket-tracked validation execution failed:', error)
      context.socket.emit('validation-error', {
        questionId: context.questionId,
        error: 'Validation failed due to system error'
      })
    }
  }

  /**
   * Create a tracked socket that intercepts validation step emissions
   */
  private createTrackedSocket(originalSocket: Socket, attemptId: string, validationQuestionId: string): Socket {
    // Create a proxy socket that intercepts emit calls
    const trackedSocket = {
      ...originalSocket,
      emit: (event: string, data: any) => {
        // Check if this is a validation step emission
        if (event === `validation-${validationQuestionId}-step`) {
          // Only track final states (success, failed, error), ignore loading states
          if (data.status !== 'loading') {
            // Check if we already have a result for this step and update it
            this.updateOrAddStepResult(attemptId, {
              step: data.step,
              status: data.status,
              message: data.message
            })
          }
        }

        // Always emit to the original socket
        return originalSocket.emit(event, data)
      }
    } as Socket

    return trackedSocket
  }

  /**
   * Update existing step result or add new one (prevents duplicates)
   */
  private updateOrAddStepResult(attemptId: string, stepResult: SocketStepResult) {
    const steps = this.currentAttemptSteps.get(attemptId) || []

    // Find existing step with same name
    const existingIndex = steps.findIndex(step => step.step === stepResult.step)

    if (existingIndex !== -1) {
      // Update existing step
      steps[existingIndex] = stepResult
    } else {
      // Add new step
      steps.push(stepResult)
    }

    this.currentAttemptSteps.set(attemptId, steps)
  }

  /**
   * Calculate progressive score based on attempt number
   * 1st attempt: 100% of points
   * 2nd attempt: 75% of points
   * 3rd attempt: 50% of points
   */
  private calculateProgressiveScore(earnedPoints: number, maxPoints: number, attemptNumber: number): number {
    const percentage = earnedPoints / maxPoints
    let multiplier = 1.0

    switch (attemptNumber) {
      case 1:
        multiplier = 1.0
        break
      case 2:
        multiplier = 0.75
        break
      case 3:
        multiplier = 0.5
        break
      default:
        multiplier = 0
    }

    return Math.round(earnedPoints * multiplier)
  }

  /**
   * Extract lab ID from question ID (this might need adjustment based on your ID format)
   */
  private extractLabIdFromQuestionId(questionId: string): string {
    // This is a placeholder - adjust based on your actual ID format
    // For example, if questionId is "EX200-Lab1-Task1", extract "EX200-Lab1"
    const parts = questionId.split('-')
    if (parts.length >= 2) {
      return `${parts[0]}-${parts[1]}`
    }
    return questionId // fallback
  }

  /**
   * Create a validation step function
   */
  createValidationStep(
    id: string,
    description: string,
    points: number,
    validationFunction: () => Promise<boolean>
  ): () => Promise<ValidationStepResult> {
    return async (): Promise<ValidationStepResult> => {
      try {
        const passed = await validationFunction()
        return {
          id,
          description,
          passed,
          points,
          errorMessage: passed ? undefined : `${description} validation failed`
        }
      } catch (error) {
        return {
          id,
          description,
          passed: false,
          points,
          errorMessage: error instanceof Error ? error.message : 'Unknown validation error'
        }
      }
    }
  }

  /**
   * Retrieve all previous attempts and their validation steps for a task
   * This will be called when a task is loaded to show previous validation results
   */
  async getTaskValidationHistory(userId: string, labId: string, taskId: string, enrollmentId?: string) {
    try {
      // Get current session
      const session = await this.getCurrentSession(userId, labId, enrollmentId)

      // Get all attempts for this task in the current session
      const attempts = await db
        .select()
        .from(taskAttempts)
        .where(
          and(
            eq(taskAttempts.sessionId, session.id),
            eq(taskAttempts.taskId, taskId),
            eq(taskAttempts.userId, userId)
          )
        )
        .orderBy(desc(taskAttempts.attemptNumber))

      // If no attempts, return empty history
      if (attempts.length === 0) {
        return {
          attempts: [],
          hasAttempts: false,
          maxAttemptsReached: false,
          remainingAttempts: 3
        }
      }

      // Get validation steps for each attempt
      const attemptsWithSteps = await Promise.all(
        attempts.map(async (attempt) => {
          const steps = await db
            .select()
            .from(validationSteps)
            .where(eq(validationSteps.attemptId, attempt.id))
            .orderBy(validationSteps.stepNumber)

          return {
            ...attempt,
            steps: steps.map(step => ({
              stepNumber: step.stepNumber,
              stepName: step.stepName,
              stepDescription: step.stepDescription,
              status: step.status,
              passed: step.status === 'passed',
              score: step.score,
              maxScore: step.maxScore,
              errorMessage: step.errorMessage,
              completedAt: step.completedAt
            }))
          }
        })
      )

      const maxAttemptsReached = attempts.length >= 3
      const remainingAttempts = Math.max(0, 3 - attempts.length)

      return {
        attempts: attemptsWithSteps,
        hasAttempts: true,
        maxAttemptsReached,
        remainingAttempts,
        totalAttempts: attempts.length,
        sessionId: session.id
      }
    } catch (error) {
      console.error('Error retrieving task validation history:', error)
      return {
        attempts: [],
        hasAttempts: false,
        maxAttemptsReached: false,
        remainingAttempts: 3,
        error: 'Failed to retrieve validation history'
      }
    }
  }

  /**
   * Get the latest validation results for a task without performing new validation
   * This is useful when max attempts are reached and you want to show the last results
   */
  async getLatestValidationResults(userId: string, labId: string, taskId: string, enrollmentId?: string) {
    try {
      const history = await this.getTaskValidationHistory(userId, labId, taskId, enrollmentId)

      if (!history.hasAttempts || history.attempts.length === 0) {
        return null
      }

      // Get the most recent attempt (first in the array due to DESC ordering)
      const latestAttempt = history.attempts[0]

      return {
        attemptNumber: latestAttempt.attemptNumber,
        totalSteps: latestAttempt.steps.length,
        passedSteps: latestAttempt.steps.filter(step => step.passed).length,
        totalPoints: parseFloat(latestAttempt.score || '0'),
        maxPoints: parseFloat(latestAttempt.maxPossibleScore || '0'),
        passed: latestAttempt.status === 'completed',
        steps: latestAttempt.steps,
        completedAt: latestAttempt.completedAt,
        validationResult: latestAttempt.validationResult,
        maxAttemptsReached: history.maxAttemptsReached,
        remainingAttempts: history.remainingAttempts
      }
    } catch (error) {
      console.error('Error retrieving latest validation results:', error)
      return null
    }
  }
}

export const validationTrackingService = new ValidationTrackingService()

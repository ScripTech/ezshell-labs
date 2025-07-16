import { Socket } from 'socket.io'
import { db } from '../db'
import { taskAttempts, validationSteps, labProgressSessions } from '../db/schemas/ProgressSchema'
import { labEnrollments, labTaskProgress } from '../db/schemas/LabSchema'
import { eq, and, desc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { ScoringService } from './ScoringService'
import { ValidationResult, ScoreResult, ScoringConfig, SCORING_PRESETS } from '../interfaces/IScoring'

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
  /** Scoring configuration for this validation question */
  scoringConfig?: ScoringConfig;
  /** Question type for automatic scoring preset selection */
  questionType?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'CRITICAL';
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
   * Update or create lab_task_progress record with latest score and validation history
   */
  private async updateLabTaskProgress(
    userId: string,
    labTaskId: string,
    labEnrollmentId: string,
    attemptNumber: number,
    finalScore: number,
    maxAttempts: number,
    passed: boolean,
    currentAttemptData: any
  ) {
    try {
      // Check if record exists
      const existingProgress = await db
        .select({
          id: labTaskProgress.id,
          userId: labTaskProgress.userId,
          labTaskId: labTaskProgress.labTaskId,
          labEnrollmentId: labTaskProgress.labEnrollmentId,
          score: labTaskProgress.score,
          completed: labTaskProgress.completed,
          completedAt: labTaskProgress.completedAt,
          attempts: labTaskProgress.attempts,
          maxAttempts: labTaskProgress.maxAttempts,
          lastAttemptAt: labTaskProgress.lastAttemptAt,
          validationResults: labTaskProgress.validationResults,
          createdAt: labTaskProgress.createdAt,
          updatedAt: labTaskProgress.updatedAt
        })
        .from(labTaskProgress)
        .where(
          and(
            eq(labTaskProgress.userId, userId),
            eq(labTaskProgress.labTaskId, labTaskId),
            eq(labTaskProgress.labEnrollmentId, labEnrollmentId)
          )
        )
        .limit(1)

      // Get existing validation history or create new one
      let validationHistory: any = {
        attempts: [],
        totalAttempts: 0,
        hasAttempts: false,
        maxAttemptsReached: false,
        remainingAttempts: maxAttempts
      }

      if (existingProgress.length > 0 && existingProgress[0].validationResults) {
        validationHistory = existingProgress[0].validationResults as any
      }

      // Add current attempt to history
      validationHistory.attempts.unshift({
        id: uuidv4(),
        attemptNumber,
        status: passed ? 'completed' : 'failed',
        score: finalScore.toString(),
        maxPossibleScore: currentAttemptData.maxPossibleScore?.toString() || '100',
        completedAt: new Date().toISOString(),
        steps: currentAttemptData.steps || []
      })

      // Update validation history metadata
      validationHistory.totalAttempts = attemptNumber
      validationHistory.hasAttempts = true
      validationHistory.maxAttemptsReached = attemptNumber >= maxAttempts
      validationHistory.remainingAttempts = Math.max(0, maxAttempts - attemptNumber)

      // Keep only last 10 attempts to prevent bloat
      if (validationHistory.attempts.length > 10) {
        validationHistory.attempts = validationHistory.attempts.slice(0, 10)
      }

      const isCompleted = passed || attemptNumber >= maxAttempts
      const progressData = {
        score: Math.round(finalScore).toString(),
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null,
        attempts: attemptNumber,
        maxAttempts: maxAttempts,
        lastAttemptAt: new Date(),
        validationResults: validationHistory, // Save accumulated validation history
        updatedAt: new Date(),
      }

      if (existingProgress.length > 0) {
        // Update existing record
        await db
          .update(labTaskProgress)
          .set(progressData)
          .where(
            and(
              eq(labTaskProgress.userId, userId),
              eq(labTaskProgress.labTaskId, labTaskId),
              eq(labTaskProgress.labEnrollmentId, labEnrollmentId)
            )
          )
      } else {
        // Create new record
        await db.insert(labTaskProgress).values({
          id: uuidv4(),
          userId,
          labTaskId,
          labEnrollmentId,
          createdAt: new Date(),
          ...progressData,
        })
      }

      console.log(`Updated lab_task_progress: userId=${userId}, taskId=${labTaskId}, attempt=${attemptNumber}/${maxAttempts}, score=${finalScore}, completed=${isCompleted}, totalAttempts=${validationHistory.totalAttempts}`)
    } catch (error) {
      console.error('Error updating lab_task_progress:', error)
    }
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

        // Calculate enhanced score using ScoringService
        const passedStepsArray = results
          .map((result, index) => ({ stepNumber: index + 1, passed: result.passed }))
          .filter(step => step.passed)
          .map(step => step.stepNumber);

        const scoreResult = this.calculateEnhancedScore(
          passedSteps,
          totalSteps,
          attemptNumber,
          context,
          passedStepsArray
        );

        // Get scoring config for compatibility
        const scoringConfig = this.getScoringConfig(context);

        // Update task attempt with enhanced scoring results
        await this.updateTaskAttempt(attempt.id, results, scoreResult.final_score, scoringConfig.basePoints, passed)

        // Update lab_task_progress with latest score and validation history
        const validationHistoryData = {
          attempts: [{
            attemptNumber,
            score: scoreResult.final_score,
            maxPossibleScore: scoringConfig.basePoints,
            passed,
            completedAt: new Date().toISOString(),
            steps: results.map((result, index) => ({
              stepNumber: index + 1,
              stepName: result.description,
              stepDescription: result.description,
              status: result.passed ? 'success' : 'failed',
              passed: result.passed,
              message: result.errorMessage || '',
              completedAt: new Date().toISOString()
            }))
          }],
          lastAttempt: {
            attemptNumber,
            score: scoreResult.final_score,
            passed,
            enhancedScoring: scoreResult
          }
        }

        await this.updateLabTaskProgress(
          userId,
          questionId, // Using questionId as labTaskId - may need to map this properly
          labEnrollmentId,
          attemptNumber,
          scoreResult.final_score,
          3, // maxAttempts
          passed,
          validationHistoryData
        )

        // Calculate legacy progressive scoring for backward compatibility
        const legacyProgressiveScore = this.calculateProgressiveScore(totalPoints, maxPoints, attemptNumber)

        // Emit final validation result with enhanced scoring
        socket.emit('validation-completed', {
          questionId,
          passed,
          totalSteps,
          passedSteps,
          totalPoints,
          maxPoints,
          progressiveScore: legacyProgressiveScore, // Legacy for backward compatibility
          // Enhanced scoring information
          enhancedScoring: {
            scorePercent: scoreResult.score_percent,
            finalScore: scoreResult.final_score,
            basePoints: scoringConfig.basePoints,
            attemptNumber: scoreResult.attempt_number,
            penaltyApplied: scoreResult.penalty_applied,
            bonusApplied: scoreResult.bonus_applied,
            minimumFloorApplied: scoreResult.minimum_floor_applied,
            stepBreakdown: scoreResult.step_breakdown
          },
          results: results.map((result, index) => {
            const stepBreakdown = scoreResult.step_breakdown[index];
            return {
              ...result,
              enhancedPoints: stepBreakdown ? stepBreakdown.points : result.points,
              percentage: stepBreakdown ? stepBreakdown.percentage : 0,
              weight: stepBreakdown ? stepBreakdown.weight : 0
            };
          }),
          tracking: {
            attemptNumber,
            remainingAttempts: Math.max(0, 3 - attemptNumber),
            totalScore: legacyProgressiveScore, // Legacy score
            enhancedTotalScore: scoreResult.final_score, // Enhanced score
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

      // Get the tracked steps for final calculation BEFORE completing step tracking
      const trackedSteps = this.currentAttemptSteps.get(attempt.id) || []
      const totalSteps = trackedSteps.length
      const passedSteps = trackedSteps.filter(step => step.status === 'success').length

      // Complete step tracking and save to database (this will delete from Map)
      await this.completeStepTracking(attempt.id)

      // Create array of passed step numbers for detailed analysis
      const passedStepsArray = trackedSteps
        .map((step, index) => ({ stepNumber: index + 1, passed: step.status === 'success' }))
        .filter(step => step.passed)
        .map(step => step.stepNumber);

      // Calculate enhanced score using ScoringService
      const scoreResult = this.calculateEnhancedScore(
        passedSteps,
        totalSteps,
        attemptNumber,
        context,
        passedStepsArray
      );

      // Legacy calculations for backward compatibility
      const totalPoints = passedSteps * 10 // 10 points per passed step
      const maxPoints = totalSteps * 10
      const legacyProgressiveScore = this.calculateProgressiveScore(totalPoints, maxPoints, attemptNumber)

      // Get scoring config for max points calculation
      const scoringConfig = this.getScoringConfig(context);

      // Update task attempt with enhanced scoring results
      await this.updateTaskAttempt(
        attempt.id,
        [],
        scoreResult.final_score, // Use enhanced final score
        scoringConfig.basePoints, // Use scoring config base points
        overallSuccess
      )

      // Update lab_task_progress with latest score and validation history
      const validationHistoryData = {
        attempts: [{
          attemptNumber,
          score: scoreResult.final_score,
          maxPossibleScore: scoringConfig.basePoints,
          passed: overallSuccess,
          completedAt: new Date().toISOString(),
          steps: trackedSteps.map((step, index) => ({
            stepNumber: index + 1,
            stepName: step.step,
            stepDescription: step.step,
            status: step.status,
            passed: step.status === 'success',
            message: step.message,
            completedAt: new Date().toISOString()
          }))
        }],
        lastAttempt: {
          attemptNumber,
          score: scoreResult.final_score,
          passed: overallSuccess,
          enhancedScoring: scoreResult
        }
      }

      await this.updateLabTaskProgress(
        userId,
        questionId, // Using questionId as labTaskId - may need to map this properly
        labEnrollmentId,
        attemptNumber,
        scoreResult.final_score,
        3, // maxAttempts
        overallSuccess,
        validationHistoryData
      )

      // Emit final validation result with enhanced scoring data
      socket.emit('validation-completed', {
        questionId,
        passed: overallSuccess,
        totalSteps,
        passedSteps,
        totalPoints,
        maxPoints,
        progressiveScore: legacyProgressiveScore, // Keep for backward compatibility
        // Enhanced scoring information
        enhancedScoring: {
          scorePercent: scoreResult.score_percent,
          finalScore: scoreResult.final_score,
          basePoints: scoringConfig.basePoints,
          attemptNumber: scoreResult.attempt_number,
          penaltyApplied: scoreResult.penalty_applied,
          bonusApplied: scoreResult.bonus_applied,
          minimumFloorApplied: scoreResult.minimum_floor_applied,
          stepBreakdown: scoreResult.step_breakdown
        },
        results: trackedSteps.map((step, index) => {
          const stepBreakdown = scoreResult.step_breakdown[index];
          return {
            id: step.step.toLowerCase().replace(/\s+/g, '_'),
            description: step.step,
            passed: step.status === 'success',
            points: stepBreakdown ? stepBreakdown.points : (step.status === 'success' ? 10 : 0),
            percentage: stepBreakdown ? stepBreakdown.percentage : 0,
            weight: stepBreakdown ? stepBreakdown.weight : 0,
            errorMessage: step.message
          };
        }),
        tracking: {
          attemptNumber,
          remainingAttempts: Math.max(0, 3 - attemptNumber),
          totalScore: legacyProgressiveScore, // Legacy score
          enhancedTotalScore: scoreResult.final_score, // Enhanced score
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
          // Emit enhanced validation-step event for real-time frontend updates
          originalSocket.emit('validation-step', {
            step: data.step,
            status: data.status,
            message: data.message,
            stepNumber: this.getStepNumber(attemptId, data.step),
            attemptId: attemptId
          })

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
   * Get step number for a given step name in the current attempt
   */
  private getStepNumber(attemptId: string, stepName: string): number {
    const steps = this.currentAttemptSteps.get(attemptId) || []
    const existingIndex = steps.findIndex(step => step.step === stepName)
    return existingIndex !== -1 ? existingIndex + 1 : steps.length + 1
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
  /**
   * Enhanced scoring calculation using the ScoringService
   * Replaces the basic progressive score calculation with sophisticated algorithm
   */
  private calculateEnhancedScore(
    passedSteps: number,
    totalSteps: number,
    attemptNumber: number,
    context: ValidationContext,
    passedStepsArray?: number[]
  ): ScoreResult {
    // Get scoring configuration
    const scoringConfig = this.getScoringConfig(context);

    // Prepare validation result for scoring service
    const validationResult: ValidationResult = {
      stepsPassed: passedSteps,
      totalSteps,
      attemptNumber,
      config: scoringConfig,
      passedSteps: passedStepsArray,
      questionId: context.questionId,
      userId: context.userId
    };

    // Calculate score using enhanced scoring service
    return ScoringService.calculateScore(validationResult);
  }

  /**
   * Get scoring configuration for the current validation context
   */
  private getScoringConfig(context: ValidationContext): ScoringConfig {
    // Use explicit scoring config if provided
    if (context.scoringConfig) {
      return context.scoringConfig;
    }

    // Use question type preset if available
    if (context.questionType) {
      return ScoringService.getScoringConfig(context.questionType);
    }

    // Default to BASIC preset for backward compatibility
    return ScoringService.getScoringConfig('BASIC');
  }

  /**
   * Legacy method kept for backward compatibility
   * @deprecated Use calculateEnhancedScore instead
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

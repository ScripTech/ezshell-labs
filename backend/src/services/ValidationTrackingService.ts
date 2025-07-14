import { Socket } from 'socket.io'

export interface ValidationStepResult {
  id: string
  description: string
  passed: boolean
  points: number
  errorMessage?: string
}

export interface ValidationContext {
  socket: Socket
  questionId: string
  userId: string
  labEnrollmentId: string
  sessionId?: string
}

/**
 * Service to integrate validation tracking with existing validation controllers
 */
export class ValidationTrackingService {
  
  /**
   * Execute validation steps and track results
   */
  async executeValidationWithTracking(
    context: ValidationContext,
    validationSteps: (() => Promise<ValidationStepResult>)[]
  ): Promise<void> {
    try {
      const { socket, questionId, userId, labEnrollmentId } = context
      
      // Emit validation start
      socket.emit('validation-start', { questionId })
      
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
        } catch (error) {
          console.error('Validation step failed:', error)
          results.push({
            id: `step-${results.length + 1}`,
            description: 'Validation step failed',
            passed: false,
            points: 0,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      // Calculate final results
      const totalSteps = results.length
      const passedSteps = results.filter(r => r.passed).length
      const totalPoints = results.reduce((sum, r) => sum + (r.passed ? r.points : 0), 0)
      const maxPoints = results.reduce((sum, r) => sum + r.points, 0)
      const passed = passedSteps === totalSteps

      // Send results to frontend for tracking
      try {
        const trackingResponse = await fetch(`${process.env.FRONTEND_URL}/api/task-validation/${questionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${context.sessionId}` // You'll need to pass session token
          },
          body: JSON.stringify({
            labEnrollmentId,
            validationSteps: results.map(r => ({
              id: r.id,
              description: r.description,
              passed: r.passed,
              points: r.points,
              errorMessage: r.errorMessage
            }))
          })
        })

        if (trackingResponse.ok) {
          const trackingResult = await trackingResponse.json()
          
          // Emit final validation result
          socket.emit('validation-completed', {
            questionId,
            passed,
            totalSteps,
            passedSteps,
            totalPoints,
            maxPoints,
            results,
            tracking: {
              attemptNumber: trackingResult.attemptNumber,
              remainingAttempts: trackingResult.remainingAttempts,
              totalScore: trackingResult.totalScore
            }
          })
        } else {
          throw new Error('Failed to track validation results')
        }
      } catch (trackingError) {
        console.error('Error tracking validation:', trackingError)
        
        // Still emit results even if tracking fails
        socket.emit('validation-completed', {
          questionId,
          passed,
          totalSteps,
          passedSteps,
          totalPoints,
          maxPoints,
          results,
          tracking: null,
          trackingError: 'Failed to save validation tracking'
        })
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
}

export const validationTrackingService = new ValidationTrackingService()
